'use client';

/**
 * Checkout Feature Hooks
 *
 * Convenience hooks for checkout state management using Zustand store.
 */

import * as React from 'react';
import { useCheckoutStore, CheckoutStep } from '@/store/useCheckoutStore';
import type { AttendeeInfo } from '@/store/useCheckoutStore';

// ============================================================================
// Step Navigation Helpers
// ============================================================================

const STEP_ORDER: CheckoutStep[] = [
  CheckoutStep.TICKET_SELECTION,
  CheckoutStep.PERSONAL_INFO,
  CheckoutStep.ATTENDEE_INFO,
  CheckoutStep.PAYMENT,
];

function getStepIndex(step: CheckoutStep): number {
  return STEP_ORDER.indexOf(step);
}

// ============================================================================
// Convenience Hooks
// ============================================================================

/**
 * Simple hook for reading checkout step progress.
 * Useful for progress indicators and step navigation.
 */
export function useCheckoutProgress() {
  const store = useCheckoutStore();

  return {
    currentStep: store.currentStep,
    stepIndex: getStepIndex(store.currentStep),
    totalSteps: STEP_ORDER.length,
    steps: STEP_ORDER,
    hasCart: store.cart.length > 0,
    hasPersonalInfo: !!store.personalInfo?.email,
    hasAttendees: Object.keys(store.attendees).length > 0,
  };
}

/**
 * Hook for managing a single attendee form.
 */
export function useAttendeeForm(ticketKey: string) {
  const store = useCheckoutStore();
  const attendee = store.attendees[ticketKey];

  const setAttendee = React.useCallback(
    (info: AttendeeInfo) => {
      store.updateAttendee(ticketKey, info);
    },
    [store, ticketKey]
  );

  const clearAttendee = React.useCallback(() => {
    // Create a new object without this key
    // Note: Would need a clearAttendee action in store for full implementation
    console.warn('clearAttendee not yet implemented in store');
  }, [ticketKey]);

  return {
    attendee,
    setAttendee,
    clearAttendee,
    hasData: !!attendee?.name,
  };
}
