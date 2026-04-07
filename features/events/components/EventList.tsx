'use client';

/**
 * EventList Component
 *
 * A "smart" container component that fetches events using TanStack Query
 * and renders them using the EventGrid presentational component.
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { EventGrid } from '@/components/events/event-grid';
import { useAvailableEvents, useUpcomingEvents, useEvents } from '../api';
import { toEventCardPropsArray, getEventUrl } from '../utils';
import type { ListEventsParams } from '@/lib/tscheckout';

export type EventListVariant = 'available' | 'upcoming' | 'custom';

export interface EventListProps {
  /**
   * Which events to fetch:
   * - 'available': Events available for online purchase
   * - 'upcoming': Upcoming events (any status)
   * - 'custom': Use provided params for custom filtering
   */
  variant?: EventListVariant;

  /**
   * Custom params for filtering events (used with 'custom' variant).
   */
  params?: ListEventsParams;

  /**
   * Maximum number of events to display.
   */
  limit?: number;

  /**
   * Message to show when no events are found.
   */
  emptyMessage?: string;

  /**
   * Additional CSS class names.
   */
  className?: string;
}

export function EventList({
  variant = 'available',
  params = {},
  limit,
  emptyMessage = 'No events found',
  className,
}: EventListProps) {
  const router = useRouter();

  // Apply limit to params if specified
  const queryParams = limit ? { ...params, _limit: limit } : params;

  // Select the appropriate query based on variant
  const availableQuery = useAvailableEvents(
    variant === 'available' ? queryParams : {}
  );
  const upcomingQuery = useUpcomingEvents(
    variant === 'upcoming' ? queryParams : {}
  );
  const customQuery = useEvents(
    variant === 'custom' ? queryParams : {}
  );

  // Get the active query based on variant
  const query =
    variant === 'available'
      ? availableQuery
      : variant === 'upcoming'
        ? upcomingQuery
        : customQuery;

  const { data, isLoading, error } = query;

  // Handle navigation when an event card is clicked
  const handleViewClick = React.useCallback(
    (eventId: string) => {
      const event = data?.data.find((e) => e.id === eventId);
      if (event) {
        router.push(getEventUrl(event));
      }
    },
    [data, router]
  );

  // Transform TSEvents to EventCardProps
  const eventCardProps = React.useMemo(() => {
    if (!data?.data) return [];
    return toEventCardPropsArray(data.data, { onViewClick: handleViewClick });
  }, [data, handleViewClick]);

  // Handle error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-red-500">Failed to load events</p>
        <p className="text-sm text-gray-500">{error.message}</p>
      </div>
    );
  }

  return (
    <EventGrid
      events={eventCardProps}
      isLoading={isLoading}
      emptyMessage={emptyMessage}
      className={className}
    />
  );
}

EventList.displayName = 'EventList';
