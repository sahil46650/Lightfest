'use client';

/**
 * TanStack Query Hooks for Events Feature
 *
 * Provides data fetching hooks for events and ticket types.
 * Uses the TSCheckout API client under the hood.
 */

import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import type { UseQueryOptions } from '@tanstack/react-query';
import {
  getTSCheckoutClient,
  type TSEvent,
  type TicketType,
  type ListEventsParams,
  type ListResponse,
  type SingleResponse,
} from '@/lib/tscheckout';
import { queryRetryOptions } from '@/lib/query';
import { eventKeys, ticketTypeKeys } from './keys';

// ============================================================================
// Query Options Factories
// ============================================================================

/**
 * Query options for fetching available events (online purchasable).
 * Default cache time: 10 minutes (events don't change frequently).
 */
export function availableEventsQueryOptions(
  params: Omit<ListEventsParams, 'status'> = {}
) {
  return {
    queryKey: eventKeys.availableWithParams(params),
    queryFn: async () => {
      const client = getTSCheckoutClient();
      return client.getAvailableEvents(params);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    ...queryRetryOptions,
  } satisfies UseQueryOptions<ListResponse<TSEvent>, Error>;
}

/**
 * Query options for fetching upcoming events.
 * Default cache time: 10 minutes.
 */
export function upcomingEventsQueryOptions(
  params: Omit<ListEventsParams, 'status'> = {}
) {
  return {
    queryKey: eventKeys.upcomingWithParams(params),
    queryFn: async () => {
      const client = getTSCheckoutClient();
      return client.getUpcomingEvents(params);
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    ...queryRetryOptions,
  } satisfies UseQueryOptions<ListResponse<TSEvent>, Error>;
}

/**
 * Query options for fetching events with custom filters.
 */
export function eventsQueryOptions(params: ListEventsParams = {}) {
  return {
    queryKey: eventKeys.list(params),
    queryFn: async () => {
      const client = getTSCheckoutClient();
      return client.listEvents(params);
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    ...queryRetryOptions,
  } satisfies UseQueryOptions<ListResponse<TSEvent>, Error>;
}

/**
 * Query options for fetching a single event by ID.
 * Default cache time: 5 minutes (detail views might need fresher data).
 */
export function eventDetailQueryOptions(eventId: string | number) {
  return {
    queryKey: eventKeys.detail(eventId),
    queryFn: async () => {
      const client = getTSCheckoutClient();
      return client.getEvent(eventId);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!eventId,
    ...queryRetryOptions,
  } satisfies UseQueryOptions<SingleResponse<TSEvent>, Error>;
}

/**
 * Query options for searching events.
 */
export function searchEventsQueryOptions(
  query: string,
  params: Omit<ListEventsParams, 'search'> = {}
) {
  return {
    queryKey: eventKeys.search(query, params),
    queryFn: async () => {
      const client = getTSCheckoutClient();
      return client.searchEvents(query, params);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: query.length >= 2, // Only search with 2+ characters
    ...queryRetryOptions,
  } satisfies UseQueryOptions<ListResponse<TSEvent>, Error>;
}

/**
 * Query options for fetching ticket types for an event.
 * Short cache time: 30 seconds (inventory can change quickly).
 */
export function ticketTypesQueryOptions(eventId: string | number) {
  return {
    queryKey: ticketTypeKeys.byEvent(eventId),
    queryFn: async () => {
      const client = getTSCheckoutClient();
      return client.getTicketTypes(eventId);
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 60 * 1000, // 1 minute
    enabled: !!eventId,
    ...queryRetryOptions,
  } satisfies UseQueryOptions<ListResponse<TicketType>, Error>;
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch available events (online purchasable).
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useAvailableEvents();
 * const events = data?.data ?? [];
 * ```
 */
export function useAvailableEvents(
  params: Omit<ListEventsParams, 'status'> = {}
) {
  return useQuery<ListResponse<TSEvent>, Error>(availableEventsQueryOptions(params));
}

/**
 * Fetch upcoming events.
 */
export function useUpcomingEvents(
  params: Omit<ListEventsParams, 'status'> = {}
) {
  return useQuery<ListResponse<TSEvent>, Error>(upcomingEventsQueryOptions(params));
}

/**
 * Fetch events with custom filters.
 */
export function useEvents(params: ListEventsParams = {}) {
  return useQuery<ListResponse<TSEvent>, Error>(eventsQueryOptions(params));
}

/**
 * Fetch a single event by ID.
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useEvent(eventId);
 * const event = data?.data;
 * ```
 */
export function useEvent(eventId: string | number) {
  return useQuery<SingleResponse<TSEvent>, Error>(eventDetailQueryOptions(eventId));
}

/**
 * Search events by text query.
 * Query is only enabled when search string is 2+ characters.
 */
export function useSearchEvents(
  query: string,
  params: Omit<ListEventsParams, 'search'> = {}
) {
  return useQuery<ListResponse<TSEvent>, Error>(searchEventsQueryOptions(query, params));
}

/**
 * Fetch ticket types for an event.
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useTicketTypes(eventId);
 * const ticketTypes = data?.data ?? [];
 * ```
 */
export function useTicketTypes(eventId: string | number) {
  return useQuery<ListResponse<TicketType>, Error>(ticketTypesQueryOptions(eventId));
}

// ============================================================================
// Suspense Query Hooks
// ============================================================================

/**
 * Suspense version of useAvailableEvents.
 * Use with React Suspense for loading states.
 */
export function useAvailableEventsSuspense(
  params: Omit<ListEventsParams, 'status'> = {}
) {
  return useSuspenseQuery(availableEventsQueryOptions(params));
}

/**
 * Suspense version of useEvent.
 */
export function useEventSuspense(eventId: string | number) {
  return useSuspenseQuery(eventDetailQueryOptions(eventId));
}

/**
 * Suspense version of useTicketTypes.
 */
export function useTicketTypesSuspense(eventId: string | number) {
  return useSuspenseQuery(ticketTypesQueryOptions(eventId));
}
