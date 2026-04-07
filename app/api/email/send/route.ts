import { NextRequest } from "next/server"
import { z } from "zod"
import { handleApiError, successResponse, Errors, fromZodError } from "@/lib/api/errors"
import { prisma } from "@/lib/prisma"
import { EmailTemplate, EmailStatus } from "@prisma/client"
import {
  queueEmail,
  queueBookingConfirmation,
  queueEventReminder,
  queueAbandonedCart,
} from "@/lib/email/queue"
import { isEmailServiceConfigured } from "@/lib/email/resend"
import { buildPasswordResetContext, buildWelcomeContext } from "@/lib/email/utils"
import { getServerSession } from "next-auth"
import authOptions from "@/lib/auth/config"

/**
 * Request body schema for sending emails
 */
const SendEmailSchema = z.object({
  templateType: z.nativeEnum(EmailTemplate),
  recipientEmail: z.string().email("Invalid email address"),
  // Optional: specific IDs for context building
  bookingId: z.string().uuid().optional(),
  draftBookingId: z.string().uuid().optional(),
  // For password reset and welcome emails
  userName: z.string().optional(),
  resetToken: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
})

/**
 * POST /api/email/send
 *
 * Manually queue an email for sending (admin endpoint)
 * This allows admins to trigger emails manually for testing or re-sending
 *
 * Authentication: Admin session required
 *
 * Body:
 * - templateType: EmailTemplate - Type of email to send
 * - recipientEmail: string - Recipient email address
 * - bookingId?: string - For BOOKING_CONFIRMATION and EVENT_REMINDER
 * - draftBookingId?: string - For ABANDONED_CART
 * - userName?: string - For PASSWORD_RESET and WELCOME
 * - resetToken?: string - For PASSWORD_RESET
 * - expiresAt?: string - For PASSWORD_RESET (ISO datetime)
 *
 * Response:
 * - emailLogId: string - ID of the queued email
 * - message: string - Confirmation message
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate - require admin session
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      throw Errors.unauthorized("Authentication required")
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== "ADMIN") {
      throw Errors.forbidden("Admin access required")
    }

    // Check if email service is configured
    if (!isEmailServiceConfigured()) {
      throw Errors.invalidRequest(
        "Email service not configured. Please set RESEND_API_KEY environment variable."
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const parseResult = SendEmailSchema.safeParse(body)

    if (!parseResult.success) {
      throw fromZodError(parseResult.error)
    }

    const { templateType, recipientEmail, bookingId, draftBookingId, userName, resetToken, expiresAt } =
      parseResult.data

    let emailLogId: string

    // Queue the appropriate email based on template type
    switch (templateType) {
      case EmailTemplate.BOOKING_CONFIRMATION: {
        if (!bookingId) {
          throw Errors.validation("bookingId is required for BOOKING_CONFIRMATION emails", {
            bookingId: ["Required"],
          })
        }
        // Verify booking exists
        const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
          select: { id: true, email: true },
        })
        if (!booking) {
          throw Errors.notFound("Booking")
        }
        const result = await queueBookingConfirmation(bookingId, recipientEmail || booking.email)
        emailLogId = result.id
        break
      }

      case EmailTemplate.EVENT_REMINDER: {
        if (!bookingId) {
          throw Errors.validation("bookingId is required for EVENT_REMINDER emails", {
            bookingId: ["Required"],
          })
        }
        // Verify booking exists
        const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
          select: { id: true, email: true },
        })
        if (!booking) {
          throw Errors.notFound("Booking")
        }
        const result = await queueEventReminder(bookingId, recipientEmail || booking.email)
        emailLogId = result.id
        break
      }

      case EmailTemplate.ABANDONED_CART: {
        if (!draftBookingId) {
          throw Errors.validation("draftBookingId is required for ABANDONED_CART emails", {
            draftBookingId: ["Required"],
          })
        }
        // Verify draft booking exists
        const draftBooking = await prisma.draftBooking.findUnique({
          where: { id: draftBookingId },
          select: { id: true },
        })
        if (!draftBooking) {
          throw Errors.notFound("Draft booking")
        }
        const result = await queueAbandonedCart(draftBookingId, recipientEmail)
        emailLogId = result.id
        break
      }

      case EmailTemplate.PASSWORD_RESET: {
        if (!userName || !resetToken) {
          throw Errors.validation(
            "userName and resetToken are required for PASSWORD_RESET emails",
            {
              userName: !userName ? ["Required"] : [],
              resetToken: !resetToken ? ["Required"] : [],
            }
          )
        }
        const context = buildPasswordResetContext(
          userName,
          recipientEmail,
          resetToken,
          expiresAt ? new Date(expiresAt) : new Date(Date.now() + 24 * 60 * 60 * 1000)
        )
        const result = await queueEmail({
          recipientEmail,
          templateType: EmailTemplate.PASSWORD_RESET,
          context,
        })
        emailLogId = result.id
        break
      }

      case EmailTemplate.WELCOME: {
        if (!userName) {
          throw Errors.validation("userName is required for WELCOME emails", {
            userName: ["Required"],
          })
        }
        const context = buildWelcomeContext(userName, recipientEmail)
        const result = await queueEmail({
          recipientEmail,
          templateType: EmailTemplate.WELCOME,
          context,
        })
        emailLogId = result.id
        break
      }

      default:
        throw Errors.invalidRequest(`Unknown template type: ${templateType}`)
    }

    return successResponse(
      {
        emailLogId,
        templateType,
        recipientEmail,
        status: EmailStatus.PENDING,
        queuedAt: new Date().toISOString(),
      },
      `Email queued successfully. It will be sent in the next processing cycle.`
    )
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * GET /api/email/send
 *
 * Get email log history (admin endpoint)
 * Useful for debugging and monitoring email delivery
 *
 * Query Parameters:
 * - status: EmailStatus filter (PENDING, SENT, FAILED, BOUNCED)
 * - templateType: EmailTemplate filter
 * - limit: number (default: 50, max: 100)
 * - offset: number (default: 0)
 *
 * Response:
 * - emails: array - Email log entries
 * - total: number - Total count matching filters
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate - require admin session
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      throw Errors.unauthorized("Authentication required")
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== "ADMIN") {
      throw Errors.forbidden("Admin access required")
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") as EmailStatus | null
    const templateType = searchParams.get("templateType") as EmailTemplate | null
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100)
    const offset = parseInt(searchParams.get("offset") || "0", 10)

    // Build where clause
    const where: Record<string, unknown> = {}
    if (status && Object.values(EmailStatus).includes(status)) {
      where.status = status
    }
    if (templateType && Object.values(EmailTemplate).includes(templateType)) {
      where.templateType = templateType
    }

    // Fetch emails and count
    const [emails, total] = await Promise.all([
      prisma.emailLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        select: {
          id: true,
          bookingId: true,
          recipientEmail: true,
          templateType: true,
          status: true,
          subject: true,
          error: true,
          sentAt: true,
          attempts: true,
          nextRetryAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.emailLog.count({ where }),
    ])

    return successResponse({
      emails,
      total,
      limit,
      offset,
      hasMore: offset + emails.length < total,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
