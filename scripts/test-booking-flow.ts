#!/usr/bin/env ts-node
/**
 * Test booking flow - Guest and Authenticated user flows
 *
 * Tests:
 * - Cart initialization
 * - Inventory lock creation
 * - Personal info submission
 * - Attendee info submission
 * - Promo code application
 * - Booking confirmation
 *
 * Verifies:
 * - Booking created with correct details
 * - Tickets created with QR codes
 * - InventoryLock deleted after confirmation
 * - DraftBooking deleted after confirmation
 * - EmailLog created for confirmation email
 */

import {
  initializeCart,
  updateCart,
  applyPromoCode,
  submitPersonalInfo,
  submitAttendeeInfo,
  confirmBooking,
} from './helpers/api-client'
import {
  getBookingDetails,
  getDraftBooking,
  getInventoryLocks,
  getAllEvents,
  getTicketTypes,
  closeDatabaseConnection,
} from './helpers/database'
import {
  logSection,
  logSuccess,
  logError,
  logTest,
  logSummary,
  startTimer,
  logInfo,
} from './helpers/logger'

interface TestResult {
  name: string
  passed: boolean
  duration: number
  error?: string
}

const results: TestResult[] = []

async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  const timer = startTimer()
  try {
    await testFn()
    const duration = timer()
    results.push({ name, passed: true, duration })
    logTest(name, true, duration)
  } catch (error) {
    const duration = timer()
    const errorMsg = error instanceof Error ? error.message : String(error)
    results.push({ name, passed: false, duration, error: errorMsg })
    logTest(name, false, duration, errorMsg)
  }
}

async function testGuestCheckoutFlow() {
  logSection('Guest Checkout Flow')

  let bookingId: string
  let eventId: string
  let ticketTypeId: string
  let confirmationNumber: string

  // Step 1: Get available event and ticket type
  await runTest('Fetch available event', async () => {
    const events = await getAllEvents()
    if (events.length === 0) {
      throw new Error('No published events found')
    }
    eventId = events[0].id
    logInfo(`Using event: ${events[0].name}`)
  })

  await runTest('Fetch ticket types', async () => {
    const ticketTypes = await getTicketTypes(eventId)
    if (ticketTypes.length === 0) {
      throw new Error('No ticket types found for event')
    }
    if (ticketTypes[0].quantityAvailable < 3) {
      throw new Error('Insufficient inventory for test (need at least 3 tickets)')
    }
    ticketTypeId = ticketTypes[0].id
    logInfo(`Using ticket type: ${ticketTypes[0].name}`)
  })

  // Step 2: Initialize cart
  await runTest('Initialize cart', async () => {
    const response = await initializeCart(eventId)
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to initialize cart')
    }
    bookingId = response.data.bookingId
    logInfo(`Cart initialized: ${bookingId}`)
  })

  // Step 3: Update cart with ticket quantities
  await runTest('Add tickets to cart', async () => {
    const updates = { [ticketTypeId]: 3 }
    const response = await updateCart(bookingId, updates)
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update cart')
    }
    if (response.data.cart.length !== 1) {
      throw new Error('Cart should have 1 item')
    }
    if (response.data.cart[0].quantity !== 3) {
      throw new Error('Cart should have 3 tickets')
    }
    logInfo(`Cart total: $${response.data.total.toFixed(2)}`)
  })

  // Step 4: Verify inventory locks created
  await runTest('Verify inventory locks created', async () => {
    const locks = await getInventoryLocks(bookingId)
    if (locks.length !== 1) {
      throw new Error(`Expected 1 lock, got ${locks.length}`)
    }
    if (locks[0].quantity !== 3) {
      throw new Error(`Expected lock quantity 3, got ${locks[0].quantity}`)
    }
    logInfo(`Inventory locked: 3 tickets`)
  })

  // Step 5: Apply promo code (optional)
  await runTest('Apply promo code (if available)', async () => {
    const response = await applyPromoCode(bookingId, 'WELCOME10')
    // It's ok if promo code doesn't exist or is invalid - this is optional
    if (response.success && response.data) {
      logInfo(`Promo code applied: ${response.data.discount} discount`)
    } else {
      logInfo('No valid promo code applied (optional test)')
    }
  })

  // Step 6: Submit personal information
  await runTest('Submit personal information', async () => {
    const personalInfo = {
      email: `test-${Date.now()}@example.com`,
      firstName: 'Test',
      lastName: 'User',
      phone: '+12345678901',
      countryCode: '+1',
      createAccount: false,
    }
    const response = await submitPersonalInfo(bookingId, personalInfo)
    if (!response.success) {
      throw new Error(response.error || 'Failed to submit personal info')
    }
    logInfo(`Personal info saved for ${personalInfo.email}`)
  })

  // Step 7: Submit attendee information
  await runTest('Submit attendee information', async () => {
    const attendees = {
      '0': {
        name: 'Attendee One',
        email: `attendee1-${Date.now()}@example.com`,
      },
      '1': {
        name: 'Attendee Two',
        email: `attendee2-${Date.now()}@example.com`,
      },
      '2': {
        name: 'Attendee Three',
        email: `attendee3-${Date.now()}@example.com`,
      },
    }
    const response = await submitAttendeeInfo(bookingId, attendees)
    if (!response.success) {
      throw new Error(response.error || 'Failed to submit attendee info')
    }
    logInfo('Attendee information saved for 3 tickets')
  })

  // Step 8: Confirm booking
  await runTest('Confirm booking', async () => {
    const response = await confirmBooking(bookingId)
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to confirm booking')
    }
    confirmationNumber = response.data.confirmationNumber
    if (response.data.ticketCount !== 3) {
      throw new Error(`Expected 3 tickets, got ${response.data.ticketCount}`)
    }
    logInfo(`Booking confirmed: ${confirmationNumber}`)
  })

  // Step 9: Verify booking created with correct details
  await runTest('Verify booking created in database', async () => {
    const booking = await getBookingDetails(bookingId)
    if (!booking) {
      throw new Error('Booking not found in database')
    }
    if (booking.confirmationNumber !== confirmationNumber) {
      throw new Error('Confirmation number mismatch')
    }
    logInfo(`Booking found: ${booking.confirmationNumber}`)
  })

  // Step 10: Verify tickets created with QR codes
  await runTest('Verify tickets created with QR codes', async () => {
    const booking = await getBookingDetails(bookingId)
    if (!booking) {
      throw new Error('Booking not found')
    }
    if (booking.tickets.length !== 3) {
      throw new Error(`Expected 3 tickets, got ${booking.tickets.length}`)
    }
    for (const ticket of booking.tickets) {
      if (!ticket.qrCode) {
        throw new Error('Ticket missing QR code')
      }
    }
    logInfo(`All 3 tickets have QR codes`)
  })

  // Step 11: Verify inventory locks deleted
  await runTest('Verify inventory locks deleted', async () => {
    const locks = await getInventoryLocks(bookingId)
    if (locks.length > 0) {
      throw new Error(`Expected 0 locks after confirmation, got ${locks.length}`)
    }
    logInfo('Inventory locks cleaned up')
  })

  // Step 12: Verify draft booking deleted
  await runTest('Verify draft booking deleted', async () => {
    const draftBooking = await getDraftBooking(bookingId)
    if (draftBooking !== null) {
      throw new Error('Draft booking should be deleted after confirmation')
    }
    logInfo('Draft booking cleaned up')
  })

  // Step 13: Verify email log created
  await runTest('Verify confirmation email queued', async () => {
    const booking = await getBookingDetails(bookingId)
    if (!booking) {
      throw new Error('Booking not found')
    }
    if (booking.emailLogs.length === 0) {
      throw new Error('No email logs found for booking')
    }
    const confirmationEmail = booking.emailLogs.find(
      (log) => log.templateType === 'BOOKING_CONFIRMATION'
    )
    if (!confirmationEmail) {
      throw new Error('Confirmation email not found in logs')
    }
    logInfo(`Confirmation email queued for ${booking.email}`)
  })
}

async function testAuthenticatedUserFlow() {
  logSection('Authenticated User Checkout Flow')

  // Similar to guest flow but with account creation
  let bookingId: string
  let eventId: string
  let ticketTypeId: string
  const userEmail = `test-auth-${Date.now()}@example.com`

  // Get event and ticket type
  await runTest('Fetch event for authenticated test', async () => {
    const events = await getAllEvents()
    if (events.length === 0) {
      throw new Error('No published events found')
    }
    eventId = events[0].id
    const ticketTypes = await getTicketTypes(eventId)
    if (ticketTypes.length === 0) {
      throw new Error('No ticket types found')
    }
    ticketTypeId = ticketTypes[0].id
  })

  await runTest('Initialize cart for authenticated user', async () => {
    const response = await initializeCart(eventId)
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to initialize cart')
    }
    bookingId = response.data.bookingId
  })

  await runTest('Add tickets to cart (authenticated)', async () => {
    const updates = { [ticketTypeId]: 2 }
    const response = await updateCart(bookingId, updates)
    if (!response.success) {
      throw new Error(response.error || 'Failed to update cart')
    }
  })

  await runTest('Submit personal info with account creation', async () => {
    const personalInfo = {
      email: userEmail,
      firstName: 'Auth',
      lastName: 'User',
      phone: '+12345678902',
      countryCode: '+1',
      createAccount: true,
      password: 'SecurePassword123!',
    }
    const response = await submitPersonalInfo(bookingId, personalInfo)
    if (!response.success) {
      throw new Error(response.error || 'Failed to create account')
    }
    logInfo(`Account created for ${userEmail}`)
  })

  await runTest('Submit attendee info (authenticated)', async () => {
    const attendees = {
      '0': { name: 'Auth Attendee 1', email: `auth-att1-${Date.now()}@example.com` },
      '1': { name: 'Auth Attendee 2', email: `auth-att2-${Date.now()}@example.com` },
    }
    const response = await submitAttendeeInfo(bookingId, attendees)
    if (!response.success) {
      throw new Error(response.error || 'Failed to submit attendees')
    }
  })

  await runTest('Confirm authenticated booking', async () => {
    const response = await confirmBooking(bookingId)
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to confirm')
    }
    logInfo(`Authenticated booking confirmed: ${response.data.confirmationNumber}`)
  })

  await runTest('Verify user account created', async () => {
    const booking = await getBookingDetails(bookingId)
    if (!booking) {
      throw new Error('Booking not found')
    }
    if (!booking.userId) {
      throw new Error('Booking should be linked to user account')
    }
    logInfo('Booking linked to user account')
  })
}

async function main() {
  const totalTimer = startTimer()

  logSection('Booking Flow Test Suite')
  logInfo('Testing complete booking flows from cart to confirmation')
  logInfo('API Base URL: ' + (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'))

  try {
    await testGuestCheckoutFlow()
    await testAuthenticatedUserFlow()

    const totalDuration = totalTimer()
    const passed = results.filter((r) => r.passed).length
    const failed = results.filter((r) => !r.passed).length

    logSummary({
      total: results.length,
      passed,
      failed,
      duration: totalDuration,
    })

    // Print failed tests if any
    if (failed > 0) {
      logSection('Failed Tests')
      results
        .filter((r) => !r.passed)
        .forEach((r) => {
          logError(r.name, r.error)
        })
    }

    process.exit(failed > 0 ? 1 : 0)
  } catch (error) {
    logError('Test suite failed', error)
    process.exit(1)
  } finally {
    await closeDatabaseConnection()
  }
}

// Run if executed directly
if (require.main === module) {
  main()
}
