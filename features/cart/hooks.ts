'use client';

/**
 * Cart Feature Hooks
 *
 * High-level hooks that integrate Zustand local state with
 * TanStack Query mutations for server-side validation.
 */

import * as React from 'react';
import { useCheckoutStore } from '@/store/useCheckoutStore';
import type { CartItem } from '@/store/useCheckoutStore';
import { useBuildCartItems, type BuildCartResult } from './api';
import { createCart } from '@/lib/tscheckout';
import type { TicketType } from '@/lib/tscheckout';

// ============================================================================
// Types
// ============================================================================

export interface UseCartOptions {
  /**
   * Event ID for the cart (required for multi-event support).
   */
  eventId: string;

  /**
   * Available ticket types for this event.
   * Used to build the cart request with correct type IDs.
   */
  ticketTypes?: TicketType[];

  /**
   * Auto-validate cart with server on changes.
   * @default false
   */
  autoValidate?: boolean;

  /**
   * Debounce time for auto-validation (ms).
   * @default 500
   */
  debounceMs?: number;
}

export interface UseCartReturn {
  // State
  items: CartItem[];
  totalTickets: number;
  subtotal: number;
  discount: number;
  serviceFee: number;
  total: number;

  // Server-validated values (when available)
  validatedResult: BuildCartResult | null;
  isValidating: boolean;
  validationError: Error | null;

  // Actions
  addItem: (item: CartItem) => void;
  updateQuantity: (ticketTypeId: string, quantity: number) => void;
  removeItem: (ticketTypeId: string) => void;
  clearCart: () => void;
  validateCart: () => Promise<BuildCartResult>;
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Primary hook for managing cart state with optional server validation.
 *
 * @example
 * ```tsx
 * function TicketSelector({ eventId, ticketTypes }) {
 *   const {
 *     items,
 *     total,
 *     addItem,
 *     updateQuantity,
 *     validateCart,
 *   } = useCart({ eventId, ticketTypes });
 *
 *   const handleProceed = async () => {
 *     const validated = await validateCart();
 *     // Use validated.total for accurate pricing
 *   };
 *
 *   return (
 *     // ...
 *   );
 * }
 * ```
 */
export function useCart(options: UseCartOptions): UseCartReturn {
  const { eventId, ticketTypes = [], autoValidate = false, debounceMs = 500 } = options;

  // Zustand store state
  const store = useCheckoutStore();
  const { cart, addToCart, updateQuantity: storeUpdateQuantity, removeFromCart, reset } = store;

  // Derived values from store
  const subtotal = store.subtotal();
  const discount = store.discount();
  const serviceFee = store.serviceFee();
  const total = store.total();
  const totalTickets = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Server validation mutation
  const buildCartMutation = useBuildCartItems();
  const [validatedResult, setValidatedResult] = React.useState<BuildCartResult | null>(null);

  // Debounced validation effect
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (!autoValidate || cart.length === 0) {
      return;
    }

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce validation
    timeoutRef.current = setTimeout(() => {
      validateCartInternal().catch(console.error);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [cart, autoValidate, debounceMs]);

  // Build cart request from current state
  const buildCartRequest = React.useCallback(() => {
    const cartBuilder = createCart();

    // Add tickets based on cart items
    cart.forEach((item) => {
      const ticketType = ticketTypes.find((t) => String(t.id) === item.ticketTypeId);
      if (ticketType) {
        // Convert ticketType.id to number (v2 API returns id as string | number)
        const typeId = typeof ticketType.id === 'string' ? parseInt(ticketType.id, 10) : ticketType.id;
        cartBuilder.addTickets(typeId, item.quantity);
      }
    });

    // Add promo code if present
    const promoCode = store.promoCode;
    if (promoCode) {
      cartBuilder.promoCode(promoCode.code);
    }

    return cartBuilder.buildRequest();
  }, [cart, ticketTypes, store.promoCode]);

  // Internal validation function
  const validateCartInternal = React.useCallback(async () => {
    if (cart.length === 0) {
      setValidatedResult(null);
      return null;
    }

    const request = buildCartRequest();
    const result = await buildCartMutation.mutateAsync(request);
    setValidatedResult(result);
    return result;
  }, [cart, buildCartRequest, buildCartMutation]);

  // Public actions
  const addItem = React.useCallback(
    (item: CartItem) => {
      // Initialize booking if not already done
      if (!store.eventId || store.eventId !== eventId) {
        store.initializeBooking(`draft-${Date.now()}`, eventId);
      }
      addToCart(item);
    },
    [addToCart, eventId, store]
  );

  const updateQuantity = React.useCallback(
    (ticketTypeId: string, quantity: number) => {
      storeUpdateQuantity(ticketTypeId, quantity);
    },
    [storeUpdateQuantity]
  );

  const removeItem = React.useCallback(
    (ticketTypeId: string) => {
      removeFromCart(ticketTypeId);
    },
    [removeFromCart]
  );

  const clearCart = React.useCallback(() => {
    reset();
    setValidatedResult(null);
  }, [reset]);

  const validateCart = React.useCallback(async () => {
    const result = await validateCartInternal();
    if (!result) {
      throw new Error('Cannot validate empty cart');
    }
    return result;
  }, [validateCartInternal]);

  return {
    // State
    items: cart,
    totalTickets,
    subtotal,
    discount,
    serviceFee,
    total,

    // Server validation
    validatedResult,
    isValidating: buildCartMutation.isPending,
    validationError: buildCartMutation.error,

    // Actions
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    validateCart,
  };
}

// ============================================================================
// Convenience Hooks
// ============================================================================

/**
 * Simple hook for reading cart state without modification.
 * Useful for header cart icons, summaries, etc.
 */
export function useCartSummary() {
  const store = useCheckoutStore();

  return {
    itemCount: store.cart.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: store.subtotal(),
    total: store.total(),
    hasItems: store.cart.length > 0,
    eventId: store.eventId,
  };
}

/**
 * Hook for managing promo codes.
 */
export function usePromoCode() {
  const store = useCheckoutStore();

  return {
    promoCode: store.promoCode,
    setPromoCode: store.setPromoCode,
    clearPromoCode: () => store.setPromoCode(null),
    hasPromoCode: !!store.promoCode,
    discount: store.discount(),
  };
}
