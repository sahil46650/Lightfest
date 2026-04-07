'use client';

/**
 * TicketSelector Component
 *
 * Bridges the ticket selection modal with TSCheckout API data.
 * Uses TanStack Query to fetch real ticket types for an event.
 */

import * as React from 'react';
import { useTicketTypes } from '@/features/events';
import {
  TicketSelectionModal,
  type TicketType as ModalTicketType,
} from '@/components/checkout/ticket-selection-modal';
import { TicketSelectorSkeleton } from './TicketSelectorSkeleton';
import type { TicketType as TSCheckoutTicketType } from '@/lib/tscheckout';

// ============================================================================
// Types
// ============================================================================

export interface SelectedTicket {
  typeId: number;
  quantity: number;
  name: string;
  price: number;
}

export interface TicketSelectorProps {
  /** Event ID to fetch ticket types for */
  eventId: string | number;
  /** Controlled open state */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Callback when user proceeds with selection */
  onProceed: (tickets: SelectedTicket[], promoCode?: string) => void;
  /** Loading state from parent (e.g., during cart build) */
  isProcessing?: boolean;
}

// ============================================================================
// Transform Functions
// ============================================================================

/**
 * Transform TSCheckout TicketType to modal format.
 */
function transformToModalFormat(ticket: TSCheckoutTicketType): ModalTicketType {
  return {
    id: String(ticket.id),
    name: ticket.name,
    description: ticket.description || 'General admission ticket',
    price: ticket.price,
    available: ticket.quantityAvailable ?? 100, // Default to 100 if not specified
  };
}

/**
 * Transform modal selection back to typed structure.
 */
function transformSelection(
  selectedIds: Record<string, number>,
  ticketTypes: TSCheckoutTicketType[]
): SelectedTicket[] {
  return Object.entries(selectedIds)
    .filter(([, quantity]) => quantity > 0)
    .map(([id, quantity]) => {
      const ticket = ticketTypes.find((t) => String(t.id) === id);
      return {
        typeId: Number(id),
        quantity,
        name: ticket?.name ?? 'Unknown',
        price: ticket?.price ?? 0,
      };
    });
}

// ============================================================================
// Component
// ============================================================================

export function TicketSelector({
  eventId,
  open = false,
  onOpenChange,
  onProceed,
  isProcessing = false,
}: TicketSelectorProps) {
  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
  } = useTicketTypes(eventId);

  const ticketTypes = response?.data ?? [];

  // Transform to modal format
  const modalTicketTypes = React.useMemo(
    () => ticketTypes.map(transformToModalFormat),
    [ticketTypes]
  );

  // Handle proceed with type transformation
  const handleProceed = React.useCallback(
    (selectedIds: Record<string, number>, promoCode?: string) => {
      const selected = transformSelection(selectedIds, ticketTypes);
      onProceed(selected, promoCode);
    },
    [ticketTypes, onProceed]
  );

  // Loading state
  if (isLoading && open) {
    return (
      <TicketSelectorSkeleton
        open={open}
        onOpenChange={onOpenChange}
      />
    );
  }

  // Error state
  if (isError && open) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-lg p-6 max-w-md mx-4">
          <h2 className="text-lg font-semibold text-red-600 mb-2">
            Unable to Load Tickets
          </h2>
          <p className="text-gray-600 mb-4">
            {error?.message || 'Failed to fetch ticket information. Please try again.'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => onOpenChange?.(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={() => refetch()}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No tickets available
  if (ticketTypes.length === 0 && open) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-lg p-6 max-w-md mx-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            No Tickets Available
          </h2>
          <p className="text-gray-600 mb-4">
            There are currently no tickets available for this event.
          </p>
          <button
            onClick={() => onOpenChange?.(false)}
            className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <TicketSelectionModal
      open={open}
      onOpenChange={onOpenChange}
      ticketTypes={modalTicketTypes}
      onProceed={handleProceed}
      isLoading={isProcessing}
    />
  );
}
