/**
 * Email Queue Processor
 *
 * This module processes pending emails from the queue and sends them via Resend.
 * It handles:
 * - Fetching pending emails with rate limiting
 * - Building email context from database
 * - Sending emails with React Email templates
 * - Retry logic with exponential backoff
 * - Status updates (SENT, FAILED)
 *
 * Designed to run every minute via Vercel cron job.
 */

import { prisma } from "@/lib/prisma"
import { EmailTemplate, EmailStatus } from "@prisma/client"
import { sendEmail, isEmailServiceConfigured } from "./resend"
import {
  getEmailTemplate,
  getEmailSubject,
  validateContext,
  EmailContext,
} from "./templates"
import {
  buildBookingConfirmationContext,
  buildEventReminderContext,
  buildAbandonedCartContext,
  calculateNextRetryTime,
  shouldRetryEmail,
} from "./utils"
import { EmailQueueResult, EmailLogWithContext } from "./types"

/**
 * Maximum number of emails to process per cron run
 * Keeps execution time under Vercel's serverless function timeout
 */
const MAX_EMAILS_PER_RUN = 10

/**
 * Maximum retry attempts before marking email as permanently failed
 */
const MAX_RETRY_ATTEMPTS = 3

/**
 * Process all pending emails in the queue
 *
 * This function is called by the cron job every minute.
 * It finds pending emails, builds their context, renders templates,
 * and sends them via Resend.
 *
 * @returns EmailQueueResult with processing statistics
 */
export async function processEmailQueue(): Promise<EmailQueueResult> {
  const result: EmailQueueResult = {
    processed: 0,
    sent: 0,
    failed: 0,
    errors: [],
  }

  // Check if email service is configured
  if (!isEmailServiceConfigured()) {
    console.warn("Email service not configured. Skipping queue processing.")
    return result
  }

  try {
    // Find pending emails that are ready to send
    // Include emails that have never been attempted, or where nextRetryAt has passed
    const pendingEmails = await prisma.emailLog.findMany({
      where: {
        status: EmailStatus.PENDING,
        OR: [
          { nextRetryAt: null },
          { nextRetryAt: { lte: new Date() } },
        ],
      },
      take: MAX_EMAILS_PER_RUN,
      orderBy: [
        { nextRetryAt: "asc" }, // Process older retries first
        { createdAt: "asc" }, // Then by creation date
      ],
    })

    console.log(`[EmailQueue] Found ${pendingEmails.length} pending emails to process`)

    for (const emailLog of pendingEmails) {
      result.processed++

      try {
        await processEmailLogEntry(emailLog as EmailLogWithContext, result)
      } catch (error) {
        console.error(`[EmailQueue] Unexpected error processing email ${emailLog.id}:`, error)
        result.failed++
        result.errors.push({
          emailLogId: emailLog.id,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    console.log(
      `[EmailQueue] Completed: ${result.sent} sent, ${result.failed} failed, ${result.processed} processed`
    )
  } catch (error) {
    console.error("[EmailQueue] Fatal error processing queue:", error)
    throw error
  }

  return result
}

/**
 * Process a single email log entry
 *
 * @param emailLog - The email log entry to process
 * @param result - The result object to update
 */
async function processEmailLogEntry(
  emailLog: EmailLogWithContext,
  result: EmailQueueResult
): Promise<void> {
  const startTime = Date.now()
  console.log(`[EmailQueue] Processing email ${emailLog.id} (${emailLog.templateType})`)

  try {
    // Build context from database based on template type
    const context = await getEmailContext(emailLog)

    if (!context) {
      // If we can't build context, the referenced entity may have been deleted
      await markEmailAsFailed(
        emailLog.id,
        "Could not build email context - referenced data may be missing"
      )
      result.failed++
      result.errors.push({
        emailLogId: emailLog.id,
        error: "Missing context data",
      })
      return
    }

    // Validate context matches template type
    if (!validateContext(emailLog.templateType, context)) {
      await markEmailAsFailed(emailLog.id, "Context validation failed for template type")
      result.failed++
      result.errors.push({
        emailLogId: emailLog.id,
        error: "Context validation failed",
      })
      return
    }

    // Get the React Email template component
    const template = getEmailTemplate(emailLog.templateType, context)

    if (!template) {
      await markEmailAsFailed(emailLog.id, `No template found for type: ${emailLog.templateType}`)
      result.failed++
      result.errors.push({
        emailLogId: emailLog.id,
        error: "Template not found",
      })
      return
    }

    // Get subject line (may be overridden from context or use default)
    const subject = emailLog.subject || getEmailSubject(emailLog.templateType, context)

    // Attempt to send via Resend
    const sendResult = await sendEmail(emailLog.recipientEmail, subject, template, {
      tags: [
        { name: "template", value: emailLog.templateType },
        { name: "email_log_id", value: emailLog.id },
        ...(emailLog.bookingId ? [{ name: "booking_id", value: emailLog.bookingId }] : []),
      ],
    })

    if (sendResult.success) {
      // Update status to SENT
      await prisma.emailLog.update({
        where: { id: emailLog.id },
        data: {
          status: EmailStatus.SENT,
          sentAt: new Date(),
          error: null,
          content: sendResult.messageId || null, // Store Resend message ID in content field
        },
      })

      const duration = Date.now() - startTime
      console.log(
        `[EmailQueue] Email ${emailLog.id} sent successfully to ${emailLog.recipientEmail} (${duration}ms)`
      )
      result.sent++
    } else {
      // Handle send failure
      await handleSendFailure(emailLog, sendResult.error || "Unknown send error")
      result.failed++
      result.errors.push({
        emailLogId: emailLog.id,
        error: sendResult.error || "Unknown send error",
      })
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error(`[EmailQueue] Error processing email ${emailLog.id}:`, errorMessage)

    await handleSendFailure(emailLog, errorMessage)
    result.failed++
    result.errors.push({
      emailLogId: emailLog.id,
      error: errorMessage,
    })
  }
}

/**
 * Build email context based on template type
 *
 * @param emailLog - The email log entry
 * @returns Email context or null if not found
 */
async function getEmailContext(emailLog: EmailLogWithContext): Promise<EmailContext | null> {
  // First, check if we have stored context JSON
  if (emailLog.content) {
    try {
      const storedContext = JSON.parse(emailLog.content)
      if (storedContext.templateType) {
        return storedContext as EmailContext
      }
    } catch {
      // Content might be a Resend message ID, not JSON - that's fine, rebuild context
    }
  }

  // Build fresh context from database based on template type
  switch (emailLog.templateType) {
    case EmailTemplate.BOOKING_CONFIRMATION:
      if (emailLog.bookingId) {
        return buildBookingConfirmationContext(emailLog.bookingId)
      }
      return null

    case EmailTemplate.EVENT_REMINDER:
      if (emailLog.bookingId) {
        return buildEventReminderContext(emailLog.bookingId)
      }
      return null

    case EmailTemplate.ABANDONED_CART:
      // For abandoned cart, bookingId actually contains draftBookingId
      if (emailLog.bookingId) {
        return buildAbandonedCartContext(emailLog.bookingId)
      }
      return null

    case EmailTemplate.PASSWORD_RESET:
    case EmailTemplate.WELCOME:
      // These templates require pre-stored context as they don't have a bookingId reference
      // The context should have been stored when the email was queued
      if (emailLog.content) {
        try {
          return JSON.parse(emailLog.content) as EmailContext
        } catch {
          return null
        }
      }
      return null

    default:
      console.error(`[EmailQueue] Unknown template type: ${emailLog.templateType}`)
      return null
  }
}

/**
 * Handle a failed email send attempt
 *
 * Implements exponential backoff retry logic:
 * - First retry: 15 minutes
 * - Second retry: 30 minutes
 * - Third retry: 60 minutes
 * - After 3 failures: mark as FAILED permanently
 *
 * @param emailLog - The email log entry
 * @param errorMessage - Error message from the send attempt
 */
async function handleSendFailure(
  emailLog: EmailLogWithContext,
  errorMessage: string
): Promise<void> {
  const newAttempts = emailLog.attempts + 1

  if (shouldRetryEmail(newAttempts, MAX_RETRY_ATTEMPTS)) {
    // Schedule retry with exponential backoff
    const nextRetryAt = calculateNextRetryTime(newAttempts - 1)

    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: {
        attempts: newAttempts,
        nextRetryAt,
        error: errorMessage,
        // Keep status as PENDING for retry
      },
    })

    console.log(
      `[EmailQueue] Email ${emailLog.id} failed (attempt ${newAttempts}/${MAX_RETRY_ATTEMPTS}). ` +
        `Retry scheduled for ${nextRetryAt.toISOString()}`
    )
  } else {
    // Max retries exceeded, mark as permanently failed
    await markEmailAsFailed(emailLog.id, `Max retries exceeded. Last error: ${errorMessage}`)
    console.log(`[EmailQueue] Email ${emailLog.id} permanently failed after ${newAttempts} attempts`)
  }
}

/**
 * Mark an email as permanently failed
 *
 * @param emailLogId - The email log ID
 * @param errorMessage - Error message to store
 */
async function markEmailAsFailed(emailLogId: string, errorMessage: string): Promise<void> {
  await prisma.emailLog.update({
    where: { id: emailLogId },
    data: {
      status: EmailStatus.FAILED,
      error: errorMessage,
    },
  })
}

/**
 * Queue a new email for sending
 *
 * Creates a new EmailLog entry with PENDING status.
 * The email will be picked up by the next queue processing run.
 *
 * @param data - Email data to queue
 * @returns The created EmailLog entry
 */
export async function queueEmail(data: {
  bookingId?: string
  recipientEmail: string
  templateType: EmailTemplate
  subject?: string
  context?: EmailContext
}): Promise<{ id: string }> {
  const emailLog = await prisma.emailLog.create({
    data: {
      bookingId: data.bookingId || null,
      recipientEmail: data.recipientEmail,
      templateType: data.templateType,
      status: EmailStatus.PENDING,
      subject: data.subject || null,
      content: data.context ? JSON.stringify(data.context) : null,
      attempts: 0,
      nextRetryAt: null,
    },
    select: { id: true },
  })

  console.log(
    `[EmailQueue] Queued email ${emailLog.id} (${data.templateType}) for ${data.recipientEmail}`
  )

  return emailLog
}

/**
 * Queue a booking confirmation email
 *
 * Convenience function specifically for booking confirmations.
 * Context will be built from the booking when processed.
 *
 * @param bookingId - The booking ID
 * @param recipientEmail - Recipient email address
 * @returns The created EmailLog entry
 */
export async function queueBookingConfirmation(
  bookingId: string,
  recipientEmail: string
): Promise<{ id: string }> {
  return queueEmail({
    bookingId,
    recipientEmail,
    templateType: EmailTemplate.BOOKING_CONFIRMATION,
  })
}

/**
 * Queue an event reminder email
 *
 * @param bookingId - The booking ID
 * @param recipientEmail - Recipient email address
 * @returns The created EmailLog entry
 */
export async function queueEventReminder(
  bookingId: string,
  recipientEmail: string
): Promise<{ id: string }> {
  return queueEmail({
    bookingId,
    recipientEmail,
    templateType: EmailTemplate.EVENT_REMINDER,
  })
}

/**
 * Queue an abandoned cart email
 *
 * @param draftBookingId - The draft booking ID
 * @param recipientEmail - Recipient email address
 * @returns The created EmailLog entry
 */
export async function queueAbandonedCart(
  draftBookingId: string,
  recipientEmail: string
): Promise<{ id: string }> {
  return queueEmail({
    bookingId: draftBookingId, // Store draft ID in bookingId field
    recipientEmail,
    templateType: EmailTemplate.ABANDONED_CART,
  })
}

/**
 * Queue a password reset email
 *
 * Context must be provided since there's no booking reference.
 *
 * @param recipientEmail - Recipient email address
 * @param context - Password reset context
 * @returns The created EmailLog entry
 */
export async function queuePasswordReset(
  recipientEmail: string,
  context: EmailContext
): Promise<{ id: string }> {
  return queueEmail({
    recipientEmail,
    templateType: EmailTemplate.PASSWORD_RESET,
    context,
  })
}

/**
 * Queue a welcome email
 *
 * Context must be provided since there's no booking reference.
 *
 * @param recipientEmail - Recipient email address
 * @param context - Welcome context
 * @returns The created EmailLog entry
 */
export async function queueWelcome(
  recipientEmail: string,
  context: EmailContext
): Promise<{ id: string }> {
  return queueEmail({
    recipientEmail,
    templateType: EmailTemplate.WELCOME,
    context,
  })
}

/**
 * Get queue statistics for monitoring
 *
 * @returns Queue statistics
 */
export async function getQueueStats(): Promise<{
  pending: number
  sent: number
  failed: number
  totalToday: number
}> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [pending, sent, failed, totalToday] = await Promise.all([
    prisma.emailLog.count({ where: { status: EmailStatus.PENDING } }),
    prisma.emailLog.count({ where: { status: EmailStatus.SENT } }),
    prisma.emailLog.count({ where: { status: EmailStatus.FAILED } }),
    prisma.emailLog.count({ where: { createdAt: { gte: today } } }),
  ])

  return { pending, sent, failed, totalToday }
}

/**
 * Clean up old email logs
 *
 * Removes email logs older than the specified number of days.
 * Should be run periodically to prevent database bloat.
 *
 * @param daysOld - Number of days to keep (default: 30)
 * @returns Number of deleted records
 */
export async function cleanupOldEmailLogs(daysOld: number = 30): Promise<number> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysOld)

  const result = await prisma.emailLog.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
      status: { in: [EmailStatus.SENT, EmailStatus.FAILED] }, // Don't delete pending emails
    },
  })

  console.log(`[EmailQueue] Cleaned up ${result.count} old email logs`)
  return result.count
}
