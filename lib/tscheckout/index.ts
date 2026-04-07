/**
 * TSCheckout API Integration (v1)
 *
 * A complete TypeScript service for integrating with the TSCheckout v1 API.
 *
 * @example Basic Usage
 * ```ts
 * import { getTSCheckoutClient } from '@/lib/tscheckout';
 *
 * const client = getTSCheckoutClient();
 *
 * // Login (if not using env token)
 * await client.login({ userName: 'user', password: 'pass', publicKey: '...', publicKeySlug: '...' });
 *
 * // Fetch available events
 * const events = await client.getAvailableEvents({ _limit: 10 });
 *
 * // Get ticket types for an event
 * const ticketTypes = await client.getTicketTypes(events.data[0].id);
 * ```
 *
 * @example Cart Pricing (v1 API uses /orders/describe)
 * ```ts
 * import { createCart, createTicket, getTSCheckoutClient } from '@/lib/tscheckout';
 *
 * const client = getTSCheckoutClient();
 *
 * // Build a cart using the fluent API
 * const cart = createCart()
 *   .customer('John', 'Doe', 'john@example.com')
 *   .addTicket(
 *     createTicket(12345)
 *       .attendee('John', 'Doe')
 *       .email('john@example.com')
 *       .dateOfBirth(5, 15, 1990)
 *       .build()
 *   )
 *   .promoCode('SAVE10')
 *   .buildRequest();
 *
 * // Calculate cart pricing via /orders/describe
 * const orderPreview = await client.describeOrder(cart);
 * console.log('Total:', orderPreview.data.total);
 * ```
 *
 * @example Quick Cart
 * ```ts
 * import { quickCart, getTSCheckoutClient } from '@/lib/tscheckout';
 *
 * const client = getTSCheckoutClient();
 *
 * // Simple cart for common cases (v1 API uses ticketTypeId)
 * const request = quickCart({
 *   customer: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
 *   tickets: [
 *     { ticketTypeId: 12345, firstName: 'John', lastName: 'Doe' },
 *     { ticketTypeId: 12345, firstName: 'Jane', lastName: 'Doe' }
 *   ],
 *   promoCode: 'SAVE10'
 * });
 *
 * const orderPreview = await client.describeOrder(request);
 * ```
 */

// Client
export {
  TSCheckoutClient,
  createTSCheckoutClient,
  getTSCheckoutClient,
  resetTSCheckoutClient,
  type TSCheckoutConfig,
} from './client';

// Cart Builder
export {
  CartBuilder,
  TicketBuilder,
  createCart,
  createTicket,
  quickCart,
  simplifyTickets,
  type SimpleTicketInput,
} from './cart-builder';

// Types - Common
export type {
  Address,
  Name,
  Person,
  Venue,
} from './types';

// Types - Authentication
export type {
  LoginRequest,
  LoginResponse,
  AuthTokenCheckResponse,
} from './types';

// Types - Events
export type {
  TSEvent,
  EventInventory,
  EventStatus,
  OnSaleStatus,
  PublishedStatus,
  ListEventsParams,
  WaveTime,
} from './types';

// Types - Ticket Types
export type {
  TicketType,
  Question,
  Answer,
  ListTicketTypesParams,
} from './types';

// Types - Cart
export type {
  CreateOrderTicket,
  CreateOrderAnswer,
  BasicInfo,
  CartPromoCode,
  ShippingOption,
  InsuranceInfo,
  PaymentMethod,
  CartOptions,
  ProcessCartRequest,
  CartLineItem,
  CartSummary,
  AttendeeAddress,
  ClaimInfo,
  DetachedOrderResponse,
  DescribeOrderResponse,
  DescribeOrderTicket,
  CardPaymentInfo,
  SezzlePaymentInfo,
} from './types';

// NOTE: v1 API does not have separate cart endpoints.
// Cart state is managed client-side (Zustand store).
// Use describeOrder() to validate and price cart items.

// Types - Orders
export type {
  Order,
  OrderStatus,
  Ticket,
  TicketStatus,
  Transaction,
  CreateOrderRequest,
  CreateOrderResponse,
  PaymentProcessingResponse,
  CompleteOrderRequest,
  CartResponse,
} from './types';

// Types - API Responses
export type {
  ListResponse,
  SingleResponse,
  ResultResponse,
  ErrorResponse,
} from './types';

// Error class
export { TSCheckoutError } from './types';
