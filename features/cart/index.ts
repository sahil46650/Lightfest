/**
 * Cart Feature - Public API
 *
 * This is the main entry point for the cart feature.
 * All external imports should come from this file.
 *
 * @example
 * ```tsx
 * import {
 *   useCart,
 *   useCartSummary,
 *   usePromoCode,
 *   useBuildCartItems,
 *   cartKeys,
 * } from '@/features/cart';
 * ```
 */

// API exports (mutations, keys)
export * from './api';

// Hook exports
export * from './hooks';

// Re-export Zustand store and types for direct access
export {
  useCheckoutStore,
  CheckoutStep,
  type CartItem,
  type PersonalInfo,
  type AttendeeInfo,
  type PromoCodeData,
} from '@/store/useCheckoutStore';

// Re-export cart builder utilities from TSCheckout
export {
  createCart,
  createTicket,
  quickCart,
  CartBuilder,
  TicketBuilder,
  type SimpleTicketInput,
} from '@/lib/tscheckout';

// Re-export commonly used cart types from TSCheckout
export type {
  ProcessCartRequest,
  CartLineItem,
  CartSummary,
  BasicInfo,
  CreateOrderTicket,
  PaymentMethod,
  DescribeOrderResponse,
} from '@/lib/tscheckout';
