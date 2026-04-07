import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { handleApiError, successResponse, Errors } from "@/lib/api/errors"
import { InventoryCheckRequest, InventoryCheckResponse, TicketTypeAvailability } from "@/lib/api/types"
import { getInventoryForEvent, getBookingLocks } from "@/lib/booking"
import { cookies } from "next/headers"

/**
 * Query validation schema
 */
const querySchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  ticketTypeIds: z.string().optional(), // Comma-separated list
  bookingId: z.string().optional(),
})

/**
 * GET /api/inventory/check
 *
 * Check inventory availability for ticket types
 * Accounts for locked inventory from other users
 *
 * Query params:
 * - eventId: string - The event to check inventory for
 * - ticketTypeIds: string - Optional comma-separated list of specific ticket types
 * - bookingId: string - Optional booking ID to get session-specific locks
 *
 * Response:
 * - eventId: string
 * - ticketTypes: TicketTypeAvailability[] - Availability info for each ticket type
 * - sessionLocks: Record<string, number> - Locks held by current session (if bookingId provided)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse query params
    const params = querySchema.parse({
      eventId: searchParams.get("eventId"),
      ticketTypeIds: searchParams.get("ticketTypeIds"),
      bookingId: searchParams.get("bookingId"),
    })

    // Parse ticket type IDs if provided
    const ticketTypeIds = params.ticketTypeIds
      ? params.ticketTypeIds.split(",").map((id) => id.trim()).filter(Boolean)
      : undefined

    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id: params.eventId },
      select: {
        id: true,
        name: true,
        status: true,
      },
    })

    if (!event) {
      throw Errors.notFound("Event")
    }

    // Get inventory for the event
    const inventory = await getInventoryForEvent(
      params.eventId,
      ticketTypeIds,
      params.bookingId // Exclude this booking's locks from the count
    )

    // Map to response format
    const ticketTypes: TicketTypeAvailability[] = inventory.map((item) => ({
      ticketTypeId: item.ticketTypeId,
      name: item.name,
      price: item.price,
      available: item.quantityAvailable,
      locked: item.lockedQuantity,
      actualAvailable: item.actualAvailable,
    }))

    // Get session-specific locks if booking ID provided
    let sessionLocks: Record<string, number> | undefined
    if (params.bookingId) {
      const locks = await getBookingLocks(params.bookingId)
      sessionLocks = locks.reduce((acc, lock) => {
        acc[lock.ticketTypeId] = lock.quantity
        return acc
      }, {} as Record<string, number>)
    }

    return successResponse<InventoryCheckResponse>({
      eventId: params.eventId,
      ticketTypes,
      sessionLocks,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/inventory/check
 *
 * Check if requested quantities are available
 * Used for real-time validation before cart update
 *
 * Request body:
 * - eventId: string
 * - quantities: Record<ticketTypeId, requestedQuantity>
 * - bookingId?: string - Current booking to exclude from lock count
 *
 * Response:
 * - valid: boolean - Whether all requested quantities are available
 * - issues: Array<{ ticketTypeId, name, requested, available, message }>
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { eventId, quantities, bookingId } = z.object({
      eventId: z.string().min(1),
      quantities: z.record(z.string(), z.number().int().min(0)),
      bookingId: z.string().optional(),
    }).parse(body)

    // Get inventory for requested ticket types
    const ticketTypeIds = Object.keys(quantities)
    const inventory = await getInventoryForEvent(eventId, ticketTypeIds, bookingId)

    // Create lookup map
    const inventoryMap = new Map(
      inventory.map((item) => [item.ticketTypeId, item])
    )

    // Check each requested quantity
    const issues: Array<{
      ticketTypeId: string
      name: string
      requested: number
      available: number
      message: string
    }> = []

    for (const [ticketTypeId, requestedQuantity] of Object.entries(quantities)) {
      if (requestedQuantity === 0) continue

      const item = inventoryMap.get(ticketTypeId)

      if (!item) {
        issues.push({
          ticketTypeId,
          name: "Unknown",
          requested: requestedQuantity,
          available: 0,
          message: "Ticket type not found",
        })
        continue
      }

      if (requestedQuantity > item.actualAvailable) {
        issues.push({
          ticketTypeId,
          name: item.name,
          requested: requestedQuantity,
          available: item.actualAvailable,
          message:
            item.actualAvailable === 0
              ? `${item.name} is sold out`
              : `Only ${item.actualAvailable} ${item.name} ticket(s) remaining`,
        })
      }
    }

    return successResponse({
      valid: issues.length === 0,
      issues,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
