'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { EventGrid } from '@/components/events/event-grid'
import { EventSortControls } from '@/components/events/event-sort-controls'
import { useAvailableEvents, ticketTypesQueryOptions } from '@/features/events/api'
import { toEventCardProps, getEventUrl } from '@/features/events/utils'
import type { TSEvent, TicketType } from '@/lib/tscheckout'

/**
 * Calculate the minimum price from ticket types.
 * Returns null if no valid prices available.
 */
function getMinimumPrice(ticketTypes: TicketType[] | undefined): number | null {
  if (!ticketTypes || ticketTypes.length === 0) return null

  const prices = ticketTypes
    .filter((tt) => tt.onSale !== false && tt.price != null && tt.price > 0)
    .map((tt) => tt.price)

  return prices.length > 0 ? Math.min(...prices) : null
}

/**
 * Map UI sort options to TSCheckout API _orderBy param.
 * TSCheckout supports: 'start', 'title', 'ordering', 'id' (prefix with '-' for desc)
 */
function mapSortToApiParam(sortBy: string, sortOrder: string): string | undefined {
  const prefix = sortOrder === 'desc' ? '-' : ''

  switch (sortBy) {
    case 'date':
      return `${prefix}start`
    case 'title':
      return `${prefix}title`
    default:
      // 'location', 'availability' - no direct API mapping, will sort client-side
      return undefined
  }
}

/**
 * Client-side sorting for fields not supported by TSCheckout API.
 */
function sortEventsClientSide(
  events: TSEvent[],
  sortBy: string,
  sortOrder: string
): TSEvent[] {
  if (sortBy === 'date' || sortBy === 'title') {
    // Already sorted by API
    return events
  }

  const sorted = [...events]
  const multiplier = sortOrder === 'desc' ? -1 : 1

  switch (sortBy) {
    case 'location':
      sorted.sort((a, b) => {
        const locA = a.venue?.name || a.location || ''
        const locB = b.venue?.name || b.location || ''
        return locA.localeCompare(locB) * multiplier
      })
      break
    case 'availability':
      sorted.sort((a, b) => {
        const remainingA = a.inventory?.total
          ? a.inventory.total - a.inventory.sold
          : Infinity
        const remainingB = b.inventory?.total
          ? b.inventory.total - b.inventory.sold
          : Infinity
        return (remainingA - remainingB) * multiplier
      })
      break
  }

  return sorted
}

const ITEMS_PER_PAGE = 12

export function EventsClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get sort params from URL
  const sortBy = searchParams.get('sortBy') || 'date'
  const sortOrder = searchParams.get('sortOrder') || 'asc'
  const page = Number(searchParams.get('page')) || 1

  // Map to TSCheckout API params
  const apiOrderBy = mapSortToApiParam(sortBy, sortOrder)

  // Fetch events using React Query
  const { data, isLoading, isError, error } = useAvailableEvents({
    _limit: 100, // Fetch more for client-side pagination
    _include: 'sold',
    ...(apiOrderBy && { _orderBy: apiOrderBy }),
  })

  // Process events: client-side sorting if needed, then pagination
  const processedEvents = useMemo(() => {
    if (!data?.data) return { events: [] as TSEvent[], total: 0, totalPages: 0 }

    // Apply client-side sorting if API doesn't support the sort field
    const sorted = sortEventsClientSide(data.data, sortBy, sortOrder)

    // Client-side pagination
    const startIndex = (page - 1) * ITEMS_PER_PAGE
    const paginatedEvents = sorted.slice(startIndex, startIndex + ITEMS_PER_PAGE)

    return {
      events: paginatedEvents,
      total: sorted.length,
      totalPages: Math.ceil(sorted.length / ITEMS_PER_PAGE),
    }
  }, [data?.data, sortBy, sortOrder, page])

  // Fetch ticket types for all displayed events to get pricing
  const ticketTypeQueries = useQueries({
    queries: processedEvents.events.map((event) =>
      ticketTypesQueryOptions(event.id)
    ),
  })

  // Create a map of event ID to minimum price
  const eventPrices = useMemo(() => {
    const priceMap = new Map<string, number | null>()

    processedEvents.events.forEach((event, index) => {
      const query = ticketTypeQueries[index]
      if (query?.data?.data) {
        priceMap.set(event.id, getMinimumPrice(query.data.data))
      } else {
        priceMap.set(event.id, null)
      }
    })

    return priceMap
  }, [processedEvents.events, ticketTypeQueries])

  const handleSortChange = (newSortBy: string, newSortOrder: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('sortBy', newSortBy)
    params.set('sortOrder', newSortOrder)
    params.set('page', '1') // Reset to page 1 on sort change
    router.push(`?${params.toString()}`)
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', String(newPage))
    router.push(`?${params.toString()}`)
  }

  // Transform events to EventCard props with pricing
  const gridEvents = processedEvents.events.map((event, index) => {
    const query = ticketTypeQueries[index]
    const price = eventPrices.get(event.id)
    const isPriceLoading = query?.isLoading ?? false
    const props = toEventCardProps(event, {
      startingPrice: price ?? 0,
      priceLoading: isPriceLoading,
      onViewClick: () => router.push(getEventUrl(event)),
    })
    return props
  })

  // Error state
  if (isError) {
    return (
      <div className="container mx-auto px-4 pt-28 pb-12">
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold mb-4">Unable to Load Events</h1>
          <p className="text-gray-600 mb-4">
            {error?.message || 'Something went wrong. Please try again later.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 pt-28 pb-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Explore Events</h1>
        <p className="text-gray-600">
          {isLoading ? 'Loading events...' : `${processedEvents.total} events available`}
        </p>
      </div>

      <EventSortControls
        currentSort={sortBy}
        currentOrder={sortOrder}
        onSortChange={handleSortChange}
      />

      <EventGrid
        events={gridEvents}
        isLoading={isLoading}
        emptyMessage="No events available at this time. Check back soon!"
      />

      {/* Pagination Controls */}
      {!isLoading && processedEvents.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>

          <div className="flex gap-1">
            {Array.from({ length: processedEvents.totalPages }, (_, i) => i + 1).map(
              (p) => (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`px-3 py-2 rounded-lg ${
                    p === page
                      ? 'bg-blue-600 text-white'
                      : 'border hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              )
            )}
          </div>

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === processedEvents.totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
