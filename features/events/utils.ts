/**
 * Event Feature Utilities
 *
 * Helper functions for transforming TSCheckout data to component props.
 */

import type { TSEvent } from '@/lib/tscheckout';
import type { EventCardProps } from '@/components/events/event-card';

/**
 * Format a Unix timestamp to a readable date string.
 *
 * @param timestamp - Unix timestamp in seconds (TSCheckout uses string timestamps)
 * @param options - Intl.DateTimeFormat options
 */
export function formatEventDate(
  timestamp: string | number,
  options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }
): string {
  // TSCheckout uses Unix timestamps in seconds (as strings)
  const ms = Number(timestamp) * 1000;
  const date = new Date(ms);

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Date TBD';
  }

  return new Intl.DateTimeFormat('en-US', options).format(date);
}

/**
 * Format event location from venue data.
 */
export function formatEventLocation(event: TSEvent): string {
  if (event.venue?.name) {
    const city = event.venue.address?.city;
    return city ? `${event.venue.name}, ${city}` : event.venue.name;
  }

  if (event.location) {
    return event.location;
  }

  // Fallback to event title when no location data is available
  return event.title || 'TBD';
}

/**
 * Check if an event is sold out based on inventory data.
 */
export function isEventSoldOut(event: TSEvent): boolean {
  if (!event.inventory) return false;

  const { sold, total } = event.inventory;
  // If total is null, unlimited capacity
  if (total === null) return false;

  return sold >= total;
}

/**
 * Get the starting (minimum) price for an event.
 * Returns 0 if no ticket types are available yet.
 * Note: This is a placeholder - real implementation would fetch ticket types.
 */
export function getEventStartingPrice(event: TSEvent): number {
  // TSCheckout events don't include ticket pricing directly
  // This would typically come from a separate ticket types query
  // For now, return a placeholder that will be replaced when ticket types are loaded
  return 0;
}

/**
 * Transform a TSEvent to EventCardProps for the presentational component.
 *
 * @param event - TSCheckout event data
 * @param options - Additional options for the transformation
 */
export function toEventCardProps(
  event: TSEvent,
  options: {
    startingPrice?: number;
    priceLoading?: boolean;
    onViewClick?: () => void;
  } = {}
): EventCardProps {
  return {
    eventId: event.id,
    title: event.title,
    date: formatEventDate(event.start),
    location: formatEventLocation(event),
    imageUrl: event.largePic || event.smallPic,
    price: options.startingPrice ?? 0,
    priceLoading: options.priceLoading ?? false,
    isSoldOut: isEventSoldOut(event),
    onViewClick: options.onViewClick,
  };
}

/**
 * Transform an array of TSEvents to EventCardProps.
 */
export function toEventCardPropsArray(
  events: TSEvent[],
  options: {
    onViewClick?: (eventId: string) => void;
  } = {}
): EventCardProps[] {
  return events.map((event) =>
    toEventCardProps(event, {
      onViewClick: options.onViewClick
        ? () => options.onViewClick!(event.id)
        : undefined,
    })
  );
}

/**
 * Generate an event URL using the event ID.
 * The TSCheckout API requires numeric IDs for event lookups.
 */
export function getEventUrl(event: TSEvent): string {
  return `/events/${event.id}`;
}
