import { NextRequest } from "next/server"
import { z } from "zod"
import { handleApiError, successResponse, Errors } from "@/lib/api/errors"
import { BookingConfirmRequest, BookingConfirmResponse } from "@/lib/api/types"
import { confirmBooking } from "@/lib/booking"

/**
 * Request validation schema
 */
const confirmSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
})

/**
 * POST /api/bookings/confirm
 *
 * Confirm a booking using an atomic transaction
 *
 * This is the critical endpoint that:
 * 1. Validates the draft booking exists and hasn't expired
 * 2. Validates all inventory locks are still valid
 * 3. Creates the Booking record with all financial details
 * 4. Creates Ticket records for each item in the cart
 * 5. Decrements ticket type availability
 * 6. Updates promo code usage count
 * 7. Deletes inventory locks
 * 8. Deletes the draft booking
 * 9. Creates an email log for the confirmation email
 *
 * If any step fails, the entire transaction rolls back.
 *
 * Request body:
 * - bookingId: string - The draft booking ID to confirm
 *
 * Response:
 * - bookingId: string - The confirmed booking ID
 * - confirmationNumber: string - Unique confirmation number
 * - email: string - Customer email
 * - total: number - Final total amount
 * - ticketCount: number - Number of tickets
 *
 * Error responses:
 * - 400: Validation failed (empty cart, missing personal info)
 * - 404: Booking not found
 * - 409: Inventory conflict (not enough tickets available)
 * - 410: Booking expired
 * - 500: Transaction failed
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const { bookingId } = confirmSchema.parse(body)

    // Get request metadata for audit trail
    const forwardedFor = request.headers.get("x-forwarded-for")
    const ipAddress = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : request.headers.get("x-real-ip") || "unknown"
    const userAgent = request.headers.get("user-agent") || undefined

    // Perform the atomic booking confirmation
    const result = await confirmBooking(bookingId, ipAddress, userAgent)

    return successResponse<BookingConfirmResponse>(
      {
        bookingId: result.bookingId,
        confirmationNumber: result.confirmationNumber,
        email: result.email,
        total: result.total,
        ticketCount: result.ticketCount,
      },
      `Booking confirmed! Your confirmation number is ${result.confirmationNumber}`
    )
  } catch (error) {
    return handleApiError(error)
  }
}
