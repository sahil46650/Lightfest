/**
 * Query Key Factory for Events Feature
 *
 * Centralizes all query keys for consistent cache management.
 * Following the factory pattern recommended by TanStack Query.
 *
 * @see https://tkdodo.eu/blog/effective-react-query-keys
 */

import type { ListEventsParams } from '@/lib/tscheckout';

export const eventKeys = {
  // Base key for all event-related queries
  all: ['events'] as const,

  // List queries with filters
  lists: () => [...eventKeys.all, 'list'] as const,
  list: (params: ListEventsParams = {}) =>
    [...eventKeys.lists(), params] as const,

  // Available events (online purchasable)
  available: () => [...eventKeys.lists(), 'available'] as const,
  availableWithParams: (params: Omit<ListEventsParams, 'status'> = {}) =>
    [...eventKeys.available(), params] as const,

  // Upcoming events
  upcoming: () => [...eventKeys.lists(), 'upcoming'] as const,
  upcomingWithParams: (params: Omit<ListEventsParams, 'status'> = {}) =>
    [...eventKeys.upcoming(), params] as const,

  // Single event detail
  details: () => [...eventKeys.all, 'detail'] as const,
  detail: (eventId: string | number) =>
    [...eventKeys.details(), String(eventId)] as const,

  // Search queries
  search: (query: string, params: Omit<ListEventsParams, 'search'> = {}) =>
    [...eventKeys.lists(), 'search', query, params] as const,
};

export const ticketTypeKeys = {
  // Base key for all ticket type queries
  all: ['ticketTypes'] as const,

  // Ticket types by event
  byEvent: (eventId: string | number) =>
    [...ticketTypeKeys.all, 'event', String(eventId)] as const,
};
