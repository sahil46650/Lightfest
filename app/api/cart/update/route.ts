import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { handleApiError, successResponse, Errors } from "@/lib/api/errors"
import { CartUpdateRequest, CartUpdateResponse, CartItem } from "@/lib/api/types"
import {
  CART_EXPIRY_MS,
  validateInventoryAvailability,
  updateInventoryLocks,
  calculateServiceFee,
  getBookingLocks,
} from "@/lib/booking"
import { calculateDiscount, getPromoCodeDetails } from "@/lib/booking/promo"

/**
 * Request validation schema
 */
const updateSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
  updates: z.record(z.string(), z.number().int().min(0).max(10)),
})

/**
 * POST /api/cart/update
 *
 * Update cart quantities for a draft booking
 * Creates/updates/deletes inventory locks as needed
 *
 * Request body:
 * - bookingId: string - The draft booking ID
 * - updates: Record<ticketTypeId, quantity> - Map of ticket type IDs to new quantities
 *   - Setting quantity to 0 removes the item from cart
 *
 * Response:
 * - cart: CartItem[] - Updated cart
 * - subtotal: number - Cart subtotal before fees/discounts
 * - serviceFee: number - Service fee (37% of subtotal)
 * - discount: number - Promo code discount amount
 * - total: number - Final total
 * - expiresAt: string - Updated expiration time
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const { bookingId, updates } = updateSchema.parse(body)

    // Fetch draft booking
    const draftBooking = await prisma.draftBooking.findUnique({
      where: { id: bookingId },
      include: {
        promoCode: true,
      },
    })

    if (!draftBooking) {
      throw Errors.bookingNotFound()
    }

    // Check expiration
    if (draftBooking.expiresAt < new Date()) {
      throw Errors.bookingExpired()
    }

    // Validate inventory availability for all requested quantities
    await validateInventoryAvailability(updates, bookingId)

    // Fetch ticket type details for the updates
    const ticketTypeIds = Object.keys(updates)
    const ticketTypes = await prisma.ticketType.findMany({
      where: {
        id: { in: ticketTypeIds },
        eventId: draftBooking.eventId,
      },
      select: {
        id: true,
        name: true,
        price: true,
      },
    })

    // Verify all ticket types belong to the same event
    if (ticketTypes.length !== ticketTypeIds.length) {
      throw Errors.validation("Some ticket types are invalid or don't belong to this event")
    }

    // Create ticket type lookup
    const ticketTypeMap = new Map(ticketTypes.map((tt) => [tt.id, tt]))

    // Build new cart from updates
    const newCart: CartItem[] = []
    for (const [ticketTypeId, quantity] of Object.entries(updates)) {
      if (quantity > 0) {
        const ticketType = ticketTypeMap.get(ticketTypeId)
        if (ticketType) {
          newCart.push({
            ticketTypeId,
            ticketName: ticketType.name,
            price: Number(ticketType.price),
            quantity,
          })
        }
      }
    }

    // Update inventory locks
    await updateInventoryLocks(bookingId, updates)

    // Calculate new expiration time (extends cart lifetime)
    const expiresAt = new Date(Date.now() + CART_EXPIRY_MS)

    // Update draft booking
    await prisma.draftBooking.update({
      where: { id: bookingId },
      data: {
        cart: JSON.stringify(newCart),
        expiresAt,
      },
    })

    // Calculate totals
    const subtotal = newCart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const serviceFee = calculateServiceFee(subtotal)
    const discount = calculateDiscount(draftBooking.promoCode, subtotal)
    const total = subtotal + serviceFee - discount

    return successResponse<CartUpdateResponse>({
      cart: newCart,
      subtotal,
      serviceFee,
      discount,
      total,
      expiresAt: expiresAt.toISOString(),
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * GET /api/cart/update
 *
 * Get current cart state with calculated totals
 *
 * Query params:
 * - bookingId: string - The draft booking ID
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get("bookingId")

    if (!bookingId) {
      throw Errors.invalidRequest("bookingId is required")
    }

    // Fetch draft booking
    const draftBooking = await prisma.draftBooking.findUnique({
      where: { id: bookingId },
      include: {
        promoCode: true,
      },
    })

    if (!draftBooking) {
      throw Errors.bookingNotFound()
    }

    // Check expiration
    if (draftBooking.expiresAt < new Date()) {
      throw Errors.bookingExpired()
    }

    // Parse cart
    const cart = JSON.parse(draftBooking.cart) as CartItem[]

    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const serviceFee = calculateServiceFee(subtotal)
    const discount = calculateDiscount(draftBooking.promoCode, subtotal)
    const total = subtotal + serviceFee - discount

    return successResponse<CartUpdateResponse>({
      cart,
      subtotal,
      serviceFee,
      discount,
      total,
      expiresAt: draftBooking.expiresAt.toISOString(),
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/cart/update
 *
 * Clear the cart (remove all items and locks)
 *
 * Request body:
 * - bookingId: string - The draft booking ID
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { bookingId } = z.object({ bookingId: z.string() }).parse(body)

    // Fetch draft booking
    const draftBooking = await prisma.draftBooking.findUnique({
      where: { id: bookingId },
    })

    if (!draftBooking) {
      throw Errors.bookingNotFound()
    }

    // Delete all inventory locks
    await prisma.inventoryLock.deleteMany({
      where: { draftBookingId: bookingId },
    })

    // Clear cart in draft booking
    await prisma.draftBooking.update({
      where: { id: bookingId },
      data: {
        cart: JSON.stringify([]),
      },
    })

    return successResponse<CartUpdateResponse>({
      cart: [],
      subtotal: 0,
      serviceFee: 0,
      discount: 0,
      total: 0,
      expiresAt: draftBooking.expiresAt.toISOString(),
    })
  } catch (error) {
    return handleApiError(error)
  }
}
