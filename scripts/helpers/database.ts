/**
 * Database query helpers for test scripts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Verify inventory consistency: quantityTotal = quantityAvailable + quantitySold + locked
 */
export async function verifyInventoryConsistency(): Promise<{
  valid: boolean
  inconsistencies: Array<{
    ticketTypeId: string
    name: string
    quantityTotal: number
    quantityAvailable: number
    quantitySold: number
    locked: number
    calculated: number
    difference: number
  }>
}> {
  const ticketTypes = await prisma.ticketType.findMany({
    select: {
      id: true,
      name: true,
      quantityTotal: true,
      quantityAvailable: true,
      quantitySold: true,
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

  const inconsistencies = []

  for (const ticketType of ticketTypes) {
    const locked = ticketType.inventoryLocks.reduce((sum, lock) => sum + lock.quantity, 0)
    const calculated = ticketType.quantityAvailable + ticketType.quantitySold + locked
    const difference = ticketType.quantityTotal - calculated

    if (difference !== 0) {
      inconsistencies.push({
        ticketTypeId: ticketType.id,
        name: ticketType.name,
        quantityTotal: ticketType.quantityTotal,
        quantityAvailable: ticketType.quantityAvailable,
        quantitySold: ticketType.quantitySold,
        locked,
        calculated,
        difference,
      })
    }
  }

  return {
    valid: inconsistencies.length === 0,
    inconsistencies,
  }
}

/**
 * Check for negative inventory values
 */
export async function checkNegativeInventory(): Promise<{
  hasNegative: boolean
  negativeTicketTypes: Array<{
    ticketTypeId: string
    name: string
    quantityAvailable: number
  }>
}> {
  const ticketTypes = await prisma.ticketType.findMany({
    where: {
      quantityAvailable: { lt: 0 },
    },
    select: {
      id: true,
      name: true,
      quantityAvailable: true,
    },
  })

  return {
    hasNegative: ticketTypes.length > 0,
    negativeTicketTypes: ticketTypes.map(t => ({
      ticketTypeId: t.id,
      name: t.name,
      quantityAvailable: t.quantityAvailable,
    })),
  }
}

/**
 * Find orphaned inventory locks (locks without a valid draft booking)
 */
export async function findOrphanedInventoryLocks(): Promise<{
  count: number
  locks: Array<{
    id: string
    ticketTypeId: string
    quantity: number
    expiresAt: Date
    draftBookingId: string
  }>
}> {
  // Using raw SQL for better performance
  const result = await prisma.$queryRaw<
    Array<{
      id: string
      ticketTypeId: string
      quantity: number
      expiresAt: Date
      draftBookingId: string
    }>
  >`
    SELECT il.id, il."ticketTypeId", il.quantity, il."expiresAt", il."draftBookingId"
    FROM "InventoryLock" il
    LEFT JOIN "DraftBooking" db ON il."draftBookingId" = db.id
    WHERE db.id IS NULL
  `

  return {
    count: result.length,
    locks: result,
  }
}

/**
 * Get booking details with all related data
 */
export async function getBookingDetails(bookingId: string) {
  return prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      tickets: {
        include: {
          ticketType: true,
        },
      },
      event: true,
      promoCode: true,
      emailLogs: true,
      guests: true,
    },
  })
}

/**
 * Get all inventory locks for a draft booking
 */
export async function getInventoryLocks(draftBookingId: string) {
  return prisma.inventoryLock.findMany({
    where: { draftBookingId },
    include: {
      ticketType: {
        select: {
          id: true,
          name: true,
          quantityAvailable: true,
        },
      },
    },
  })
}

/**
 * Get draft booking with all data
 */
export async function getDraftBooking(draftBookingId: string) {
  return prisma.draftBooking.findUnique({
    where: { id: draftBookingId },
    include: {
      inventoryLocks: {
        include: {
          ticketType: true,
        },
      },
      promoCode: true,
    },
  })
}

/**
 * Count expired inventory locks
 */
export async function countExpiredInventoryLocks(): Promise<number> {
  return prisma.inventoryLock.count({
    where: {
      expiresAt: { lt: new Date() },
    },
  })
}

/**
 * Count expired draft bookings
 */
export async function countExpiredDraftBookings(): Promise<number> {
  return prisma.draftBooking.count({
    where: {
      expiresAt: { lt: new Date() },
    },
  })
}

/**
 * Get email logs with retry status
 */
export async function getEmailLogs(bookingId?: string) {
  return prisma.emailLog.findMany({
    where: bookingId ? { bookingId } : undefined,
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Get email log statistics
 */
export async function getEmailLogStats() {
  const [total, pending, sent, failed] = await Promise.all([
    prisma.emailLog.count(),
    prisma.emailLog.count({ where: { status: 'PENDING' } }),
    prisma.emailLog.count({ where: { status: 'SENT' } }),
    prisma.emailLog.count({ where: { status: 'FAILED' } }),
  ])

  return { total, pending, sent, failed }
}

/**
 * Get promo code details
 */
export async function getPromoCode(code: string) {
  return prisma.promoCode.findUnique({
    where: { code },
  })
}

/**
 * Get all events
 */
export async function getAllEvents() {
  return prisma.event.findMany({
    where: {
      status: 'PUBLISHED',
      date: { gt: new Date() },
    },
    include: {
      ticketTypes: true,
    },
  })
}

/**
 * Get ticket types for an event
 */
export async function getTicketTypes(eventId: string) {
  return prisma.ticketType.findMany({
    where: { eventId },
    orderBy: { sortOrder: 'asc' },
  })
}

/**
 * Close Prisma connection
 */
export async function closeDatabaseConnection() {
  await prisma.$disconnect()
}

export { prisma }
