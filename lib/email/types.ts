/**
 * Email System Type Definitions
 *
 * This file contains all TypeScript types for the email system including:
 * - Email template types (enum matching Prisma)
 * - Email context interfaces for each template
 * - Email payload structures
 * - Email sending result types
 */

import { EmailTemplate, EmailStatus } from "@prisma/client"

// Re-export Prisma types for convenience
export { EmailTemplate, EmailStatus }

/**
 * Base email payload interface
 */
export interface BaseEmailPayload {
  to: string | string[]
  templateType: EmailTemplate
  subject: string
}

/**
 * Email payload with context - union type for all templates
 */
export interface EmailPayload extends BaseEmailPayload {
  context:
    | BookingConfirmationContext
    | EventReminderContext
    | AbandonedCartContext
    | PasswordResetContext
    | WelcomeContext
}

/**
 * Booking Confirmation Email Context
 *
 * Used when a booking is successfully confirmed.
 * Contains all details needed for the confirmation email.
 */
export interface BookingConfirmationContext {
  templateType: "BOOKING_CONFIRMATION"
  customerName: string
  customerFirstName: string
  confirmationNumber: string
  eventName: string
  eventDate: string // Formatted date string
  eventTime: string // Formatted time string
  eventTimezone: string
  location: string
  address?: string
  tickets: TicketLineItem[]
  attendees: AttendeeInfo[]
  subtotal: number
  serviceFee: number
  serviceFeeRate: number // e.g., 0.37 for 37%
  discount: number
  promoCode?: string
  total: number
  qrCodes: QRCodeData[]
  bookingUrl: string
  addToCalendarUrl?: string
  supportEmail: string
}

/**
 * Individual ticket line item for email display
 */
export interface TicketLineItem {
  ticketType: string
  quantity: number
  unitPrice: number
  subtotal: number
}

/**
 * Attendee information for email display
 */
export interface AttendeeInfo {
  name: string
  email: string
  ticketType: string
  addOns?: AddOnInfo[]
}

/**
 * Add-on information
 */
export interface AddOnInfo {
  name: string
  price: number
}

/**
 * QR Code data for email display
 */
export interface QRCodeData {
  ticketId: string
  ticketType: string
  attendeeName: string
  qrCodeDataUrl: string // Base64 data URL for embedding in email
}

/**
 * Event Reminder Email Context
 *
 * Sent 24 hours before the event starts.
 */
export interface EventReminderContext {
  templateType: "EVENT_REMINDER"
  customerName: string
  eventName: string
  eventDate: string // Formatted date (e.g., "Saturday, January 15, 2025")
  eventTime: string // Formatted time (e.g., "7:00 PM")
  eventTimezone: string
  location: string
  address?: string
  parkingInfo?: string
  weatherForecast?: string // Mock weather data
  attendeeCount: number
  attendeeNames: string[]
  ticketViewUrl: string
  directionsUrl?: string
  addToCalendarUrl?: string
  qrCodes: QRCodeData[]
  supportEmail: string
}

/**
 * Abandoned Cart Email Context
 *
 * Sent 1 hour after a draft booking is created without completion.
 */
export interface AbandonedCartContext {
  templateType: "ABANDONED_CART"
  customerName?: string // May not have captured name yet
  customerEmail: string
  eventName: string
  eventDate: string
  eventTime: string
  cartItems: CartItemInfo[]
  cartTotal: number
  resumeUrl: string // Magic link to resume checkout
  promoCode?: string // Incentive promo code (e.g., FINISH10)
  promoDiscount?: number // Discount percentage
  expiresAt: string // When the cart expires
  supportEmail: string
}

/**
 * Cart item for abandoned cart email
 */
export interface CartItemInfo {
  ticketType: string
  quantity: number
  unitPrice: number
  subtotal: number
}

/**
 * Password Reset Email Context
 *
 * Sent when a user requests a password reset.
 */
export interface PasswordResetContext {
  templateType: "PASSWORD_RESET"
  userName: string
  userEmail: string
  resetUrl: string // Full URL with token
  expiresAt: string // When the reset link expires (e.g., "24 hours")
  supportEmail: string
}

/**
 * Welcome Email Context
 *
 * Sent when a new user creates an account.
 */
export interface WelcomeContext {
  templateType: "WELCOME"
  userName: string
  userEmail: string
  loginUrl: string
  supportEmail: string
}

/**
 * Result from sending an email via Resend
 */
export interface EmailSendResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Email queue processing result
 */
export interface EmailQueueResult {
  processed: number
  sent: number
  failed: number
  errors: Array<{
    emailLogId: string
    error: string
  }>
}

/**
 * Email log data for creating queue entries
 */
export interface CreateEmailLogData {
  bookingId?: string
  recipientEmail: string
  templateType: EmailTemplate
  subject: string
  contextJson?: string // JSON stringified context
}

/**
 * Extended email log with parsed context
 */
export interface EmailLogWithContext {
  id: string
  bookingId: string | null
  recipientEmail: string
  templateType: EmailTemplate
  status: EmailStatus
  subject: string | null
  content: string | null
  error: string | null
  sentAt: Date | null
  attempts: number
  nextRetryAt: Date | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Configuration for email styling
 */
export interface EmailStyleConfig {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  textColor: string
  mutedTextColor: string
  borderColor: string
  fontFamily: string
}

/**
 * Default email style configuration
 */
export const DEFAULT_EMAIL_STYLE: EmailStyleConfig = {
  primaryColor: "#7c3aed", // Purple/violet
  secondaryColor: "#f59e0b", // Amber/orange for festival theme
  accentColor: "#10b981", // Emerald for CTAs
  backgroundColor: "#ffffff",
  textColor: "#1f2937",
  mutedTextColor: "#6b7280",
  borderColor: "#e5e7eb",
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
}

/**
 * Email base URL configuration helper
 */
export function getBaseUrl(): string {
  // In production, use the actual domain
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  // Fallback to configured base URL or localhost
  return process.env.BASE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"
}

/**
 * Get support email from environment
 */
export function getSupportEmail(): string {
  return process.env.SUPPORT_EMAIL || "support@festivalights.com"
}

/**
 * Get email from address
 */
export function getEmailFrom(): string {
  return process.env.EMAIL_FROM || "bookings@festivalights.com"
}
