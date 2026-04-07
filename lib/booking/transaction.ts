import { prisma } from "@/lib/prisma"
import { Prisma, BookingStatus, EmailTemplate, EmailStatus, CheckoutStep } from "@prisma/client"
import { Errors, ApiError } from "@/lib/api/errors"
import {
  getAvailableInventory,
  releaseInventoryLocks,
  calculateServiceFee,
  SERVICE_FEE_RATE,
} from "./inventory"
import { calculateDiscount, incrementPromoCodeUsage } from "./promo"
import { generateQRCode } from "@/lib/qr-code/generator"
import { CartItem } from "@/lib/api/types"

/**
 * Result of a successful booking confirmation
 */
export interface BookingConfirmationResult {
  bookingId: string
  confirmationNumber: string
  email: string
  firstName: string
  lastName: string
  total: number
  ticketCount: number
  eventName: string
  eventDate: Date
}

/**
 * Personal info parsed from draft booking JSON
 */
interface ParsedPersonalInfo {
  email: string
  firstName: string
  lastName: string
  phone: string
  countryCode?: string
  createAccount?: boolean
  password?: string
}

/**
 * Attendee info parsed from draft booking JSON
 */
interface ParsedAttendeeInfo {
  name: string
  email: string
  addOns?: Array<{ name: string; price: number }>
}

/**
 * Main booking confirmation transaction
 * This is the atomic operation that converts a draft booking to a confirmed booking
 *
 * Steps:
 * 1. Fetch and validate draft booking
 * 2. Validate all inventory locks still valid
 * 3. Create Booking record
 * 4. Create Ticket records for each item
 * 5. Decrement ticket type availability
 * 6. Update promo code usage
 * 7. Delete inventory locks
 * 8. Delete draft booking
 * 9. Create email log for confirmation
 */
export async function confirmBooking(
  draftBookingId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<BookingConfirmationResult> {
  return await prisma.$transaction(async (tx) => {
    // Step 1: Fetch draft booking with locks
    const draftBooking = await tx.draftBooking.findUnique({
      where: { id: draftBookingId },
      include: {
        inventoryLocks: {
          include: {
            ticketType: true,
          },
        },
        promoCode: true,
      },
    })

    if (!draftBooking) {
      throw Errors.bookingNotFound()
    }

    // Check if booking has expired
    if (draftBooking.expiresAt < new Date()) {
      throw Errors.bookingExpired()
    }

    // Validate required data
    if (!draftBooking.personalInfo) {
      throw Errors.validation("Personal information is required")
    }

    // Parse JSON fields
    const cart = JSON.parse(draftBooking.cart) as CartItem[]
    const personalInfo = JSON.parse(draftBooking.personalInfo) as ParsedPersonalInfo
    const attendees = draftBooking.attendees
      ? (JSON.parse(draftBooking.attendees) as Record<string, ParsedAttendeeInfo>)
      : {}

    if (cart.length === 0) {
      throw Errors.validation("Cart cannot be empty")
    }

    // Step 2: Validate inventory - check that locks match availability
    for (const lock of draftBooking.inventoryLocks) {
      // Verify lock hasn't expired
      if (lock.expiresAt < new Date()) {
        throw Errors.inventoryLockExpired()
      }

      // Get current availability (excluding our own locks)
      const ticketType = await tx.ticketType.findUnique({
        where: { id: lock.ticketTypeId },
      })

      if (!ticketType) {
        throw Errors.notFound(`Ticket type ${lock.ticketType.name}`)
      }

      // Get total locks from other bookings
      const otherLocks = await tx.inventoryLock.aggregate({
        where: {
          ticketTypeId: lock.ticketTypeId,
          draftBookingId: { not: draftBookingId },
          expiresAt: { gt: new Date() },
        },
        _sum: { quantity: true },
      })

      const otherLockedQuantity = otherLocks._sum.quantity || 0
      const actualAvailable = ticketType.quantityAvailable - otherLockedQuantity

      if (lock.quantity > actualAvailable) {
        throw Errors.insufficientInventory(lock.ticketType.name, actualAvailable)
      }
    }

    // Fetch event details
    const event = await tx.event.findUnique({
      where: { id: draftBooking.eventId },
    })

    if (!event) {
      throw Errors.notFound("Event")
    }

    // Step 3: Calculate financial details
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const discount = calculateDiscount(draftBooking.promoCode, subtotal)
    const serviceFee = calculateServiceFee(subtotal)
    const total = subtotal + serviceFee - discount

    // Step 4: Create Booking record
    const booking = await tx.booking.create({
      data: {
        eventId: draftBooking.eventId,
        status: BookingStatus.CONFIRMED,
        email: personalInfo.email,
        firstName: personalInfo.firstName,
        lastName: personalInfo.lastName,
        phone: personalInfo.phone,
        subtotal: new Prisma.Decimal(subtotal),
        discount: new Prisma.Decimal(discount),
        serviceFee: new Prisma.Decimal(serviceFee),
        total: new Prisma.Decimal(total),
        promoCodeId: draftBooking.promoCodeId,
        ipAddress,
        userAgent,
        confirmedAt: new Date(),
      },
    })

    // Step 5: Create Ticket records and decrement inventory
    let ticketIndex = 0
    for (const cartItem of cart) {
      const ticketType = await tx.ticketType.findUnique({
        where: { id: cartItem.ticketTypeId },
      })

      if (!ticketType) {
        throw Errors.notFound(`Ticket type ${cartItem.ticketName}`)
      }

      // Create individual tickets for each unit in the cart
      for (let i = 0; i < cartItem.quantity; i++) {
        const ticketKey = `${cartItem.ticketTypeId}-${i}`
        const attendeeInfo = attendees[ticketKey]

        // Generate QR code
        const qrCode = generateQRCode(booking.id, ticketType.id, ticketIndex)

        // Calculate ticket price including any add-ons
        let ticketPrice = cartItem.price
        let addOnsJson: string | null = null

        if (attendeeInfo?.addOns && attendeeInfo.addOns.length > 0) {
          const addOnsTotal = attendeeInfo.addOns.reduce((sum, a) => sum + a.price, 0)
          ticketPrice += addOnsTotal
          addOnsJson = JSON.stringify(attendeeInfo.addOns)
        }

        await tx.ticket.create({
          data: {
            bookingId: booking.id,
            ticketTypeId: cartItem.ticketTypeId,
            price: new Prisma.Decimal(ticketPrice),
            qrCode,
            attendeeName: attendeeInfo?.name || `${personalInfo.firstName} ${personalInfo.lastName}`,
            attendeeEmail: attendeeInfo?.email || personalInfo.email,
            addOnsJson,
          },
        })

        ticketIndex++
      }

      // Decrement availability and increment sold count
      await tx.ticketType.update({
        where: { id: cartItem.ticketTypeId },
        data: {
          quantityAvailable: { decrement: cartItem.quantity },
          quantitySold: { increment: cartItem.quantity },
        },
      })
    }

    // Step 6: Update promo code usage
    if (draftBooking.promoCodeId) {
      await incrementPromoCodeUsage(draftBooking.promoCodeId, tx)
    }

    // Step 7: Delete inventory locks
    await tx.inventoryLock.deleteMany({
      where: { draftBookingId },
    })

    // Step 8: Delete draft booking
    await tx.draftBooking.delete({
      where: { id: draftBookingId },
    })

    // Step 9: Create email log for confirmation email
    await tx.emailLog.create({
      data: {
        bookingId: booking.id,
        recipientEmail: personalInfo.email,
        templateType: EmailTemplate.BOOKING_CONFIRMATION,
        status: EmailStatus.PENDING,
        subject: `Booking Confirmation - ${event.name}`,
      },
    })

    // Calculate total tickets
    const totalTickets = cart.reduce((sum, item) => sum + item.quantity, 0)

    return {
      bookingId: booking.id,
      confirmationNumber: booking.confirmationNumber,
      email: personalInfo.email,
      firstName: personalInfo.firstName,
      lastName: personalInfo.lastName,
      total,
      ticketCount: totalTickets,
      eventName: event.name,
      eventDate: event.date,
    }
  }, {
    // Use Serializable isolation for the highest level of consistency
    // This prevents any concurrent modifications during the transaction
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    maxWait: 10000, // Wait up to 10 seconds to start the transaction
    timeout: 30000, // Transaction must complete within 30 seconds
  })
}

/**
 * Get booking details by ID
 */
export async function getBookingById(bookingId: string) {
  return await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      event: true,
      tickets: {
        include: {
          ticketType: true,
        },
      },
      promoCode: true,
    },
  })
}

/**
 * Get booking details by confirmation number
 */
export async function getBookingByConfirmationNumber(confirmationNumber: string) {
  return await prisma.booking.findUnique({
    where: { confirmationNumber },
    include: {
      event: true,
      tickets: {
        include: {
          ticketType: true,
        },
      },
      promoCode: true,
    },
  })
}

/**
 * Cancel a booking and restore inventory
 */
export async function cancelBooking(
  bookingId: string,
  reason?: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: {
        tickets: true,
      },
    })

    if (!booking) {
      throw Errors.bookingNotFound()
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw Errors.validation(`Cannot cancel booking with status ${booking.status}`)
    }

    // Group tickets by type to restore inventory
    const ticketCounts = new Map<string, number>()
    for (const ticket of booking.tickets) {
      const count = ticketCounts.get(ticket.ticketTypeId) || 0
      ticketCounts.set(ticket.ticketTypeId, count + 1)
    }

    // Restore inventory
    for (const [ticketTypeId, count] of ticketCounts) {
      await tx.ticketType.update({
        where: { id: ticketTypeId },
        data: {
          quantityAvailable: { increment: count },
          quantitySold: { decrement: count },
        },
      })
    }

    // Update booking status
    await tx.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED },
    })

    // Create email log for cancellation notification
    await tx.emailLog.create({
      data: {
        bookingId: booking.id,
        recipientEmail: booking.email,
        templateType: EmailTemplate.BOOKING_CONFIRMATION, // We'd want a BOOKING_CANCELLED type ideally
        status: EmailStatus.PENDING,
        subject: `Booking Cancelled - ${booking.confirmationNumber}`,
      },
    })
  })
}
