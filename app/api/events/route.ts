import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getInventoryForEvent } from '@/lib/booking/inventory'
import { successResponse, handleApiError } from '@/lib/api/errors'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const sortBy = (searchParams.get('sortBy') || 'date') as 'date' | 'location' | 'availability'
    const sortOrder = (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '12')))

    // Validate sortBy parameter
    if (!['date', 'location', 'availability'].includes(sortBy)) {
      return NextResponse.json(
        { success: false, error: 'Invalid sortBy parameter. Must be: date, location, or availability' },
        { status: 400 }
      )
    }

    // Build base query - only PUBLISHED events with future dates
    const baseWhere = {
      status: 'PUBLISHED' as const,
      date: {
        gte: new Date(),
      },
      ticketTypes: {
        some: {}, // Must have at least one ticket type
      },
    }

    // Get total count for pagination
    const totalCount = await prisma.event.count({
      where: baseWhere,
    })

    // Fetch events with initial sort (location or date)
    let events = await prisma.event.findMany({
      where: baseWhere,
      include: {
        ticketTypes: {
          select: {
            id: true,
            price: true,
            quantityAvailable: true,
            inventoryLocks: {
              where: {
                expiresAt: { gt: new Date() },
              },
              select: {
                quantity: true,
              },
            },
          },
        },
      },
      ...(sortBy !== 'availability' && {
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      skip: (page - 1) * limit,
      take: limit,
    })

    // Calculate inventory and enrich events
    const eventsWithDetails = await Promise.all(
      events.map(async (event) => {
        const inventory = await getInventoryForEvent(event.id)

        const ticketsRemaining = inventory.reduce(
          (sum, tt) => sum + tt.actualAvailable,
          0
        )

        const lowestPrice = inventory.length > 0
          ? Math.min(...inventory.map(tt => tt.price))
          : 0

        return {
          id: event.id,
          name: event.name,
          slug: event.slug,
          description: event.description,
          imageUrl: event.imageUrl,
          location: event.location,
          date: event.date,
          endDate: event.endDate,
          timezone: event.timezone,
          lowestPrice,
          hasAvailability: ticketsRemaining > 0,
          ticketsRemaining,
        }
      })
    )

    // Sort by availability if requested (in-memory sort after inventory calculation)
    if (sortBy === 'availability') {
      eventsWithDetails.sort((a, b) => {
        const diff = a.ticketsRemaining - b.ticketsRemaining
        return sortOrder === 'asc' ? diff : -diff
      })
    }

    return successResponse({
      events: eventsWithDetails,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error) {
    console.error('GET /api/events error:', error instanceof Error ? error.message : String(error))
    if (error instanceof Error) {
      console.error('Stack:', error.stack)
    }
    return handleApiError(error)
  }
}
