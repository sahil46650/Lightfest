/**
 * Events Feature - Public API
 *
 * This is the main entry point for the events feature.
 * All external imports should come from this file.
 *
 * @example
 * ```tsx
 * import {
 *   useAvailableEvents,
 *   useEvent,
 *   useTicketTypes,
 *   eventKeys,
 * } from '@/features/events';
 * ```
 */

// API exports (queries, keys)
export * from './api';

// Component exports
export * from './components';

// Utility exports
export * from './utils';

// Re-export commonly used types from TSCheckout for convenience
export type {
  TSEvent,
  TicketType,
  ListEventsParams,
  EventStatus,
  EventInventory,
  WaveTime,
  Question,
  Answer,
} from '@/lib/tscheckout';
