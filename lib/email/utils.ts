/**
 * Email Utility Functions
 *
 * This file contains helper functions for:
 * - QR code generation (base64 data URLs for email embedding)
 * - Date/time formatting with timezone support
 * - Calendar event generation (iCal format)
 * - URL construction helpers
 */

import * as QRCode from "qrcode"
import { prisma } from "@/lib/prisma"
import { EmailTemplate, EmailStatus } from "@prisma/client"
import {
  BookingConfirmationContext,
  EventReminderContext,
  AbandonedCartContext,
  PasswordResetContext,
  WelcomeContext,
  QRCodeData,
  TicketLineItem,
  AttendeeInfo,
  CartItemInfo,
  getBaseUrl,
  getSupportEmail,
} from "./types"

/**
 * Generate a QR code as a base64 data URL
 *
 * @param text - The text/URL to encode in the QR code
 * @param options - QR code generation options
 * @returns Base64 data URL of the QR code image
 */
export async function generateQRCodeDataUrl(
  text: string,
  options?: {
    width?: number
    margin?: number
    color?: {
      dark?: string
      light?: string
    }
  }
): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: options?.width || 200,
      margin: options?.margin || 2,
      color: {
        dark: options?.color?.dark || "#000000",
        light: options?.color?.light || "#ffffff",
      },
      errorCorrectionLevel: "M",
    })
    return dataUrl
  } catch (error) {
    console.error("Failed to generate QR code:", error)
    // Return a placeholder SVG if QR code generation fails
    return `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="200" height="200">
        <rect fill="#f3f4f6" width="100" height="100"/>
        <text x="50" y="55" text-anchor="middle" fill="#6b7280" font-size="10">QR Code</text>
      </svg>`
    )}`
  }
}

/**
 * Generate QR codes for all tickets in a booking
 *
 * @param bookingId - The booking ID
 * @param tickets - Array of ticket data
 * @returns Array of QRCodeData for email embedding
 */
export async function generateBookingQRCodes(
  bookingId: string,
  tickets: Array<{
    id: string
    qrCode: string | null
    ticketType: string
    attendeeName: string | null
  }>
): Promise<QRCodeData[]> {
  const baseUrl = getBaseUrl()

  const qrCodes = await Promise.all(
    tickets.map(async (ticket) => {
      // Generate the verification URL for the QR code
      const verificationUrl = ticket.qrCode
        ? `${baseUrl}/verify/${ticket.qrCode}`
        : `${baseUrl}/bookings/${bookingId}`

      const dataUrl = await generateQRCodeDataUrl(verificationUrl)

      return {
        ticketId: ticket.id,
        ticketType: ticket.ticketType,
        attendeeName: ticket.attendeeName || "Guest",
        qrCodeDataUrl: dataUrl,
      }
    })
  )

  return qrCodes
}

/**
 * Format a date for email display
 *
 * @param date - Date to format
 * @param timezone - Timezone string (e.g., "America/New_York")
 * @returns Formatted date string (e.g., "Saturday, January 15, 2025")
 */
export function formatEventDate(
  date: Date,
  timezone: string = "UTC"
): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: timezone,
  }).format(date)
}

/**
 * Format a time for email display
 *
 * @param date - Date to format
 * @param timezone - Timezone string
 * @returns Formatted time string (e.g., "7:00 PM")
 */
export function formatEventTime(
  date: Date,
  timezone: string = "UTC"
): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: timezone,
  }).format(date)
}

/**
 * Format a full datetime for email display
 *
 * @param date - Date to format
 * @param timezone - Timezone string
 * @returns Formatted datetime string (e.g., "Saturday, January 15, 2025 at 7:00 PM")
 */
export function formatEventDateTime(
  date: Date,
  timezone: string = "UTC"
): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: timezone,
  }).format(date)
}

/**
 * Format a relative time (e.g., "in 24 hours", "tomorrow")
 *
 * @param date - Target date
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffHours = Math.round(diffMs / (1000 * 60 * 60))
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffHours <= 0) return "now"
  if (diffHours === 1) return "in 1 hour"
  if (diffHours < 24) return `in ${diffHours} hours`
  if (diffDays === 1) return "tomorrow"
  return `in ${diffDays} days`
}

/**
 * Format currency for email display
 *
 * @param amount - Amount in cents or dollars
 * @param currency - Currency code (default: USD)
 * @returns Formatted currency string (e.g., "$25.00")
 */
export function formatCurrency(
  amount: number,
  currency: string = "USD"
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Generate an iCal (.ics) file content for calendar events
 *
 * @param event - Event details
 * @returns iCal formatted string
 */
export function generateICalEvent(event: {
  title: string
  description?: string
  location?: string
  address?: string
  startDate: Date
  endDate?: Date
  url?: string
}): string {
  const formatICalDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
  }

  const escapeText = (text: string): string => {
    return text
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\n/g, "\\n")
  }

  const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@festivalights.com`
  const now = new Date()
  const endDate = event.endDate || new Date(event.startDate.getTime() + 3 * 60 * 60 * 1000) // Default 3 hours

  let locationString = ""
  if (event.location || event.address) {
    const parts = [event.location, event.address].filter(Boolean)
    locationString = `LOCATION:${escapeText(parts.join(", "))}\r\n`
  }

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Festival Lights//Booking System//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatICalDate(now)}`,
    `DTSTART:${formatICalDate(event.startDate)}`,
    `DTEND:${formatICalDate(endDate)}`,
    `SUMMARY:${escapeText(event.title)}`,
    event.description ? `DESCRIPTION:${escapeText(event.description)}` : "",
    locationString,
    event.url ? `URL:${event.url}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n")
}

/**
 * Generate a data URL for an iCal file
 *
 * @param icalContent - iCal file content
 * @returns Data URL for the iCal file
 */
export function generateAddToCalendarUrl(icalContent: string): string {
  const base64 = Buffer.from(icalContent).toString("base64")
  return `data:text/calendar;base64,${base64}`
}

/**
 * Generate Google Calendar URL
 *
 * @param event - Event details
 * @returns Google Calendar URL
 */
export function generateGoogleCalendarUrl(event: {
  title: string
  description?: string
  location?: string
  startDate: Date
  endDate?: Date
}): string {
  const formatGoogleDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
  }

  const endDate = event.endDate || new Date(event.startDate.getTime() + 3 * 60 * 60 * 1000)

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${formatGoogleDate(event.startDate)}/${formatGoogleDate(endDate)}`,
    ...(event.description && { details: event.description }),
    ...(event.location && { location: event.location }),
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/**
 * Generate Google Maps directions URL
 *
 * @param address - Full address string
 * @returns Google Maps directions URL
 */
export function generateDirectionsUrl(address: string): string {
  const params = new URLSearchParams({
    api: "1",
    destination: address,
    travelmode: "driving",
  })
  return `https://www.google.com/maps/dir/?${params.toString()}`
}

/**
 * Build booking confirmation email context from database
 *
 * @param bookingId - The booking ID
 * @returns BookingConfirmationContext or null if not found
 */
export async function buildBookingConfirmationContext(
  bookingId: string
): Promise<BookingConfirmationContext | null> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      event: true,
      tickets: {
        include: {
          ticketType: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      promoCode: true,
      guests: {
        orderBy: {
          order: "asc",
        },
      },
    },
  })

  if (!booking) {
    return null
  }

  const baseUrl = getBaseUrl()
  const supportEmail = getSupportEmail()

  // Group tickets by type for line items
  const ticketGroups = new Map<string, { count: number; price: number; name: string }>()
  for (const ticket of booking.tickets) {
    const existing = ticketGroups.get(ticket.ticketTypeId)
    if (existing) {
      existing.count++
    } else {
      ticketGroups.set(ticket.ticketTypeId, {
        count: 1,
        price: Number(ticket.ticketType.price),
        name: ticket.ticketType.name,
      })
    }
  }

  const tickets: TicketLineItem[] = Array.from(ticketGroups.values()).map((group) => ({
    ticketType: group.name,
    quantity: group.count,
    unitPrice: group.price,
    subtotal: group.price * group.count,
  }))

  // Build attendee info
  const attendees: AttendeeInfo[] = booking.tickets.map((ticket) => ({
    name: ticket.attendeeName || `${booking.firstName} ${booking.lastName}`,
    email: ticket.attendeeEmail || booking.email,
    ticketType: ticket.ticketType.name,
    addOns: ticket.addOnsJson ? JSON.parse(ticket.addOnsJson) : undefined,
  }))

  // Generate QR codes
  const qrCodes = await generateBookingQRCodes(
    bookingId,
    booking.tickets.map((t) => ({
      id: t.id,
      qrCode: t.qrCode,
      ticketType: t.ticketType.name,
      attendeeName: t.attendeeName,
    }))
  )

  // Generate calendar URL
  const icalContent = generateICalEvent({
    title: booking.event.name,
    description: `Your Festival Lights booking. Confirmation #${booking.confirmationNumber}`,
    location: booking.event.location,
    address: booking.event.address || undefined,
    startDate: booking.event.date,
    endDate: booking.event.endDate || undefined,
    url: `${baseUrl}/bookings/${booking.confirmationNumber}`,
  })
  const addToCalendarUrl = generateAddToCalendarUrl(icalContent)

  const serviceFeeRate = 0.37 // 37% service fee

  return {
    templateType: "BOOKING_CONFIRMATION",
    customerName: `${booking.firstName} ${booking.lastName}`,
    customerFirstName: booking.firstName,
    confirmationNumber: booking.confirmationNumber,
    eventName: booking.event.name,
    eventDate: formatEventDate(booking.event.date, booking.event.timezone),
    eventTime: formatEventTime(booking.event.date, booking.event.timezone),
    eventTimezone: booking.event.timezone,
    location: booking.event.location,
    address: booking.event.address || undefined,
    tickets,
    attendees,
    subtotal: Number(booking.subtotal),
    serviceFee: Number(booking.serviceFee),
    serviceFeeRate,
    discount: Number(booking.discount),
    promoCode: booking.promoCode?.code,
    total: Number(booking.total),
    qrCodes,
    bookingUrl: `${baseUrl}/bookings/${booking.confirmationNumber}`,
    addToCalendarUrl,
    supportEmail,
  }
}

/**
 * Build event reminder email context from database
 *
 * @param bookingId - The booking ID
 * @returns EventReminderContext or null if not found
 */
export async function buildEventReminderContext(
  bookingId: string
): Promise<EventReminderContext | null> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      event: true,
      tickets: {
        include: {
          ticketType: true,
        },
      },
    },
  })

  if (!booking) {
    return null
  }

  const baseUrl = getBaseUrl()
  const supportEmail = getSupportEmail()

  // Generate QR codes
  const qrCodes = await generateBookingQRCodes(
    bookingId,
    booking.tickets.map((t) => ({
      id: t.id,
      qrCode: t.qrCode,
      ticketType: t.ticketType.name,
      attendeeName: t.attendeeName,
    }))
  )

  // Mock weather forecast
  const weatherForecast = "Clear skies expected, 72F (22C)"

  // Parking info (placeholder)
  const parkingInfo = booking.event.address
    ? "Free parking available on-site. Please arrive 30 minutes early."
    : undefined

  return {
    templateType: "EVENT_REMINDER",
    customerName: `${booking.firstName} ${booking.lastName}`,
    eventName: booking.event.name,
    eventDate: formatEventDate(booking.event.date, booking.event.timezone),
    eventTime: formatEventTime(booking.event.date, booking.event.timezone),
    eventTimezone: booking.event.timezone,
    location: booking.event.location,
    address: booking.event.address || undefined,
    parkingInfo,
    weatherForecast,
    attendeeCount: booking.tickets.length,
    attendeeNames: booking.tickets.map(
      (t) => t.attendeeName || `${booking.firstName} ${booking.lastName}`
    ),
    ticketViewUrl: `${baseUrl}/bookings/${booking.confirmationNumber}`,
    directionsUrl: booking.event.address
      ? generateDirectionsUrl(booking.event.address)
      : undefined,
    addToCalendarUrl: generateGoogleCalendarUrl({
      title: booking.event.name,
      description: `Your Festival Lights booking. Confirmation #${booking.confirmationNumber}`,
      location: booking.event.address || booking.event.location,
      startDate: booking.event.date,
      endDate: booking.event.endDate || undefined,
    }),
    qrCodes,
    supportEmail,
  }
}

/**
 * Build abandoned cart email context from database
 *
 * @param draftBookingId - The draft booking ID
 * @returns AbandonedCartContext or null if not found
 */
export async function buildAbandonedCartContext(
  draftBookingId: string
): Promise<AbandonedCartContext | null> {
  const draftBooking = await prisma.draftBooking.findUnique({
    where: { id: draftBookingId },
  })

  if (!draftBooking) {
    return null
  }

  // Get event details
  const event = await prisma.event.findUnique({
    where: { id: draftBooking.eventId },
  })

  if (!event) {
    return null
  }

  const baseUrl = getBaseUrl()
  const supportEmail = getSupportEmail()

  // Parse cart and personal info
  const cart = JSON.parse(draftBooking.cart) as Array<{
    ticketTypeId: string
    ticketName: string
    price: number
    quantity: number
  }>

  const personalInfo = draftBooking.personalInfo
    ? (JSON.parse(draftBooking.personalInfo) as { email: string; firstName?: string; lastName?: string })
    : null

  if (!personalInfo?.email) {
    return null // Can't send email without recipient
  }

  // Build cart items
  const cartItems: CartItemInfo[] = cart.map((item) => ({
    ticketType: item.ticketName,
    quantity: item.quantity,
    unitPrice: item.price,
    subtotal: item.price * item.quantity,
  }))

  const cartTotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0)

  // Customer name
  const customerName = personalInfo.firstName && personalInfo.lastName
    ? `${personalInfo.firstName} ${personalInfo.lastName}`
    : undefined

  // Generate resume URL with magic link
  const resumeUrl = `${baseUrl}/checkout/${draftBookingId}?resume=true`

  // Default promo code incentive
  const promoCode = "FINISH10"
  const promoDiscount = 10 // 10% discount

  return {
    templateType: "ABANDONED_CART",
    customerName,
    customerEmail: personalInfo.email,
    eventName: event.name,
    eventDate: formatEventDate(event.date, event.timezone),
    eventTime: formatEventTime(event.date, event.timezone),
    cartItems,
    cartTotal,
    resumeUrl,
    promoCode,
    promoDiscount,
    expiresAt: formatRelativeTime(draftBooking.expiresAt),
    supportEmail,
  }
}

/**
 * Build password reset email context
 *
 * @param userEmail - User's email address
 * @param resetToken - Password reset token
 * @param expiresAt - When the token expires
 * @returns PasswordResetContext
 */
export function buildPasswordResetContext(
  userName: string,
  userEmail: string,
  resetToken: string,
  expiresAt: Date
): PasswordResetContext {
  const baseUrl = getBaseUrl()
  const supportEmail = getSupportEmail()

  return {
    templateType: "PASSWORD_RESET",
    userName,
    userEmail,
    resetUrl: `${baseUrl}/auth/reset-password?token=${resetToken}`,
    expiresAt: formatRelativeTime(expiresAt),
    supportEmail,
  }
}

/**
 * Build welcome email context
 *
 * @param userName - User's display name
 * @param userEmail - User's email address
 * @returns WelcomeContext
 */
export function buildWelcomeContext(
  userName: string,
  userEmail: string
): WelcomeContext {
  const baseUrl = getBaseUrl()
  const supportEmail = getSupportEmail()

  return {
    templateType: "WELCOME",
    userName,
    userEmail,
    loginUrl: `${baseUrl}/auth/signin`,
    supportEmail,
  }
}

/**
 * Calculate next retry time with exponential backoff
 *
 * @param attempts - Number of previous attempts
 * @returns Date of next retry
 */
export function calculateNextRetryTime(attempts: number): Date {
  // Exponential backoff: 15min, 30min, 60min
  const baseDelayMinutes = 15
  const delayMinutes = Math.pow(2, attempts) * baseDelayMinutes
  const maxDelayMinutes = 60 // Cap at 1 hour

  const actualDelay = Math.min(delayMinutes, maxDelayMinutes)
  return new Date(Date.now() + actualDelay * 60 * 1000)
}

/**
 * Check if an email should be retried
 *
 * @param attempts - Number of previous attempts
 * @param maxAttempts - Maximum number of attempts (default: 3)
 * @returns Whether the email should be retried
 */
export function shouldRetryEmail(attempts: number, maxAttempts: number = 3): boolean {
  return attempts < maxAttempts
}
