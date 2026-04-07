'use client';

/**
 * TanStack Query Mutations for Cart Feature
 *
 * Provides mutations for cart operations against the TSCheckout API (v1).
 * Cart state is managed client-side with Zustand.
 * Use describeOrder() to validate and get server-calculated pricing.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationOptions } from '@tanstack/react-query';
import {
  getTSCheckoutClient,
  type ProcessCartRequest,
  type DescribeOrderResponse,
} from '@/lib/tscheckout';
import { mutationRetryOptions } from '@/lib/query';
import { cartKeys } from './keys';
import { eventKeys } from '@/features/events';

// ============================================================================
// Types
// ============================================================================

/**
 * Result from cart pricing calculation (v1 API)
 */
export interface BuildCartResult {
  /** Base ticket prices (cartTotal from v1 API) */
  subtotal: number;
  /** Service fee */
  serviceFee: number;
  /** Processing fee */
  processingFee: number;
  /** Total discounts */
  discounts: number;
  /** Final total (orderTotal from v1 API) */
  total: number;
  /** Order ID if staged with detachPaymentMethod */
  orderId?: number;
}

// ============================================================================
// Mutation Options Factories
// ============================================================================

/**
 * Mutation options for describing/validating cart items.
 * Uses the v1 /orders/describe endpoint to get server-calculated pricing.
 * Includes retry logic for network failures.
 */
export function buildCartItemsMutationOptions() {
  return {
    mutationFn: async (data: ProcessCartRequest) => {
      const client = getTSCheckoutClient();
      const response = await client.describeOrder(data);
      return transformDescribeResponse(response);
    },
    ...mutationRetryOptions,
  } satisfies UseMutationOptions<BuildCartResult, Error, ProcessCartRequest>;
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Build/describe cart - validates selections and calculates pricing.
 * Use this when the user modifies their cart to get server-validated pricing.
 * Uses v1 /orders/describe endpoint.
 *
 * @example
 * ```tsx
 * const buildCart = useBuildCartItems();
 *
 * const handleValidate = async () => {
 *   const result = await buildCart.mutateAsync({
 *     includeFees: 1,
 *     tickets: [{ ticketTypeId: 12345 }],  // v1 API uses ticketTypeId
 *   });
 *   console.log('Total:', result.total);
 * };
 * ```
 */
export function useBuildCartItems(
  options?: Omit<
    UseMutationOptions<BuildCartResult, Error, ProcessCartRequest>,
    'mutationFn'
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    ...buildCartItemsMutationOptions(),
    ...options,
    onSuccess: (...args) => {
      const [data] = args;
      // Cache the cart result for potential reuse
      queryClient.setQueryData(cartKeys.items(), data);
      options?.onSuccess?.(...args);
    },
  });
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Transform v1 /orders/describe response to BuildCartResult.
 * Maps v1 API field names to our internal format.
 */
function transformDescribeResponse(response: DescribeOrderResponse): BuildCartResult {
  const data = response.data || {};

  return {
    subtotal: data.cartTotal ?? 0,
    serviceFee: data.serviceFee ?? 0,
    processingFee: data.processingFee ?? 0,
    discounts: data.discountTotal ?? 0,
    total: data.orderTotal ?? 0,
    orderId: data.orderId,
  };
}

// NOTE: Cart state is managed client-side using Zustand store.
// Use describeOrder() (via useBuildCartItems) to preview cart with fees calculated.
