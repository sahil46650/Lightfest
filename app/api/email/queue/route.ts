import { NextRequest } from "next/server"
import { handleApiError, successResponse, Errors } from "@/lib/api/errors"
import { processEmailQueue, getQueueStats, cleanupOldEmailLogs } from "@/lib/email/queue"
import { isEmailServiceConfigured, getEmailServiceStatus } from "@/lib/email/resend"

/**
 * Cron secret for authentication
 */
const CRON_SECRET = process.env.CRON_SECRET

/**
 * POST /api/email/queue
 *
 * Process pending emails from the queue
 * This endpoint is designed to be called by a cron job every minute
 *
 * Headers:
 * - Authorization: Bearer <CRON_SECRET>
 * - x-vercel-cron: 1 (Vercel cron protection header)
 *
 * Actions:
 * 1. Find all PENDING emails that are ready to send
 * 2. Build context from database for each email
 * 3. Render React Email template
 * 4. Send via Resend API
 * 5. Update status (SENT/FAILED with retry logic)
 *
 * Query Parameters:
 * - cleanup=true: Also run cleanup of old email logs (30+ days)
 *
 * Response:
 * - processed: number - Total emails processed
 * - sent: number - Successfully sent
 * - failed: number - Failed to send
 * - errors: array - Error details for failed emails
 *
 * Schedule: Run every minute via Vercel Cron
 *
 * Example cron configuration (vercel.json):
 * {
 *   "crons": [
 *     {
 *       "path": "/api/email/queue",
 *       "schedule": "* * * * *"
 *     }
 *   ]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate cron request
    const authHeader = request.headers.get("authorization")
    const isVercelCron = request.headers.get("x-vercel-cron") === "1"
    const isDevelopment = process.env.NODE_ENV === "development"

    // In development, allow without auth for testing
    if (!isDevelopment) {
      const isAuthorized =
        isVercelCron ||
        (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`)

      if (!isAuthorized) {
        throw Errors.unauthorized("Invalid cron authorization")
      }
    }

    // Check if email service is configured
    if (!isEmailServiceConfigured()) {
      return successResponse(
        {
          skipped: true,
          reason: "Email service not configured (RESEND_API_KEY not set)",
        },
        "Email queue processing skipped"
      )
    }

    // Process the email queue
    const result = await processEmailQueue()

    // Optionally run cleanup of old logs
    const { searchParams } = new URL(request.url)
    let cleanedUp = 0
    if (searchParams.get("cleanup") === "true") {
      cleanedUp = await cleanupOldEmailLogs(30)
    }

    // Log the results
    console.log(
      `[Email Queue] Processed: ${result.processed}, Sent: ${result.sent}, Failed: ${result.failed}`
    )

    return successResponse(
      {
        ...result,
        ...(cleanedUp > 0 && { cleanedUp }),
        processedAt: new Date().toISOString(),
      },
      `Email queue processed: ${result.sent} sent, ${result.failed} failed`
    )
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * GET /api/email/queue
 *
 * Get email queue statistics and service status
 * Useful for monitoring and debugging
 *
 * Headers:
 * - Authorization: Bearer <CRON_SECRET>
 *
 * Response:
 * - serviceStatus: object - Email service configuration status
 * - queueStats: object - Pending/sent/failed counts
 */
export async function GET(request: NextRequest) {
  try {
    // Same auth check as POST
    const authHeader = request.headers.get("authorization")
    const isVercelCron = request.headers.get("x-vercel-cron") === "1"
    const isDevelopment = process.env.NODE_ENV === "development"

    if (!isDevelopment) {
      const isAuthorized =
        isVercelCron ||
        (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`)

      if (!isAuthorized) {
        throw Errors.unauthorized("Invalid authorization")
      }
    }

    // Get service status and queue stats
    const serviceStatus = getEmailServiceStatus()
    const queueStats = await getQueueStats()

    return successResponse({
      serviceStatus,
      queueStats,
      checkTime: new Date().toISOString(),
    })
  } catch (error) {
    return handleApiError(error)
  }
}
