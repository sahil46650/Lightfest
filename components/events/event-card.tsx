'use client'

import * as React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Calendar, MapPin } from 'lucide-react'

export interface EventCardProps extends React.HTMLAttributes<HTMLDivElement> {
  eventId: string
  title: string
  date: string
  location: string
  imageUrl?: string
  price: number
  priceLoading?: boolean
  isSoldOut?: boolean
  onViewClick?: () => void
}

const EventCard = React.forwardRef<HTMLDivElement, EventCardProps>(
  (
    {
      className,
      eventId,
      title,
      date,
      location,
      imageUrl,
      price,
      priceLoading = false,
      isSoldOut = false,
      onViewClick,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'group flex flex-col overflow-hidden rounded-lg bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105',
          className
        )}
        {...props}
      >
        {/* Image Container */}
        <div className="relative h-48 w-full overflow-hidden bg-gray-200">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <span className="text-sm text-gray-400">No image</span>
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          {/* Sold Out Badge */}
          {isSoldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <span className="text-lg font-semibold text-white">Sold Out</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col justify-between p-4">
          <div className="space-y-3">
            {/* Title */}
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
              {title}
            </h3>

            {/* Event Details */}
            <div className="space-y-2">
              {/* Date */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4 flex-shrink-0 text-primary" />
                <span>{date}</span>
              </div>

              {/* Location */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 flex-shrink-0 text-primary" />
                <span className="line-clamp-1">{location}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-end justify-between gap-3 border-t border-gray-100 pt-4">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">From</span>
              {priceLoading ? (
                <div className="h-7 w-16 animate-pulse rounded bg-gray-200" />
              ) : (
                <span className="text-lg font-bold text-primary">
                  ${price.toFixed(2)}
                </span>
              )}
            </div>
            <Button
              onClick={onViewClick}
              disabled={isSoldOut}
              className="transition-all duration-300"
            >
              View Event
            </Button>
          </div>
        </div>
      </div>
    )
  }
)

EventCard.displayName = 'EventCard'

export { EventCard }
