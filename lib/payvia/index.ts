/**
 * PayVia Payment Gateway Integration
 *
 * This module provides integration with the PayVia embedded checkout system
 * for PCI-compliant card payment processing.
 *
 * @example Backend Usage (API Routes)
 * ```typescript
 * import { getPayViaClient, buildPaymentMethodData } from '@/lib/payvia';
 *
 * const client = getPayViaClient();
 *
 * // Process a payment using token from iframe
 * const result = await client.processPayment({
 *   amount: 25.00,
 *   orderId: 'ORD-123',
 *   customerInfo: {
 *     firstName: 'John',
 *     lastName: 'Doe',
 *     email: 'john@example.com',
 *     billingAddress: {
 *       address1: '123 Main St',
 *       city: 'Los Angeles',
 *       state: 'CA',
 *       zip: '90210',
 *       country: 'US',
 *     },
 *   },
 *   paymentMethodData: buildPaymentMethodData(
 *     tokenData.token,
 *     tokenData.form.expiry,
 *     tokenData.form.cardHolderName
 *   ),
 * });
 * ```
 *
 * @example Frontend Usage (Components)
 * ```typescript
 * import {
 *   type CheckoutConfig,
 *   type TokenCreatedData,
 *   PAYVIA_CHECKOUT_URLS,
 *   PAYVIA_ALLOWED_ORIGINS,
 * } from '@/lib/payvia';
 *
 * // Configure checkout iframe
 * const config: CheckoutConfig = {
 *   amount: 25.00,
 *   merchantId: process.env.NEXT_PUBLIC_PAYVIA_MERCHANT_ID!,
 *   email: 'customer@example.com',
 *   cardHolderName: 'John Doe',
 *   invoice: 'ORD-123',
 *   isZipCodeEnabled: true,
 *   isEmailEnabled: true,
 *   defaultPaymentMethod: 'card',
 * };
 * ```
 */

// Types
export type {
  PayViaEnvironment,
  CheckoutStyles,
  CheckoutOrderItem,
  CheckoutOrderPayload,
  CheckoutConfig,
  PostMessageType,
  PostMessageBase,
  ReadyMessage,
  InitCheckoutMessage,
  TokenData,
  TokenFormData,
  TokenCreatedData,
  TokenCreatedMessage,
  PayViaError,
  ErrorMessage,
  ResizeMessage,
  ValidationErrorMessage,
  PayViaPostMessage,
  AuthRequest,
  AuthResponse,
  BillingAddress,
  CustomerInfo,
  PaymentMethodData,
  PaymentAttributes,
  PaymentRequest,
  PaymentResponseAttributes,
  PaymentResponse,
  PayViaApiErrorMeta,
  PayViaApiErrorItem,
  PayViaApiErrorResponse,
  CachedToken,
  ProcessPaymentRequest,
  ProcessPaymentResponse,
} from './types';

// Constants
export {
  PAYVIA_CHECKOUT_URLS,
  PAYVIA_API_URLS,
  PAYVIA_ALLOWED_ORIGINS,
  PayViaApiError,
} from './types';

// Client
export {
  PayViaClient,
  createPayViaClient,
  getPayViaClient,
  parseExpirationDate,
  parseCardholderName,
  buildPaymentMethodData,
} from './client';
