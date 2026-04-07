#!/usr/bin/env ts-node
/**
 * Validate concurrent bookings - Stress test with race conditions
 *
 * Tests:
 * - Concurrent booking attempts (5, 10, 20 parallel requests)
 * - Inventory race conditions
 * - Atomic transaction preventing double-booking
 * - Promo code concurrent usage validation
 *
 * Measures:
 * - Latency at different concurrency levels
 * - Success/failure rates
 *
 * Expected results:
 * - Some bookings succeed, others fail with INSUFFICIENT_INVENTORY
 * - No double-booking or negative inventory
 * - Promo codes respect max usage limits
 */

import {
  initializeCart,
  updateCart,
  submitPersonalInfo,
  submitAttendeeInfo,
  confirmBooking,
  applyPromoCode,
} from './helpers/api-client'
import {
  getAllEvents,
  getTicketTypes,
  verifyInventoryConsistency,
  checkNegativeInventory,
  closeDatabaseConnection,
  prisma,
} from './helpers/database'
import {
  logSection,
  logSuccess,
  logError,
  logTest,
  logInfo,
  logWarning,
  logSummary,
  startTimer,
} from './helpers/logger'

interface ConcurrencyTestResult {
  concurrency: number
  attempted: number
  succeeded: number
  failed: number
  avgLatency: number
  minLatency: number
  maxLatency: number
  errors: Record<string, number>
}

async function createBooking(
  eventId: string,
  ticketTypeId: string,
  quantity: number,
  usePromo: boolean = false
): Promise<{
  success: boolean
  duration: number
  error?: string
  bookingId?: string
}> {
  const timer = startTimer()

  try {
    // Initialize cart
    const cartResponse = await initializeCart(eventId)
    if (!cartResponse.success || !cartResponse.data) {
      throw new Error(cartResponse.error || 'Failed to initialize cart')
    }
    const bookingId = cartResponse.data.bookingId

    // Update cart
    const updates = { [ticketTypeId]: quantity }
    const updateResponse = await updateCart(bookingId, updates)
    if (!updateResponse.success) {
      throw new Error(updateResponse.error || 'Failed to update cart')
    }

    // Apply promo code if requested
    if (usePromo) {
      await applyPromoCode(bookingId, 'WELCOME10')
      // Ignore errors - promo might be at max usage
    }

    // Submit personal info
    const personalInfo = {
      email: `concurrent-test-${Date.now()}-${Math.random()}@example.com`,
      firstName: 'Concurrent',
      lastName: 'Test',
      phone: `+1${Math.floor(Math.random() * 10000000000)}`,
      countryCode: '+1',
    }
    const personalResponse = await submitPersonalInfo(bookingId, personalInfo)
    if (!personalResponse.success) {
      throw new Error(personalResponse.error || 'Failed to submit personal info')
    }

    // Submit attendee info
    const attendees: Record<string, { name: string; email: string }> = {}
    for (let i = 0; i < quantity; i++) {
      attendees[i.toString()] = {
        name: `Attendee ${i + 1}`,
        email: `attendee-${i}-${Date.now()}-${Math.random()}@example.com`,
      }
    }
    const attendeeResponse = await submitAttendeeInfo(bookingId, attendees)
    if (!attendeeResponse.success) {
      throw new Error(attendeeResponse.error || 'Failed to submit attendee info')
    }

    // Confirm booking
    const confirmResponse = await confirmBooking(bookingId)
    if (!confirmResponse.success) {
      throw new Error(confirmResponse.error || 'Failed to confirm booking')
    }

    return {
      success: true,
      duration: timer(),
      bookingId,
    }
  } catch (error) {
    return {
      success: false,
      duration: timer(),
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

async function runConcurrencyTest(
  concurrency: number,
  eventId: string,
  ticketTypeId: string,
  ticketsPerBooking: number
): Promise<ConcurrencyTestResult> {
  logInfo(`Running ${concurrency} concurrent booking attempts...`)

  const promises = Array(concurrency)
    .fill(null)
    .map(() => createBooking(eventId, ticketTypeId, ticketsPerBooking))

  const results = await Promise.all(promises)

  const succeeded = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length
  const durations = results.map((r) => r.duration)
  const errors: Record<string, number> = {}

  results.forEach((r) => {
    if (!r.success && r.error) {
      errors[r.error] = (errors[r.error] || 0) + 1
    }
  })

  return {
    concurrency,
    attempted: concurrency,
    succeeded,
    failed,
    avgLatency: durations.reduce((a, b) => a + b, 0) / durations.length,
    minLatency: Math.min(...durations),
    maxLatency: Math.max(...durations),
    errors,
  }
}

async function testConcurrentBookings() {
  logSection('Concurrent Booking Tests')

  // Get event with limited inventory
  const events = await getAllEvents()
  if (events.length === 0) {
    throw new Error('No published events found')
  }

  const event = events[0]
  const ticketTypes = await getTicketTypes(event.id)
  if (ticketTypes.length === 0) {
    throw new Error('No ticket types found')
  }

  const ticketType = ticketTypes[0]
  logInfo(`Testing with event: ${event.name}`)
  logInfo(`Ticket type: ${ticketType.name}`)
  logInfo(`Available inventory: ${ticketType.quantityAvailable}`)

  const testResults: ConcurrencyTestResult[] = []

  // Test with increasing concurrency
  for (const concurrency of [5, 10, 20]) {
    logSection(`Concurrency Level: ${concurrency}`)

    const result = await runConcurrencyTest(concurrency, event.id, ticketType.id, 2)
    testResults.push(result)

    logInfo(`Attempted: ${result.attempted}`)
    logSuccess(`Succeeded: ${result.succeeded}`)
    logError(`Failed: ${result.failed}`)
    logInfo(`Avg Latency: ${result.avgLatency.toFixed(2)}ms`)
    logInfo(`Min Latency: ${result.minLatency}ms`)
    logInfo(`Max Latency: ${result.maxLatency}ms`)

    if (Object.keys(result.errors).length > 0) {
      logInfo('Error breakdown:')
      Object.entries(result.errors).forEach(([error, count]) => {
        logWarning(`  ${error}: ${count} occurrences`)
      })
    }

    // Verify inventory consistency after each test
    const consistency = await verifyInventoryConsistency()
    if (!consistency.valid) {
      logError('Inventory inconsistency detected!')
      consistency.inconsistencies.forEach((inc) => {
        logError(`  ${inc.name}: Expected ${inc.quantityTotal}, got ${inc.calculated}`)
      })
    } else {
      logSuccess('Inventory consistency verified')
    }

    // Check for negative inventory
    const negativeCheck = await checkNegativeInventory()
    if (negativeCheck.hasNegative) {
      logError('Negative inventory detected!')
      negativeCheck.negativeTicketTypes.forEach((tt) => {
        logError(`  ${tt.name}: ${tt.quantityAvailable}`)
      })
    } else {
      logSuccess('No negative inventory')
    }

    // Wait a bit between tests
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  // Summary
  logSection('Concurrency Test Summary')
  testResults.forEach((result) => {
    const successRate = ((result.succeeded / result.attempted) * 100).toFixed(1)
    logInfo(
      `${result.concurrency}x: ${result.succeeded}/${result.attempted} succeeded (${successRate}%) - Avg: ${result.avgLatency.toFixed(2)}ms`
    )
  })
}

async function testPromoCodeConcurrency() {
  logSection('Promo Code Concurrent Usage Test')

  // Create a promo code with max uses
  const promoCode = await prisma.promoCode.findUnique({
    where: { code: 'WELCOME10' },
  })

  if (!promoCode) {
    logWarning('WELCOME10 promo code not found, skipping promo test')
    return
  }

  logInfo(`Testing promo code: ${promoCode.code}`)
  logInfo(`Max uses: ${promoCode.maxUses || 'unlimited'}`)
  logInfo(`Current uses: ${promoCode.usedCount}`)

  if (!promoCode.maxUses) {
    logWarning('Promo code has unlimited uses, skipping concurrent test')
    return
  }

  const remainingUses = promoCode.maxUses - promoCode.usedCount
  if (remainingUses < 5) {
    logWarning('Not enough remaining uses for concurrent test')
    return
  }

  const events = await getAllEvents()
  const ticketTypes = await getTicketTypes(events[0].id)

  // Try to use promo code concurrently more times than allowed
  const concurrency = Math.min(remainingUses + 3, 10)
  logInfo(`Attempting ${concurrency} concurrent promo code applications...`)

  const promises = Array(concurrency)
    .fill(null)
    .map(() => createBooking(events[0].id, ticketTypes[0].id, 1, true))

  const results = await Promise.all(promises)
  const succeeded = results.filter((r) => r.success).length

  logInfo(`${succeeded} bookings succeeded (should be <= ${remainingUses})`)

  // Verify promo code usage count
  const updatedPromo = await prisma.promoCode.findUnique({
    where: { code: 'WELCOME10' },
  })

  if (updatedPromo) {
    const actualUses = updatedPromo.usedCount - promoCode.usedCount
    logInfo(`Actual promo code uses: ${actualUses}`)

    if (updatedPromo.usedCount > promoCode.maxUses!) {
      logError('Promo code exceeded max uses!')
    } else {
      logSuccess('Promo code usage limit enforced correctly')
    }
  }
}

async function main() {
  const totalTimer = startTimer()

  logSection('Concurrent Bookings Validation Suite')
  logInfo('Testing race conditions and atomic transactions')
  logInfo('API Base URL: ' + (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'))

  try {
    await testConcurrentBookings()
    await testPromoCodeConcurrency()

    const totalDuration = totalTimer()

    logSection('Test Complete')
    logInfo(`Total duration: ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)`)
    logSuccess('All concurrency tests completed')

    process.exit(0)
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
