'use client';

/**
 * Featured Events Section
 *
 * Client component that fetches events from TSCheckout API using TanStack Query
 * and renders them using the EventSlider component.
 */

import * as React from 'react';
import { EventSlider } from '@/components/landing/event-slider';
import { useAvailableEvents } from '../api';
import { formatEventDate, formatEventLocation, getEventUrl } from '../utils';
import { Skeleton } from '@/components/ui/skeleton';

// ============================================================================
// Types
// ============================================================================

interface EventSliderEvent {
  id: string;
  name: string;
  city: string;
  date: string;
  imageUrl: string;
  ticketsAvailable: number;
  slug: string;
}

export interface FeaturedEventsSectionProps {
  /**
   * Heading text for the section.
   */
  heading?: string;

  /**
   * Subheading text.
   */
  subheading?: string;

  /**
   * Maximum number of events to display.
   */
  limit?: number;

  /**
   * Fallback events to show when API is unavailable or loading.
   */
  fallbackEvents?: EventSliderEvent[];
}

// ============================================================================
// Fallback Data
// ============================================================================

const defaultFallbackEvents: EventSliderEvent[] = [
  {
    id: '1',
    slug: 'austin-lantern-fest-2026',
    name: 'Austin Lantern Festival',
    date: 'March 15, 2026',
    city: 'Austin, TX',
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
    ticketsAvailable: 250,
  },
  {
    id: '2',
    slug: 'denver-lights-2026',
    name: 'Denver Lights Experience',
    date: 'April 5, 2026',
    city: 'Denver, CO',
    imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80',
    ticketsAvailable: 180,
  },
  {
    id: '3',
    slug: 'phoenix-glow-2026',
    name: 'Phoenix Desert Glow',
    date: 'April 20, 2026',
    city: 'Phoenix, AZ',
    imageUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80',
    ticketsAvailable: 320,
  },
  {
    id: '4',
    slug: 'san-diego-illumination-2026',
    name: 'San Diego Illumination',
    date: 'May 10, 2026',
    city: 'San Diego, CA',
    imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80',
    ticketsAvailable: 95,
  },
];

// ============================================================================
// Loading Skeleton
// ============================================================================

function EventSliderSkeleton() {
  return (
    <section className="overflow-hidden bg-white py-20">
      <div className="mx-auto mb-12 max-w-[1400px] px-6 md:px-12">
        <Skeleton className="mb-2 h-12 w-64" />
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="flex gap-6 px-6 md:px-12">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="w-[300px] shrink-0 md:w-[360px]">
            <Skeleton className="mb-6 aspect-[3/4] rounded-[2rem]" />
            <Skeleton className="h-14 w-full rounded-full" />
          </div>
        ))}
      </div>
    </section>
  );
}

// ============================================================================
// Component
// ============================================================================

/**
 * Fetches and displays featured events using TanStack Query.
 *
 * Falls back to static data when the API is unavailable or during loading.
 *
 * @example
 * ```tsx
 * <FeaturedEventsSection
 *   heading="Upcoming Events"
 *   subheading="Find a Festival Lights experience near you"
 *   limit={6}
 * />
 * ```
 */
export function FeaturedEventsSection({
  heading = 'Upcoming Events',
  subheading = 'Find a Festival Lights experience near you',
  limit = 6,
  fallbackEvents = defaultFallbackEvents,
}: FeaturedEventsSectionProps) {
  const { data, isLoading, isError } = useAvailableEvents({
    _limit: limit,
    _include: 'sold',
  });

  // Transform TSCheckout events to EventSlider format, or use fallback
  // NOTE: useMemo must be called before any conditional returns (Rules of Hooks)
  const events: EventSliderEvent[] = React.useMemo(() => {
    // Use fallback if loading, error, or no data
    if (isLoading || isError || !data?.data?.length) {
      return fallbackEvents;
    }

    return data.data.slice(0, limit).map((event) => {
      // Calculate tickets available from inventory
      const ticketsAvailable = event.inventory
        ? event.inventory.total === null
          ? 999 // Unlimited capacity
          : Math.max(0, event.inventory.total - event.inventory.sold)
        : 0;

      return {
        id: String(event.id),
        name: event.title,
        city: formatEventLocation(event),
        date: formatEventDate(event.start),
        imageUrl:
          event.largePic ||
          event.smallPic ||
          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
        ticketsAvailable,
        slug: event.sefUrl || event.id,
      };
    });
  }, [data, isLoading, isError, fallbackEvents, limit]);

  // Show loading skeleton
  if (isLoading) {
    return <EventSliderSkeleton />;
  }

  return (
    <EventSlider heading={heading} subheading={subheading} events={events} />
  );
}
