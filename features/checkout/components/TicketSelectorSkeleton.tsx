'use client';

/**
 * Loading skeleton for TicketSelector.
 * Displays while ticket types are being fetched.
 */

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface TicketSelectorSkeletonProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TicketSelectorSkeleton({
  open = false,
  onOpenChange,
}: TicketSelectorSkeletonProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] rounded-lg bg-white p-6 shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-2xl font-bold text-gray-900">
              Select Your Tickets
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Loading Content */}
          <div className="mt-6 space-y-6">
            {/* Ticket type skeletons */}
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-4 border-b border-gray-200 pb-4 last:border-b-0"
              >
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-9 w-24" />
                </div>
              </div>
            ))}

            {/* Promo code skeleton */}
            <div className="mt-6 space-y-3 border-t border-gray-200 pt-4">
              <Skeleton className="h-5 w-36" />
              <div className="flex gap-2">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-20" />
              </div>
            </div>
          </div>

          {/* Summary skeleton */}
          <div className="mt-6 border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 flex-1" />
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
