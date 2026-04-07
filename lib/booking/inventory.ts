import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { Errors, ApiError } from "@/lib/api/errors"

/**
 * Service fee rate (37% as per business requirements)
 */
export const SERVICE_FEE_RATE = 0.37

/**
 * Cart expiration time in milliseconds (30 minutes)
 */
export const CART_EXPIRY_MS = 30 * 60 * 1000

/**
 * Calculate service fee from subtotal
 */
export function calculateServiceFee(subtotal: number): number {
  return Math.round(subtotal * SERVICE_FEE_RATE * 100) / 100
}

/**
 * Get available inventory for a ticket type, accounting for locked tickets
 * @param ticketTypeId - The ticket type to check
 * @param excludeBookingId - Optional booking ID to exclude from lock count (for updates)
 */
export async function getAvailableInventory(
  ticketTypeId: string,
  excludeBookingId?: string
): Promise<{
  ticketTypeId: string
  name: string
  price: number
  quantityAvailable: number
  lockedQuantity: number
  actualAvailable: number
}> {
  const ticketType = await prisma.ticketType.findUnique({
    where: { id: ticketTypeId },
    include: {
      inventoryLocks: {
        where: {
          expiresAt: { gt: new Date() },
          ...(excludeBookingId && { draftBookingId: { not: excludeBookingId } }),
        },
      },
    },
  })

  if (!ticketType) {
    throw Errors.notFound("Ticket type")
  }

  const lockedQuantity = ticketType.inventoryLocks.reduce(
    (sum, lock) => sum + lock.quantity,
    0
  )

  const actualAvailable = Math.max(0, ticketType.quantityAvailable - lockedQuantity)

  return {
    ticketTypeId: ticketType.id,
    name: ticketType.name,
    price: Number(ticketType.price),
    quantityAvailable: ticketType.quantityAvailable,
    lockedQuantity,
    actualAvailable,
  }
}

/**
 * Get inventory for multiple ticket types
 */
export async function getInventoryForEvent(
  eventId: string,
  ticketTypeIds?: string[],
  excludeBookingId?: string
): Promise<
  Array<{
    ticketTypeId: string
    name: string
    price: number
    quantityAvailable: number
    lockedQuantity: number
    actualAvailable: number
  }>
> {
  const whereClause: Prisma.TicketTypeWhereInput = {
    eventId,
    ...(ticketTypeIds && { id: { in: ticketTypeIds } }),
  }

  const ticketTypes = await prisma.ticketType.findMany({
    where: whereClause,
    include: {
      inventoryLocks: {
        where: {
          expiresAt: { gt: new Date() },
          ...(excludeBookingId && { draftBookingId: { not: excludeBookingId } }),
        },
      },
    },
    orderBy: { sortOrder: "asc" },
  })

  return ticketTypes.map((tt) => {
    const lockedQuantity = tt.inventoryLocks.reduce(
      (sum, lock) => sum + lock.quantity,
      0
    )
    return {
      ticketTypeId: tt.id,
      name: tt.name,
      price: Number(tt.price),
      quantityAvailable: tt.quantityAvailable,
      lockedQuantity,
      actualAvailable: Math.max(0, tt.quantityAvailable - lockedQuantity),
    }
  })
}

/**
 * Validate that requested quantities can be fulfilled
 * @returns true if valid, throws ApiError if not
 */
export async function validateInventoryAvailability(
  updates: Record<string, number>,
  excludeBookingId?: string
): Promise<void> {
  const ticketTypeIds = Object.keys(updates)

  for (const ticketTypeId of ticketTypeIds) {
    const requestedQuantity = updates[ticketTypeId]
    if (requestedQuantity < 0) {
      throw Errors.validation("Quantity cannot be negative")
    }

    if (requestedQuantity === 0) {
      continue // Skip zero quantities - they'll be removed
    }

    const inventory = await getAvailableInventory(ticketTypeId, excludeBookingId)

    if (requestedQuantity > inventory.actualAvailable) {
      throw Errors.insufficientInventory(
        inventory.name,
        inventory.actualAvailable
      )
    }
  }
}

/**
 * Create or update inventory locks for a draft booking
 * Uses upsert pattern to handle both new and updated quantities
 */
export async function updateInventoryLocks(
  draftBookingId: string,
  updates: Record<string, number>,
  tx?: Prisma.TransactionClient
): Promise<void> {
  const client = tx || prisma
  const expiresAt = new Date(Date.now() + CART_EXPIRY_MS)

  // Get current locks for this booking
  const currentLocks = await client.inventoryLock.findMany({
    where: { draftBookingId },
  })

  const currentLockMap = new Map(
    currentLocks.map((lock) => [lock.ticketTypeId, lock])
  )

  const operations: Prisma.PrismaPromise<unknown>[] = []

  // Process each update
  for (const [ticketTypeId, quantity] of Object.entries(updates)) {
    const existingLock = currentLockMap.get(ticketTypeId)

    if (quantity === 0) {
      // Remove lock if quantity is 0
      if (existingLock) {
        operations.push(
          client.inventoryLock.delete({
            where: { id: existingLock.id },
          })
        )
      }
    } else if (existingLock) {
      // Update existing lock
      operations.push(
        client.inventoryLock.update({
          where: { id: existingLock.id },
          data: { quantity, expiresAt },
        })
      )
    } else {
      // Create new lock
      operations.push(
        client.inventoryLock.create({
          data: {
            draftBookingId,
            ticketTypeId,
            quantity,
            expiresAt,
          },
        })
      )
    }

    // Remove from map so we know we've processed it
    currentLockMap.delete(ticketTypeId)
  }

  // Any remaining locks in the map were not in updates - delete them
  for (const [, lock] of currentLockMap) {
    operations.push(
      client.inventoryLock.delete({
        where: { id: lock.id },
      })
    )
  }

  // Execute all operations
  await Promise.all(operations)
}

/**
 * Get locks for a specific booking
 */
export async function getBookingLocks(
  draftBookingId: string
): Promise<Array<{ ticketTypeId: string; quantity: number }>> {
  const locks = await prisma.inventoryLock.findMany({
    where: {
      draftBookingId,
      expiresAt: { gt: new Date() },
    },
    select: {
      ticketTypeId: true,
      quantity: true,
    },
  })

  return locks
}

/**
 * Release all locks for a booking (used on confirmation or abandonment)
 */
export async function releaseInventoryLocks(
  draftBookingId: string,
  tx?: Prisma.TransactionClient
): Promise<void> {
  const client = tx || prisma
  await client.inventoryLock.deleteMany({
    where: { draftBookingId },
  })
}

/**
 * Clean up expired inventory locks (for cron job)
 * @returns Number of locks deleted
 */
export async function cleanupExpiredLocks(): Promise<number> {
  const result = await prisma.inventoryLock.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  })

  return result.count
}

/**
 * Clean up expired draft bookings (for cron job)
 * @returns Number of drafts deleted
 */
export async function cleanupExpiredDraftBookings(): Promise<number> {
  // First delete all inventory locks for expired drafts (cascade should handle this, but being explicit)
  await prisma.inventoryLock.deleteMany({
    where: {
      draftBooking: {
        expiresAt: { lt: new Date() },
      },
    },
  })

  // Then delete the drafts
  const result = await prisma.draftBooking.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  })

  return result.count
}
