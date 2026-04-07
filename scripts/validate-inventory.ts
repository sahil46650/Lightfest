#!/usr/bin/env ts-node
/**
 * Validate inventory consistency
 *
 * Checks:
 * - Consistency: quantityTotal = quantityAvailable + quantitySold + locked
 * - No negative inventory values
 * - No orphaned InventoryLock records
 * - Uses direct SQL queries for verification
 */

import {
  verifyInventoryConsistency,
  checkNegativeInventory,
  findOrphanedInventoryLocks,
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
  logData,
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

async function testInventoryConsistency() {
  logSection('Inventory Consistency Validation')

  await runTest('Verify inventory equation consistency', async () => {
    const result = await verifyInventoryConsistency()

    if (!result.valid) {
      logWarning(`Found ${result.inconsistencies.length} inconsistencies:`)
      result.inconsistencies.forEach((inc) => {
        logError(
          `${inc.name}: Total=${inc.quantityTotal}, Available=${inc.quantityAvailable}, Sold=${inc.quantitySold}, Locked=${inc.locked}, Calculated=${inc.calculated}, Difference=${inc.difference}`
        )
      })
      throw new Error(`${result.inconsistencies.length} inventory inconsistencies found`)
    }

    logSuccess('All ticket types have consistent inventory')
  })

  await runTest('Check for negative inventory values', async () => {
    const result = await checkNegativeInventory()

    if (result.hasNegative) {
      logWarning(`Found ${result.negativeTicketTypes.length} ticket types with negative inventory:`)
      result.negativeTicketTypes.forEach((tt) => {
        logError(`${tt.name}: ${tt.quantityAvailable}`)
      })
      throw new Error(`${result.negativeTicketTypes.length} ticket types have negative inventory`)
    }

    logSuccess('No negative inventory values found')
  })

  await runTest('Check for orphaned inventory locks', async () => {
    const result = await findOrphanedInventoryLocks()

    if (result.count > 0) {
      logWarning(`Found ${result.count} orphaned inventory locks:`)
      result.locks.forEach((lock) => {
        logWarning(
          `Lock ${lock.id}: ${lock.quantity} tickets, expires ${lock.expiresAt}, draft booking ${lock.draftBookingId}`
        )
      })
      throw new Error(`${result.count} orphaned inventory locks found`)
    }

    logSuccess('No orphaned inventory locks found')
  })
}

async function testInventoryDetails() {
  logSection('Detailed Inventory Analysis')

  await runTest('Get inventory summary', async () => {
    const ticketTypes = await prisma.ticketType.findMany({
      select: {
        id: true,
        name: true,
        quantityTotal: true,
        quantityAvailable: true,
        quantitySold: true,
        event: {
          select: {
            name: true,
          },
        },
        inventoryLocks: {
          where: {
            expiresAt: { gt: new Date() },
          },
          select: {
            quantity: true,
          },
        },
      },
    })

    if (ticketTypes.length === 0) {
      logWarning('No ticket types found in database')
      return
    }

    logInfo(`Found ${ticketTypes.length} ticket types:`)
    ticketTypes.forEach((tt) => {
      const locked = tt.inventoryLocks.reduce((sum, lock) => sum + lock.quantity, 0)
      const utilization = ((tt.quantitySold / tt.quantityTotal) * 100).toFixed(1)

      logInfo(`\n  ${tt.event.name} - ${tt.name}:`)
      logInfo(`    Total: ${tt.quantityTotal}`)
      logInfo(`    Available: ${tt.quantityAvailable}`)
      logInfo(`    Sold: ${tt.quantitySold} (${utilization}%)`)
      logInfo(`    Locked: ${locked}`)
    })
  })

  await runTest('Get active inventory locks summary', async () => {
    const activeLocks = await prisma.inventoryLock.findMany({
      where: {
        expiresAt: { gt: new Date() },
      },
      include: {
        ticketType: {
          select: {
            name: true,
            event: {
              select: {
                name: true,
              },
            },
          },
        },
        draftBooking: {
          select: {
            id: true,
            currentStep: true,
            createdAt: true,
            expiresAt: true,
          },
        },
      },
    })

    logInfo(`Found ${activeLocks.length} active inventory locks`)

    if (activeLocks.length > 0) {
      const totalLocked = activeLocks.reduce((sum, lock) => sum + lock.quantity, 0)
      logInfo(`Total tickets locked: ${totalLocked}`)

      // Group by event
      const byEvent: Record<string, number> = {}
      activeLocks.forEach((lock) => {
        const eventName = lock.ticketType.event.name
        byEvent[eventName] = (byEvent[eventName] || 0) + lock.quantity
      })

      logInfo('Locks by event:')
      Object.entries(byEvent).forEach(([event, count]) => {
        logInfo(`  ${event}: ${count} tickets`)
      })
    }
  })

  await runTest('Get expired locks summary', async () => {
    const expiredLocks = await prisma.inventoryLock.findMany({
      where: {
        expiresAt: { lt: new Date() },
      },
      select: {
        id: true,
        quantity: true,
        expiresAt: true,
      },
    })

    if (expiredLocks.length > 0) {
      const totalExpired = expiredLocks.reduce((sum, lock) => sum + lock.quantity, 0)
      logWarning(`Found ${expiredLocks.length} expired locks holding ${totalExpired} tickets`)
      logInfo('These should be cleaned up by the cleanup job')
    } else {
      logSuccess('No expired inventory locks found')
    }
  })
}

async function testInventoryQueries() {
  logSection('SQL Inventory Queries')

  await runTest('Run raw SQL consistency check', async () => {
    // This validates the inventory equation using raw SQL
    const result = await prisma.$queryRaw<
      Array<{
        id: string
        name: string
        quantityTotal: number
        quantityAvailable: number
        quantitySold: number
        locked: bigint
        calculated: bigint
        isConsistent: boolean
      }>
    >`
      SELECT
        tt.id,
        tt.name,
        tt."quantityTotal",
        tt."quantityAvailable",
        tt."quantitySold",
        COALESCE(SUM(il.quantity), 0)::bigint as locked,
        (tt."quantityAvailable" + tt."quantitySold" + COALESCE(SUM(il.quantity), 0))::bigint as calculated,
        (tt."quantityTotal" = tt."quantityAvailable" + tt."quantitySold" + COALESCE(SUM(il.quantity), 0)) as "isConsistent"
      FROM "TicketType" tt
      LEFT JOIN "InventoryLock" il ON tt.id = il."ticketTypeId" AND il."expiresAt" > NOW()
      GROUP BY tt.id, tt.name, tt."quantityTotal", tt."quantityAvailable", tt."quantitySold"
    `

    const inconsistent = result.filter((r) => !r.isConsistent)

    if (inconsistent.length > 0) {
      logError(`Found ${inconsistent.length} inconsistent ticket types via SQL:`)
      inconsistent.forEach((tt) => {
        logError(
          `  ${tt.name}: Total=${tt.quantityTotal}, Calculated=${tt.calculated}, Locked=${tt.locked}`
        )
      })
      throw new Error('SQL query found inventory inconsistencies')
    }

    logSuccess('SQL consistency check passed')
  })

  await runTest('Verify no double-locked tickets', async () => {
    // Check if any ticket is locked by multiple draft bookings
    const result = await prisma.$queryRaw<
      Array<{
        ticketTypeId: string
        lockCount: bigint
        totalLocked: bigint
      }>
    >`
      SELECT
        "ticketTypeId",
        COUNT(*)::bigint as "lockCount",
        SUM(quantity)::bigint as "totalLocked"
      FROM "InventoryLock"
      WHERE "expiresAt" > NOW()
      GROUP BY "ticketTypeId"
      HAVING COUNT(*) > 1
    `

    if (result.length > 0) {
      logInfo(`Found ${result.length} ticket types with multiple locks (this is normal):`)
      result.forEach((r) => {
        logInfo(`  Ticket Type ${r.ticketTypeId}: ${r.lockCount} locks, ${r.totalLocked} tickets`)
      })
    } else {
      logInfo('Each ticket type has at most one active lock')
    }
  })
}

async function main() {
  const totalTimer = startTimer()

  logSection('Inventory Validation Suite')
  logInfo('Comprehensive inventory consistency checks')
  logInfo('Database URL: ' + (process.env.DATABASE_URL ? 'Connected' : 'Not configured'))

  try {
    await testInventoryConsistency()
    await testInventoryDetails()
    await testInventoryQueries()

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
