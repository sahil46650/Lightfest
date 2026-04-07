/**
 * Email System Main Export
 *
 * This file provides the main entry point for the email system.
 * Import from this file for all email-related functionality.
 *
 * @example
 * ```typescript
 * import {
 *   queueBookingConfirmation,
 *   processEmailQueue,
 *   isEmailServiceConfigured,
 * } from "@/lib/email"
 * ```
 */

// Types
export type {
  EmailPayload,
  BookingConfirmationContext,
  EventReminderContext,
  AbandonedCartContext,
  PasswordResetContext,
  WelcomeContext,
  EmailSendResult,
  EmailQueueResult,
  QRCodeData,
  TicketLineItem,
  AttendeeInfo,
  AddOnInfo,
  CartItemInfo,
  CreateEmailLogData,
  EmailLogWithContext,
  EmailStyleConfig,
} from "./types"

// Prisma types re-export
export { EmailTemplate, EmailStatus } from "./types"

// Type guards and helpers
export {
  DEFAULT_EMAIL_STYLE,
  getBaseUrl,
  getSupportEmail,
  getEmailFrom,
} from "./types"

// Resend client
export {
  sendEmail,
  sendPlainTextEmail,
  sendHtmlEmail,
  isEmailServiceConfigured,
  getEmailServiceStatus,
} from "./resend"

// Email queue functions
export {
  processEmailQueue,
  queueEmail,
  queueBookingConfirmation,
  queueEventReminder,
  queueAbandonedCart,
  queuePasswordReset,
  queueWelcome,
  getQueueStats,
  cleanupOldEmailLogs,
} from "./queue"

// Utilities
export {
  generateQRCodeDataUrl,
  generateBookingQRCodes,
  formatEventDate,
  formatEventTime,
  formatEventDateTime,
  formatRelativeTime,
  formatCurrency,
  generateICalEvent,
  generateAddToCalendarUrl,
  generateGoogleCalendarUrl,
  generateDirectionsUrl,
  buildBookingConfirmationContext,
  buildEventReminderContext,
  buildAbandonedCartContext,
  buildPasswordResetContext,
  buildWelcomeContext,
  calculateNextRetryTime,
  shouldRetryEmail,
} from "./utils"

// Templates (for direct use if needed)
export {
  BookingConfirmationEmail,
  EventReminderEmail,
  AbandonedCartEmail,
  PasswordResetEmail,
  WelcomeEmail,
  getEmailTemplate,
  getEmailSubject,
  validateContext,
  EMAIL_TEMPLATE_METADATA,
} from "./templates"

// Re-export the EmailContext union type
export type { EmailContext } from "./templates"
