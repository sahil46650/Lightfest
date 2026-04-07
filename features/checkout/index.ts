/**
 * Checkout Feature - Public API
 *
 * This is the main entry point for the checkout feature.
 * All external imports should come from this file.
 *
 * @example
 * ```tsx
 * import {
 *   useCheckoutFlow,
 *   useCheckoutProgress,
 *   useSavePersonalInfo,
 *   checkoutKeys,
 *   personalInfoSchema,
 * } from '@/features/checkout';
 * ```
 */

// Schema exports (Zod schemas and types)
export * from './schemas';

// API exports (mutations, keys)
export * from './api';

// Hook exports
export * from './hooks';

// Component exports
export * from './components';

// Re-export Zustand store and types for direct access
export {
  useCheckoutStore,
  CheckoutStep,
  type CartItem,
  type PersonalInfo,
  type AttendeeInfo,
  type PromoCodeData,
} from '@/store/useCheckoutStore';
