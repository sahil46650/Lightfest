import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { handleApiError, successResponse, Errors } from "@/lib/api/errors"
import { getBookingById, getBookingByConfirmationNumber, cancelBooking } from "@/lib/booking"

/**
 * GET /api/bookings/[id]
 *
 * Get booking details by ID or confirmation number
 *
 * Path params:
 * - id: string - Booking ID or confirmation number
 *
 * Query params:
 * - type: "id" | "confirmation" - How to interpret the ID (default: "id")
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "id"

    // Fetch booking based on type
    const booking =
      type === "confirmation"
        ? await getBookingByConfirmationNumber(id)
        : await getBookingById(id)

    if (!booking) {
      throw Errors.bookingNotFound()
    }

    // Format response
    const response = {
      id: booking.id,
      confirmationNumber: booking.confirmationNumber,
      status: booking.status,
      event: {
        id: booking.event.id,
        name: booking.event.name,
        date: booking.event.date.toISOString(),
        location: booking.event.location,
        address: booking.event.address,
      },
      contact: {
        email: booking.email,
        firstName: booking.firstName,
        lastName: booking.lastName,
        phone: booking.phone,
      },
      tickets: booking.tickets.map((ticket) => ({
        id: ticket.id,
        ticketType: ticket.ticketType.name,
        price: Number(ticket.price),
        attendeeName: ticket.attendeeName,
        attendeeEmail: ticket.attendeeEmail,
        qrCode: ticket.qrCode,
        addOns: ticket.addOnsJson ? JSON.parse(ticket.addOnsJson) : null,
      })),
      financials: {
        subtotal: Number(booking.subtotal),
        discount: Number(booking.discount),
        serviceFee: Number(booking.serviceFee),
        total: Number(booking.total),
      },
      promoCode: booking.promoCode
        ? {
            code: booking.promoCode.code,
            discountType: booking.promoCode.discountType,
            discountValue: Number(booking.promoCode.discountValue),
          }
        : null,
      createdAt: booking.createdAt.toISOString(),
      confirmedAt: booking.confirmedAt?.toISOString() || null,
    }

    return successResponse(response)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/bookings/[id]
 *
 * Cancel a booking and restore inventory
 *
 * Path params:
 * - id: string - Booking ID
 *
 * Request body (optional):
 * - reason: string - Cancellation reason
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    let reason: string | undefined
    try {
      const body = await request.json()
      reason = body.reason
    } catch {
      // No body provided, that's fine
    }

    await cancelBooking(id, reason)

    return successResponse(
      { bookingId: id },
      "Booking has been cancelled successfully"
    )
  } catch (error) {
    return handleApiError(error)
  }
}
