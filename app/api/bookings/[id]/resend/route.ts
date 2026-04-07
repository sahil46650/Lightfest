import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { handleApiError, successResponse, Errors } from "@/lib/api/errors"
import { EmailTemplate, EmailStatus } from "@prisma/client"

/**
 * Request validation schema
 */
const resendSchema = z.object({
  email: z.string().email().optional(), // Override recipient email
})

/**
 * POST /api/bookings/[id]/resend
 *
 * Resend the booking confirmation email
 *
 * Path params:
 * - id: string - Booking ID
 *
 * Request body (optional):
 * - email: string - Override recipient email (must validate as email)
 *
 * This creates a new email log entry that will be processed
 * by the email worker (Phase 6).
 *
 * Response:
 * - success: boolean
 * - message: string
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Parse optional request body
    let overrideEmail: string | undefined
    try {
      const body = await request.json()
      const parsed = resendSchema.parse(body)
      overrideEmail = parsed.email
    } catch {
      // No body or invalid body, use default email
    }

    // Fetch booking
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        status: true,
        confirmationNumber: true,
        event: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!booking) {
      throw Errors.bookingNotFound()
    }

    // Determine recipient email
    const recipientEmail = overrideEmail || booking.email

    // Check rate limiting - prevent spamming
    const recentEmails = await prisma.emailLog.count({
      where: {
        bookingId: id,
        templateType: EmailTemplate.BOOKING_CONFIRMATION,
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
        },
      },
    })

    if (recentEmails >= 3) {
      throw Errors.validation(
        "Too many resend requests. Please wait 5 minutes before trying again."
      )
    }

    // Create email log entry
    await prisma.emailLog.create({
      data: {
        bookingId: booking.id,
        recipientEmail,
        templateType: EmailTemplate.BOOKING_CONFIRMATION,
        status: EmailStatus.PENDING,
        subject: `Booking Confirmation - ${booking.event.name}`,
      },
    })

    return successResponse(
      {
        bookingId: id,
        recipientEmail,
      },
      `Confirmation email will be sent to ${recipientEmail}`
    )
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * GET /api/bookings/[id]/resend
 *
 * Get email history for a booking
 *
 * Path params:
 * - id: string - Booking ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verify booking exists
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!booking) {
      throw Errors.bookingNotFound()
    }

    // Fetch email logs
    const emailLogs = await prisma.emailLog.findMany({
      where: { bookingId: id },
      select: {
        id: true,
        recipientEmail: true,
        templateType: true,
        status: true,
        subject: true,
        sentAt: true,
        attempts: true,
        error: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    })

    return successResponse({
      bookingId: id,
      emails: emailLogs.map((log) => ({
        id: log.id,
        recipientEmail: log.recipientEmail,
        templateType: log.templateType,
        status: log.status,
        subject: log.subject,
        sentAt: log.sentAt?.toISOString() || null,
        attempts: log.attempts,
        error: log.error,
        createdAt: log.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    return handleApiError(error)
  }
}
