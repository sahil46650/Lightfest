/**
 * Checkout Feature Query Keys
 *
 * Query key factory for checkout operations.
 * Used for cache management and invalidation.
 */

export const checkoutKeys = {
  all: ['checkout'] as const,

  // Draft booking state
  draft: () => [...checkoutKeys.all, 'draft'] as const,
  draftById: (bookingId: string) => [...checkoutKeys.draft(), bookingId] as const,

  // Personal info
  personalInfo: () => [...checkoutKeys.all, 'personalInfo'] as const,
  personalInfoById: (bookingId: string) =>
    [...checkoutKeys.personalInfo(), bookingId] as const,

  // Attendees
  attendees: () => [...checkoutKeys.all, 'attendees'] as const,
  attendeesById: (bookingId: string) => [...checkoutKeys.attendees(), bookingId] as const,

  // Payment
  payment: () => [...checkoutKeys.all, 'payment'] as const,
  paymentById: (bookingId: string) => [...checkoutKeys.payment(), bookingId] as const,

  // Confirmation
  confirmation: () => [...checkoutKeys.all, 'confirmation'] as const,
  confirmationById: (bookingId: string) =>
    [...checkoutKeys.confirmation(), bookingId] as const,
} as const;

export const bookingKeys = {
  all: ['bookings'] as const,

  // Booking list
  lists: () => [...bookingKeys.all, 'list'] as const,
  list: (params: Record<string, unknown> = {}) => [...bookingKeys.lists(), params] as const,

  // Single booking details
  details: () => [...bookingKeys.all, 'detail'] as const,
  detail: (bookingId: string) => [...bookingKeys.details(), bookingId] as const,

  // Booking confirmation
  confirmation: (confirmationNumber: string) =>
    [...bookingKeys.all, 'confirmation', confirmationNumber] as const,
} as const;
