/**
 * Resend Email Client Integration
 *
 * This file provides the interface for sending emails via Resend.
 * It handles:
 * - Resend client initialization
 * - Email sending with React Email templates
 * - Error handling and result formatting
 */

import { Resend } from "resend"
import * as React from "react"
import { EmailSendResult, getEmailFrom } from "./types"

// Initialize Resend client
// The client is created lazily to handle missing API keys gracefully
let resendClient: Resend | null = null

/**
 * Get or create the Resend client instance
 *
 * @returns Resend client or null if API key is not configured
 */
function getResendClient(): Resend | null {
  if (resendClient) {
    return resendClient
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn("RESEND_API_KEY is not configured. Email sending is disabled.")
    return null
  }

  resendClient = new Resend(apiKey)
  return resendClient
}

/**
 * Send an email using Resend with a React Email template
 *
 * @param to - Recipient email address(es)
 * @param subject - Email subject line
 * @param react - React Email component to render
 * @param options - Additional email options
 * @returns EmailSendResult indicating success or failure
 */
export async function sendEmail(
  to: string | string[],
  subject: string,
  react: React.ReactElement,
  options?: {
    from?: string
    replyTo?: string
    cc?: string | string[]
    bcc?: string | string[]
    tags?: Array<{ name: string; value: string }>
  }
): Promise<EmailSendResult> {
  const client = getResendClient()

  if (!client) {
    return {
      success: false,
      error: "Email service is not configured. Please set RESEND_API_KEY.",
    }
  }

  try {
    const from = options?.from || getEmailFrom()
    const recipients = Array.isArray(to) ? to : [to]

    // Validate recipients
    if (recipients.length === 0) {
      return {
        success: false,
        error: "No recipients specified",
      }
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmails = recipients.filter((email) => !emailRegex.test(email))
    if (invalidEmails.length > 0) {
      return {
        success: false,
        error: `Invalid email addresses: ${invalidEmails.join(", ")}`,
      }
    }

    const response = await client.emails.send({
      from,
      to: recipients,
      subject,
      react,
      ...(options?.replyTo && { replyTo: options.replyTo }),
      ...(options?.cc && { cc: Array.isArray(options.cc) ? options.cc : [options.cc] }),
      ...(options?.bcc && { bcc: Array.isArray(options.bcc) ? options.bcc : [options.bcc] }),
      ...(options?.tags && { tags: options.tags }),
    })

    // Check if response contains an error
    if (response.error) {
      return {
        success: false,
        error: response.error.message || "Unknown error from Resend",
      }
    }

    return {
      success: true,
      messageId: response.data?.id,
    }
  } catch (error) {
    console.error("Failed to send email:", error)

    // Extract error message
    let errorMessage = "Unknown error occurred"
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === "string") {
      errorMessage = error
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Send a plain text email (no React template)
 *
 * @param to - Recipient email address(es)
 * @param subject - Email subject line
 * @param text - Plain text email body
 * @param options - Additional email options
 * @returns EmailSendResult indicating success or failure
 */
export async function sendPlainTextEmail(
  to: string | string[],
  subject: string,
  text: string,
  options?: {
    from?: string
    replyTo?: string
  }
): Promise<EmailSendResult> {
  const client = getResendClient()

  if (!client) {
    return {
      success: false,
      error: "Email service is not configured. Please set RESEND_API_KEY.",
    }
  }

  try {
    const from = options?.from || getEmailFrom()
    const recipients = Array.isArray(to) ? to : [to]

    const response = await client.emails.send({
      from,
      to: recipients,
      subject,
      text,
      ...(options?.replyTo && { replyTo: options.replyTo }),
    })

    if (response.error) {
      return {
        success: false,
        error: response.error.message || "Unknown error from Resend",
      }
    }

    return {
      success: true,
      messageId: response.data?.id,
    }
  } catch (error) {
    console.error("Failed to send plain text email:", error)

    let errorMessage = "Unknown error occurred"
    if (error instanceof Error) {
      errorMessage = error.message
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Send an email with HTML content (no React template)
 *
 * @param to - Recipient email address(es)
 * @param subject - Email subject line
 * @param html - HTML email body
 * @param options - Additional email options
 * @returns EmailSendResult indicating success or failure
 */
export async function sendHtmlEmail(
  to: string | string[],
  subject: string,
  html: string,
  options?: {
    from?: string
    replyTo?: string
    text?: string // Fallback plain text version
  }
): Promise<EmailSendResult> {
  const client = getResendClient()

  if (!client) {
    return {
      success: false,
      error: "Email service is not configured. Please set RESEND_API_KEY.",
    }
  }

  try {
    const from = options?.from || getEmailFrom()
    const recipients = Array.isArray(to) ? to : [to]

    const response = await client.emails.send({
      from,
      to: recipients,
      subject,
      html,
      ...(options?.text && { text: options.text }),
      ...(options?.replyTo && { replyTo: options.replyTo }),
    })

    if (response.error) {
      return {
        success: false,
        error: response.error.message || "Unknown error from Resend",
      }
    }

    return {
      success: true,
      messageId: response.data?.id,
    }
  } catch (error) {
    console.error("Failed to send HTML email:", error)

    let errorMessage = "Unknown error occurred"
    if (error instanceof Error) {
      errorMessage = error.message
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Verify if the Resend client is properly configured
 *
 * @returns Boolean indicating if email sending is available
 */
export function isEmailServiceConfigured(): boolean {
  return !!process.env.RESEND_API_KEY
}

/**
 * Get the email service status for health checks
 *
 * @returns Status object with configuration details
 */
export function getEmailServiceStatus(): {
  configured: boolean
  from: string
  provider: string
} {
  return {
    configured: isEmailServiceConfigured(),
    from: getEmailFrom(),
    provider: "Resend",
  }
}
