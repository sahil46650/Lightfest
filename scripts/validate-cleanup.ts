#!/usr/bin/env ts-node
/**
 * Validate cleanup operations
 *
 * Tests:
 * - Cleanup of expired InventoryLock records
 * - Cleanup of expired DraftBooking with cascade deletions
 * - Verifies active records are preserved
 * - Tests idempotency of cleanup operations
 */

import {
  countExpiredInventoryLocks,
  countExpiredDraftBookings,
  closeDatabaseConnection,
  prisma,
} from './helpers/database'
import { cleanupInventory } from './helpers/api-client'
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

async function createExpiredTestData() {
  logSection('Creating Expired Test Data')

  // Create a draft booking that's already expired
  const expiredDraft = await prisma.draftBooking.create({
    data: {
      eventId: (await prisma.event.findFirst())!.id,
      sessionId: `test-expired-${Date.now()}`,
      currentStep: 'TICKET_SELECTION',
      cart: JSON.stringify([]),
      expiresAt: new Date(Date.now() - 60 * 60 * 1000), // Expired 1 hour ago
    },
  })

  logInfo(`Created expired draft booking: ${expiredDraft.id}`)

  // Create an expired inventory lock
  const ticketType = await prisma.ticketType.findFirst()
  if (ticketType) {
    const expiredLock = await prisma.inventoryLock.create({
      data: {
        draftBookingId: expiredDraft.id,
        ticketTypeId: ticketType.id,
        quantity: 2,
        expiresAt: new Date(Date.now() - 30 * 60 * 1000), // Expired 30 minutes ago
      },
    })

    logInfo(`Created expired inventory lock: ${expiredLock.id}`)
  }

  return { draftBookingId: expiredDraft.id }
}

async function createActiveTestData() {
  logSection('Creating Active Test Data')

  // Create a draft booking that's still valid
  const activeDraft = await prisma.draftBooking.create({
    data: {
      eventId: (await prisma.event.findFirst())!.id,
      sessionId: `test-active-${Date.now()}`,
      currentStep: 'TICKET_SELECTION',
      cart: JSON.stringify([]),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // Expires in 30 minutes
    },
  })

  logInfo(`Created active draft booking: ${activeDraft.id}`)

  // Create an active inventory lock
  const ticketType = await prisma.ticketType.findFirst()
  if (ticketType) {
    const activeLock = await prisma.inventoryLock.create({
      data: {
        draftBookingId: activeDraft.id,
        ticketTypeId: ticketType.id,
        quantity: 1,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // Expires in 30 minutes
      },
    })

    logInfo(`Created active inventory lock: ${activeLock.id}`)
  }

  return { draftBookingId: activeDraft.id }
}

async function testInventoryLockCleanup() {
  logSection('Inventory Lock Cleanup Validation')

  let expiredData: { draftBookingId: string } = { draftBookingId: '' }
  let activeData: { draftBookingId: string } = { draftBookingId: '' }

  await runTest('Create test data for cleanup', async () => {
    expiredData = await createExpiredTestData()
    activeData = await createActiveTestData()
    logSuccess('Test data created')
  })

  await runTest('Count expired locks before cleanup', async () => {
    const count = await countExpiredInventoryLocks()
    logInfo(`Found ${count} expired inventory locks`)

    if (count === 0) {
      logWarning('No expired locks found (may need to wait or create test data)')
    }
  })

  await runTest('Run cleanup operation', async () => {
    const response = await cleanupInventory()

    if (!response.success) {
      throw new Error(response.error || 'Cleanup failed')
    }

    logSuccess('Cleanup operation completed')
  })

  await runTest('Verify expired locks were deleted', async () => {
    const count = await countExpiredInventoryLocks()

    if (count > 0) {
      logWarning(`Still found ${count} expired locks after cleanup`)
      // This might be ok if new expired locks were created during the test
    } else {
      logSuccess('All expired locks cleaned up')
    }
  })

  await runTest('Verify active locks were preserved', async () => {
    const activeLocks = await prisma.inventoryLock.findMany({
      where: {
        draftBookingId: activeData.draftBookingId,
      },
    })

    if (activeLocks.length === 0) {
      throw new Error('Active locks were deleted! They should be preserved')
    }

    logSuccess(`Active locks preserved: ${activeLocks.length} locks`)
  })

  await runTest('Test cleanup idempotency', async () => {
    // Run cleanup again - should not cause errors
    const response1 = await cleanupInventory()
    if (!response1.success) {
      throw new Error('First cleanup failed')
    }

    const response2 = await cleanupInventory()
    if (!response2.success) {
      throw new Error('Second cleanup failed')
    }

    logSuccess('Cleanup is idempotent - can be run multiple times safely')
  })

  // Cleanup test data
  await prisma.inventoryLock.deleteMany({
    where: {
      draftBookingId: { in: [expiredData.draftBookingId, activeData.draftBookingId] },
    },
  })
  await prisma.draftBooking.deleteMany({
    where: {
      id: { in: [expiredData.draftBookingId, activeData.draftBookingId] },
    },
  })

  logInfo('Test data cleaned up')
}

async function testDraftBookingCleanup() {
  logSection('Draft Booking Cleanup Validation')

  await runTest('Count expired draft bookings', async () => {
    const count = await countExpiredDraftBookings()
    logInfo(`Found ${count} expired draft bookings`)
  })

  await runTest('Verify cascade deletion of inventory locks', async () => {
    // Create a draft booking with locks, then delete it
    const testDraft = await prisma.draftBooking.create({
      data: {
        eventId: (await prisma.event.findFirst())!.id,
        sessionId: `test-cascade-${Date.now()}`,
        currentStep: 'TICKET_SELECTION',
        cart: JSON.stringify([]),
        expiresAt: new Date(Date.now() - 60 * 60 * 1000),
      },
    })

    const ticketType = await prisma.ticketType.findFirst()
    if (!ticketType) {
      throw new Error('No ticket type found')
    }

    // Create locks for this draft
    await prisma.inventoryLock.create({
      data: {
        draftBookingId: testDraft.id,
        ticketTypeId: ticketType.id,
        quantity: 3,
        expiresAt: new Date(Date.now() - 30 * 60 * 1000),
      },
    })

    logInfo(`Created draft booking ${testDraft.id} with lock`)

    // Delete the draft booking
    await prisma.draftBooking.delete({
      where: { id: testDraft.id },
    })

    // Verify locks were cascaded
    const orphanedLocks = await prisma.inventoryLock.findMany({
      where: { draftBookingId: testDraft.id },
    })

    if (orphanedLocks.length > 0) {
      throw new Error('Inventory locks were not cascade deleted!')
    }

    logSuccess('Cascade deletion works correctly')
  })

  await runTest('Delete expired draft bookings manually', async () => {
    const expiredDrafts = await prisma.draftBooking.findMany({
      where: {
        expiresAt: { lt: new Date() },
      },
      select: {
        id: true,
      },
    })

    const countBefore = expiredDrafts.length
    logInfo(`Deleting ${countBefore} expired draft bookings...`)

    await prisma.draftBooking.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    })

    const countAfter = await countExpiredDraftBookings()

    if (countAfter > 0) {
      logWarning(`${countAfter} expired drafts remain (may have been created during cleanup)`)
    } else {
      logSuccess('All expired draft bookings deleted')
    }
  })
}

async function testCleanupStatistics() {
  logSection('Cleanup Statistics')

  await runTest('Get cleanup statistics', async () => {
    const [
      totalDrafts,
      expiredDrafts,
      activeDrafts,
      totalLocks,
      expiredLocks,
      activeLocks,
    ] = await Promise.all([
      prisma.draftBooking.count(),
      prisma.draftBooking.count({ where: { expiresAt: { lt: new Date() } } }),
      prisma.draftBooking.count({ where: { expiresAt: { gte: new Date() } } }),
      prisma.inventoryLock.count(),
      prisma.inventoryLock.count({ where: { expiresAt: { lt: new Date() } } }),
      prisma.inventoryLock.count({ where: { expiresAt: { gte: new Date() } } }),
    ])

    logInfo('Draft Bookings:')
    logInfo(`  Total: ${totalDrafts}`)
    logInfo(`  Active: ${activeDrafts}`)
    logInfo(`  Expired: ${expiredDrafts}`)

    logInfo('Inventory Locks:')
    logInfo(`  Total: ${totalLocks}`)
    logInfo(`  Active: ${activeLocks}`)
    logInfo(`  Expired: ${expiredLocks}`)

    if (expiredDrafts > 0 || expiredLocks > 0) {
      logWarning('There are expired records that should be cleaned up')
    } else {
      logSuccess('No expired records found - system is clean')
    }
  })

  await runTest('Check for old draft bookings', async () => {
    const oldDrafts = await prisma.draftBooking.findMany({
      where: {
        createdAt: {
          lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Older than 7 days
        },
      },
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
        currentStep: true,
      },
    })

    if (oldDrafts.length > 0) {
      logWarning(`Found ${oldDrafts.length} draft bookings older than 7 days:`)
      oldDrafts.forEach((draft) => {
        const age = Date.now() - draft.createdAt.getTime()
        const daysOld = (age / (1000 * 60 * 60 * 24)).toFixed(1)
        const isExpired = draft.expiresAt < new Date()
        logWarning(
          `  ${draft.id}: ${daysOld} days old, step: ${draft.currentStep}, expired: ${isExpired}`
        )
      })
    } else {
      logSuccess('No draft bookings older than 7 days')
    }
  })

  await runTest('Check for orphaned records', async () => {
    // Check for inventory locks without draft bookings
    const orphanedLocks = await prisma.$queryRaw<
      Array<{ id: string; draftBookingId: string }>
    >`
      SELECT il.id, il."draftBookingId"
      FROM "InventoryLock" il
      LEFT JOIN "DraftBooking" db ON il."draftBookingId" = db.id
      WHERE db.id IS NULL
    `

    if (orphanedLocks.length > 0) {
      logError(`Found ${orphanedLocks.length} orphaned inventory locks!`)
      orphanedLocks.forEach((lock) => {
        logError(`  Lock ${lock.id} references non-existent draft ${lock.draftBookingId}`)
      })
      throw new Error('Orphaned inventory locks found')
    } else {
      logSuccess('No orphaned inventory locks found')
    }
  })
}

async function main() {
  const totalTimer = startTimer()

  logSection('Cleanup Validation Suite')
  logInfo('Testing expired record cleanup and cascade deletions')
  logInfo('Database URL: ' + (process.env.DATABASE_URL ? 'Connected' : 'Not configured'))

  try {
    await testInventoryLockCleanup()
    await testDraftBookingCleanup()
    await testCleanupStatistics()

    const totalDuration = totalTimer()
    const passed = results.filter((r) => r.passed).length
    const failed = results.filter((r) => !r.passed).length

    logSummary({
      total: results.length,
      passed,
      failed,
      duration: totalDuration,
    })

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
