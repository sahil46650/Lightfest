/**
 * Email Templates Index
 *
 * This file exports all email templates and provides a factory function
 * to get the appropriate template component based on the template type.
 */

import * as React from "react"
import { EmailTemplate } from "@prisma/client"
import {
  BookingConfirmationContext,
  EventReminderContext,
  AbandonedCartContext,
  PasswordResetContext,
  WelcomeContext,
} from "../types"

// Import all templates
import { BookingConfirmationEmail } from "./booking-confirmation"
import { EventReminderEmail } from "./event-reminder"
import { AbandonedCartEmail } from "./abandoned-cart"
import { PasswordResetEmail } from "./password-reset"
import { WelcomeEmail } from "./welcome"

// Re-export all templates
export { BookingConfirmationEmail } from "./booking-confirmation"
export { EventReminderEmail } from "./event-reminder"
export { AbandonedCartEmail } from "./abandoned-cart"
export { PasswordResetEmail } from "./password-reset"
export { WelcomeEmail } from "./welcome"

/**
 * Union type for all email contexts
 */
export type EmailContext =
  | BookingConfirmationContext
  | EventReminderContext
  | AbandonedCartContext
  | PasswordResetContext
  | WelcomeContext

/**
 * Get the appropriate React Email component based on template type
 *
 * @param templateType - The email template type
 * @param context - The context data for the template
 * @returns React element for the email, or null if template not found
 */
export function getEmailTemplate(
  templateType: EmailTemplate,
  context: EmailContext
): React.ReactElement | null {
  switch (templateType) {
    case "BOOKING_CONFIRMATION":
      if (context.templateType === "BOOKING_CONFIRMATION") {
        return React.createElement(BookingConfirmationEmail, { context })
      }
      return null

    case "EVENT_REMINDER":
      if (context.templateType === "EVENT_REMINDER") {
        return React.createElement(EventReminderEmail, { context })
      }
      return null

    case "ABANDONED_CART":
      if (context.templateType === "ABANDONED_CART") {
        return React.createElement(AbandonedCartEmail, { context })
      }
      return null

    case "PASSWORD_RESET":
      if (context.templateType === "PASSWORD_RESET") {
        return React.createElement(PasswordResetEmail, { context })
      }
      return null

    case "WELCOME":
      if (context.templateType === "WELCOME") {
        return React.createElement(WelcomeEmail, { context })
      }
      return null

    default:
      console.error(`Unknown email template type: ${templateType}`)
      return null
  }
}

/**
 * Get the subject line for an email template
 *
 * @param templateType - The email template type
 * @param context - The context data containing template-specific info
 * @returns Subject line string
 */
export function getEmailSubject(
  templateType: EmailTemplate,
  context: EmailContext
): string {
  switch (templateType) {
    case "BOOKING_CONFIRMATION":
      if (context.templateType === "BOOKING_CONFIRMATION") {
        return `Your tickets for ${context.eventName} - Confirmation #${context.confirmationNumber}`
      }
      return "Booking Confirmation"

    case "EVENT_REMINDER":
      if (context.templateType === "EVENT_REMINDER") {
        return `Reminder: ${context.eventName} is tomorrow!`
      }
      return "Event Reminder"

    case "ABANDONED_CART":
      if (context.templateType === "ABANDONED_CART") {
        return `Don't miss out! Complete your ${context.eventName} booking`
      }
      return "Complete Your Booking"

    case "PASSWORD_RESET":
      return "Reset your Festival Lights password"

    case "WELCOME":
      return "Welcome to Festival Lights!"

    default:
      return "Festival Lights"
  }
}

/**
 * Validate that context matches template type
 *
 * @param templateType - The email template type
 * @param context - The context to validate
 * @returns Boolean indicating if context is valid for template
 */
export function validateContext(
  templateType: EmailTemplate,
  context: unknown
): context is EmailContext {
  if (!context || typeof context !== "object") {
    return false
  }

  const ctx = context as Record<string, unknown>

  switch (templateType) {
    case "BOOKING_CONFIRMATION":
      return (
        ctx.templateType === "BOOKING_CONFIRMATION" &&
        typeof ctx.confirmationNumber === "string" &&
        typeof ctx.eventName === "string"
      )

    case "EVENT_REMINDER":
      return (
        ctx.templateType === "EVENT_REMINDER" &&
        typeof ctx.eventName === "string" &&
        typeof ctx.eventDate === "string"
      )

    case "ABANDONED_CART":
      return (
        ctx.templateType === "ABANDONED_CART" &&
        typeof ctx.eventName === "string" &&
        typeof ctx.resumeUrl === "string"
      )

    case "PASSWORD_RESET":
      return (
        ctx.templateType === "PASSWORD_RESET" &&
        typeof ctx.resetUrl === "string" &&
        typeof ctx.userEmail === "string"
      )

    case "WELCOME":
      return (
        ctx.templateType === "WELCOME" &&
        typeof ctx.userName === "string" &&
        typeof ctx.loginUrl === "string"
      )

    default:
      return false
  }
}

/**
 * Get template metadata
 */
export const EMAIL_TEMPLATE_METADATA = {
  BOOKING_CONFIRMATION: {
    name: "Booking Confirmation",
    description: "Sent immediately after a booking is confirmed",
    trigger: "On booking confirmation",
  },
  EVENT_REMINDER: {
    name: "Event Reminder",
    description: "Sent 24 hours before an event starts",
    trigger: "24 hours before event",
  },
  ABANDONED_CART: {
    name: "Abandoned Cart",
    description: "Sent when a user leaves without completing checkout",
    trigger: "1 hour after cart abandonment",
  },
  PASSWORD_RESET: {
    name: "Password Reset",
    description: "Sent when a user requests a password reset",
    trigger: "On password reset request",
  },
  WELCOME: {
    name: "Welcome",
    description: "Sent when a new user creates an account",
    trigger: "On account creation",
  },
} as const
