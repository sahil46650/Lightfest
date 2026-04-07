'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { EventCard, type EventCardProps } from './event-card'

interface EventGridProps extends React.HTMLAttributes<HTMLDivElement> {
  events: EventCardProps[]
  isLoading?: boolean
  emptyMessage?: string
}

const EventGrid = React.forwardRef<HTMLDivElement, EventGridProps>(
  ({ className, events, isLoading = false, emptyMessage = 'No events found', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'grid gap-6 sm:grid-cols-2 lg:grid-cols-3',
          className
        )}
        {...props}
      >
        {isLoading ? (
          // Loading Skeleton
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-80 animate-pulse rounded-lg bg-gray-200"
            />
          ))
        ) : events.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center gap-4 py-12">
            <p className="text-gray-500">{emptyMessage}</p>
          </div>
        ) : (
          events.map((event) => (
            <EventCard
              key={event.eventId}
              {...event}
            />
          ))
        )}
      </div>
    )
  }
)

EventGrid.displayName = 'EventGrid'

export { EventGrid }
