'use client'

import * as React from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EventLocation {
  id: string
  name: string
  city: string
  date: string
  imageUrl: string
  ticketsAvailable: number
}

interface EventSliderProps extends React.HTMLAttributes<HTMLElement> {
  heading?: string
  subheading?: string
  events?: EventLocation[]
}

const defaultEvents: EventLocation[] = [
  {
    id: '1',
    name: 'Austin Lights',
    city: 'Austin, TX',
    date: 'Nov 12, 2024',
    imageUrl: 'https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=600&q=80',
    ticketsAvailable: 234,
  },
  {
    id: '2',
    name: 'London Glow',
    city: 'London, UK',
    date: 'Dec 05, 2024',
    imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=80',
    ticketsAvailable: 156,
  },
  {
    id: '3',
    name: 'Tokyo Dreams',
    city: 'Tokyo, JP',
    date: 'Jan 15, 2025',
    imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80',
    ticketsAvailable: 0,
  },
  {
    id: '4',
    name: 'NYC Brilliance',
    city: 'New York, NY',
    date: 'Feb 20, 2025',
    imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&q=80',
    ticketsAvailable: 0,
  },
]

function getBadgeInfo(ticketsAvailable: number): { text: string; style: string } | null {
  if (ticketsAvailable > 0 && ticketsAvailable < 100) {
    return {
      text: 'SELLING FAST',
      style: 'bg-white/20 backdrop-blur-md border border-white/20',
    }
  }
  if (ticketsAvailable >= 100) {
    return {
      text: 'NEW DATE ADDED',
      style: 'bg-primary shadow-glow',
    }
  }
  return null
}

const EventSlider = React.forwardRef<HTMLElement, EventSliderProps>(
  (
    {
      className,
      heading = 'FIND YOUR LIGHT',
      subheading = 'Upcoming events near you',
      events = defaultEvents,
      ...props
    },
    ref
  ) => {
    const scrollContainerRef = React.useRef<HTMLDivElement>(null)

    const scroll = (direction: 'left' | 'right') => {
      if (scrollContainerRef.current) {
        const scrollAmount = 380
        scrollContainerRef.current.scrollBy({
          left: direction === 'left' ? -scrollAmount : scrollAmount,
          behavior: 'smooth',
        })
      }
    }

    return (
      <section
        ref={ref}
        className={cn('overflow-hidden bg-white py-20', className)}
        {...props}
      >
        {/* Header with Navigation */}
        <div className="mx-auto mb-12 flex max-w-[1400px] items-end justify-between px-6 md:px-12">
          <div>
            <h2 className="mb-2 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
              {heading}
            </h2>
            <p className="font-medium text-slate-500">{subheading}</p>
          </div>

          {/* Navigation Arrows */}
          <div className="hidden gap-2 md:flex">
            <button
              onClick={() => scroll('left')}
              className="flex size-12 items-center justify-center rounded-full border border-slate-200 transition-colors hover:bg-slate-50"
              aria-label="Scroll left"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="flex size-12 items-center justify-center rounded-full border border-slate-200 transition-colors hover:bg-slate-50"
              aria-label="Scroll right"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>

        {/* Scrolling Container */}
        <div
          ref={scrollContainerRef}
          className="flex snap-x snap-mandatory gap-6 overflow-x-auto px-6 pb-12 md:px-12"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {events.map((event) => {
            const badge = getBadgeInfo(event.ticketsAvailable)
            const isSoldOut = event.ticketsAvailable === 0

            return (
              <div
                key={event.id}
                className="group w-[300px] shrink-0 cursor-pointer snap-center md:w-[360px]"
              >
                {/* Card Image */}
                <Link href={`/events/${event.id}`}>
                  <div className="relative mb-6 aspect-[3/4] overflow-hidden rounded-[2rem]">
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                      style={{ backgroundImage: `url('${event.imageUrl}')` }}
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent opacity-60 transition-opacity group-hover:opacity-80" />

                    {/* Badge */}
                    {badge && (
                      <div
                        className={cn(
                          'absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-bold text-white',
                          badge.style
                        )}
                      >
                        {badge.text}
                      </div>
                    )}

                    {/* Content */}
                    <div className="absolute bottom-6 left-6 text-white">
                      <p className="mb-1 text-lg font-medium">{event.date}</p>
                      <h3 className="text-3xl font-black">{event.city}</h3>
                    </div>
                  </div>
                </Link>

                {/* Button Below Card */}
                <Link href={`/events/${event.id}`} className="block">
                  <button className="w-full rounded-full border-2 border-slate-200 py-4 font-bold text-slate-900 transition-all group-hover:border-primary group-hover:bg-primary group-hover:text-white">
                    Get Tickets
                  </button>
                </Link>
              </div>
            )
          })}
        </div>
      </section>
    )
  }
)

EventSlider.displayName = 'EventSlider'

export { EventSlider }
