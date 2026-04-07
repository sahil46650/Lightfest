/**
 * Cart Feature Query Keys
 *
 * Query key factory for cart operations.
 * Used for cache management and invalidation.
 */

export const cartKeys = {
  all: ['cart'] as const,

  // Cart validation/pricing - keyed by a hash of the cart contents
  items: () => [...cartKeys.all, 'items'] as const,
  itemsWithParams: (eventId: string, ticketSelections: Record<string, number>) =>
    [...cartKeys.items(), eventId, ticketSelections] as const,

  // Cart summary after validation
  summary: () => [...cartKeys.all, 'summary'] as const,
  summaryForEvent: (eventId: string) => [...cartKeys.summary(), eventId] as const,

  // Promo code validation
  promo: () => [...cartKeys.all, 'promo'] as const,
  promoValidation: (code: string, eventId: string) =>
    [...cartKeys.promo(), code, eventId] as const,

  // NOTE: Shopping cart keys removed - v2 API does not have /shopping-cart/* endpoints.
  // Cart state is managed client-side via Zustand store.
} as const;

export const orderKeys = {
  all: ['orders'] as const,

  // Order list
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (params: Record<string, unknown> = {}) => [...orderKeys.lists(), params] as const,

  // Single order details
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (orderId: string | number) => [...orderKeys.details(), String(orderId)] as const,

  // Rebuild cart from order
  rebuild: (orderId: number) => [...orderKeys.all, 'rebuild', orderId] as const,
} as const;
