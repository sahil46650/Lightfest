/**
 * Checkout Feature - Zod Schemas
 *
 * Re-exports validation schemas from lib/validations
 * and adds checkout-specific composite schemas.
 */

import { z } from 'zod';

// Re-export base schemas from lib/validations
export {
  personalInfoSchema,
  attendeeInfoSchema,
  promoCodeSchema,
  type PersonalInfo,
  type AttendeeInfo,
  type PromoCode,
} from '@/lib/validations/checkout';

// ============================================================================
// API Request Schemas
// ============================================================================

/**
 * Schema for saving personal info to a draft booking.
 */
export const savePersonalInfoRequestSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  email: z.string().email('Valid email required'),
  firstName: z.string().min(1, 'First name required').max(50),
  lastName: z.string().min(1, 'Last name required').max(50),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Valid phone required'),
  countryCode: z.string().default('+1'),
  createAccount: z.boolean().default(false),
  // Allow empty string (form default) OR valid password (8+ chars)
  // .optional() handles undefined, union handles '' vs valid password
  password: z.union([
    z.string().min(8, 'Password must be 8+ characters'),
    z.literal('')
  ]).optional(),
}).refine(
  (data) => !data.createAccount || data.password,
  { message: 'Password required when creating account', path: ['password'] }
);

export type SavePersonalInfoRequest = z.infer<typeof savePersonalInfoRequestSchema>;

/**
 * Schema for saving attendee info.
 */
export const saveAttendeesRequestSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  attendees: z.record(
    z.string(),
    z.object({
      name: z.string().min(1, 'Name required').max(100),
      email: z.string().email('Valid email required'),
      addOns: z
        .array(
          z.object({
            name: z.string(),
            price: z.number(),
          })
        )
        .optional(),
    })
  ),
});

export type SaveAttendeesRequest = z.infer<typeof saveAttendeesRequestSchema>;

/**
 * Schema for updating a single attendee.
 */
export const updateAttendeeRequestSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  ticketKey: z.string().min(1, 'Ticket key is required'),
  attendee: z.object({
    name: z.string().min(1, 'Name required').max(100),
    email: z.string().email('Valid email required'),
    addOns: z
      .array(
        z.object({
          name: z.string(),
          price: z.number(),
        })
      )
      .optional(),
  }),
});

export type UpdateAttendeeRequest = z.infer<typeof updateAttendeeRequestSchema>;

// ============================================================================
// Payment Schema
// ============================================================================

/**
 * Mock payment schema (for development).
 * Replace with Stripe Elements integration in production.
 */
export const paymentInfoSchema = z.object({
  cardNumber: z
    .string()
    .regex(/^\d{16}$/, 'Card number must be 16 digits')
    .optional(),
  expiryMonth: z.string().regex(/^(0[1-9]|1[0-2])$/, 'Invalid month').optional(),
  expiryYear: z.string().regex(/^\d{2}$/, 'Invalid year').optional(),
  cvv: z.string().regex(/^\d{3,4}$/, 'Invalid CVV').optional(),
  billingAddress: z
    .object({
      line1: z.string().min(1, 'Address required'),
      line2: z.string().optional(),
      city: z.string().min(1, 'City required'),
      state: z.string().min(1, 'State required'),
      postalCode: z.string().min(1, 'Postal code required'),
      country: z.string().default('US'),
    })
    .optional(),
  // For mock payments, just accept terms
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
});

export type PaymentInfo = z.infer<typeof paymentInfoSchema>;

/**
 * Process payment request schema.
 */
export const processPaymentRequestSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  paymentMethod: z.enum(['mock', 'stripe']).default('mock'),
  paymentInfo: paymentInfoSchema,
});

export type ProcessPaymentRequest = z.infer<typeof processPaymentRequestSchema>;
