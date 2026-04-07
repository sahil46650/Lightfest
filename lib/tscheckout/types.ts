/**
 * TSCheckout API Types
 * Based on: https://clevergroup.tscheckout.com/api/v1 endpoints
 */

// ============================================================================
// Common Types
// ============================================================================

export interface Address {
  street?: string;
  street2?: string;
  city?: string;
  zip?: string;
  phone?: string;
  country?: string;
  internationalAddress?: string;
}

export interface Name {
  first?: string;
  last?: string;
}

export interface Person {
  name?: Name;
  address?: Address;
  phone?: string;
  suburb?: string;
}

export interface Venue {
  name?: string;
  address?: Address;
}

// ============================================================================
// Authentication Types (v1 API)
// ============================================================================

/**
 * v1 tokens login request
 * POST /api/v1/tokens
 */
export interface LoginRequest {
  userName: string;
  password: string;
  publicKey: string;
  publicKeySlug: string;
}

/**
 * v1 tokens login response
 */
export interface LoginResponse {
  token: string;
}

export interface AuthTokenCheckResponse {
  valid: boolean;
  expiresAt?: number;
}

// ============================================================================
// Event Types (v1 API)
// ============================================================================

export type EventStatus =
  | 'all'
  | 'availableonline'
  | 'upcomingonline'
  | 'availableupcomingonline'
  | 'availableboxoffice'
  | 'upcomingboxoffice'
  | 'availableupcomingboxoffice'
  | 'upcoming'
  | 'ongoing'
  | 'elapsed';

export type OnSaleStatus =
  | 'all'
  | 'onsale'
  | 'upcoming'
  | 'onsaleupcoming'
  | 'offsales';

export type PublishedStatus =
  | 'all'
  | 'published'
  | 'upcoming'
  | 'publishedupcoming'
  | 'unpublished';

export interface EventInventory {
  sold: number;
  total: number | null;
}

/**
 * Event venue address structure
 */
export interface V2VenueAddress {
  street1?: string;
  street2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string | null;
}

/**
 * v2 Event venue structure
 */
export interface V2Venue {
  name?: string;
  address?: V2VenueAddress;
}

/**
 * v2 Event payee structure
 */
export interface V2Payee {
  company?: string;
  contact?: string;
  email?: string;
  address?: V2VenueAddress;
}

/**
 * v2 Event show/display settings
 */
export interface V2EventShowSettings {
  venue?: {
    show?: boolean;
    address?: {
      street1?: boolean;
      streee2?: boolean; // Note: API typo
      city?: boolean;
      state?: boolean;
      zip?: boolean;
    };
  };
  location?: boolean;
  startDate?: boolean;
  startTime?: boolean;
}

/**
 * v2 Event shipping options
 */
export interface V2AllowShip {
  willCall?: boolean;
  standard?: boolean;
  secondDay?: boolean;
  nextDay?: boolean;
  shipEticket?: boolean;
}

/**
 * v2 Event custom settings
 */
export interface V2EventCustom {
  buyButton?: string;
  discliamer?: string; // Note: API typo
  ticketHeaderImage?: string;
  ticketImage?: string;
  startDate?: string;
}

/**
 * v2 Event date format settings
 */
export interface V2EventFormat {
  startDate?: string;
  endDate?: string;
}

/**
 * v2 Event text settings
 */
export interface V2EventText {
  receipt?: string;
  eTicket?: string | null;
  cuttOff?: string; // Note: API typo
  notOnSale?: string;
}

/**
 * v2 API Event structure
 * GET /api/v1/event and GET /api/v1/event/{id}
 */
export interface TSEvent {
  id: string;
  title: string;
  start: number; // Unix timestamp
  end?: number; // Unix timestamp
  venue?: V2Venue;
  cutOff?: number; // Unix timestamp
  onSaleDate?: number | null; // Unix timestamp
  publishedDate?: number | null; // Unix timestamp
  published?: boolean;
  hideDate?: boolean;
  hideTime?: boolean;
  smallPic?: string;
  largePic?: string;
  shortDescription?: string;
  description?: string;
  category?: string;
  ordering?: string | number;
  location?: string;
  location2?: string;
  sefUrl?: string;
  timezone?: string;
  inventory?: EventInventory;
  tags?: string[];
  waveTimes?: WaveTime[];
  // v2 additional fields
  featured?: boolean;
  onSale?: boolean;
  eventType?: string;
  alias?: string;
  ages?: string;
  capacity?: string;
  payee?: V2Payee;
  show?: V2EventShowSettings;
  allowShip?: V2AllowShip;
  useRsvpButton?: string;
  custom?: V2EventCustom;
  receiptEmails?: string;
  text?: V2EventText;
  format?: V2EventFormat;
  skipOnList?: boolean;
  barcodeTypeId?: string;
  allowAnyAmountDonation?: boolean;
  anyAmountDonationTicketType?: boolean;
  typeOfEvent?: string;
  requiresInvite?: boolean;
  registrationOpens?: boolean;
  lastUpdate?: number;
}

export interface WaveTime {
  id: number;
  time: string;
  name?: string;
  capacity?: number;
  sold?: number;
}

/**
 * v2 Event list parameters
 * GET /api/v1/event
 */
export interface ListEventsParams {
  title?: string;
  search?: string;
  fromStart?: number; // Unix timestamp
  toStart?: number; // Unix timestamp
  fromEnd?: number; // Unix timestamp
  toEnd?: number; // Unix timestamp
  status?: EventStatus;
  onsale?: OnSaleStatus;
  published?: PublishedStatus;
  updatedSince?: number; // Unix timestamp
  _include?: string; // 'tags', 'waveTimes', 'sold'
  _orderBy?: string; // 'ordering', 'title', 'start', 'id' (prefix with - for desc)
  _limit?: number;
  _offset?: number;
}

// ============================================================================
// Ticket Type Types (v2 API)
// ============================================================================

/**
 * v2 Ticket type quantity limits
 */
export interface V2QuantityLimits {
  allowSelection?: boolean;
  minimum?: number;
  maximum?: number;
}

/**
 * v2 Ticket type fee structure (fee1, fee2)
 */
export interface V2Fee {
  name?: string;
  charge?: boolean;
  amount?: number;
  type?: 'percent' | 'flat';
}

/**
 * v2 Ticket type VAT settings
 */
export interface V2Vat {
  percentage?: number;
  charge?: boolean;
}

/**
 * v2 API Ticket Type structure
 * GET /api/v1/event/{id}/ticket-type
 */
export interface TicketType {
  id: string | number;
  eventId: string | number;
  name: string;
  key?: string;
  groupKey?: string;
  price: number;
  faceValue?: number;
  description?: string;
  ordering?: number;
  quantityLimits?: V2QuantityLimits;
  // Legacy fields for backward compatibility
  quantityAvailable?: number;
  quantitySold?: number;
  minPerOrder?: number;
  maxPerOrder?: number;
  saleStart?: string; // Unix timestamp
  saleEnd?: string; // Unix timestamp
  hidden?: number;
  questions?: Question[];
  // v2 additional fields
  externalId?: string;
  externalId2?: string;
  externalRaceId?: string;
  onSale?: boolean;
  hideInBoxOffice?: boolean;
  hideInFrontend?: boolean;
  blockPromoCodes?: boolean;
  fee1?: V2Fee;
  fee2?: V2Fee;
  vat?: V2Vat;
  showExtraText?: boolean;
  addToCartButtonText?: string;
  notOnSaleText?: string;
  customWaveTimeName?: string;
  customBocaTicketName?: string;
  bocaTicketSpecialText?: string;
  bocaTicketWideStubText?: string;
  skipTransferFees?: boolean;
  skipWaivers?: boolean;
  collectPartyMemberAddress?: boolean;
  passwordRequired?: boolean;
  requiredGender?: boolean;
  requiresMembership?: boolean;
  shippingDisabled?: boolean;
  lastUpdate?: string | number;
}

export interface Question {
  id: number;
  text: string;
  type: string;
  required?: boolean;
  ordering?: number;
  answers?: Answer[];
}

export interface Answer {
  id: number;
  questionId: number;
  answer: string;
  addOnAmount?: number;
  ordering?: number;
  quantityAvailable?: number;
  sku?: string;
}

export interface ListTicketTypesParams {
  _limit?: number;
  _offset?: number;
  _select?: string;
}

// ============================================================================
// Shopping Cart Types (Server-side cart persistence)
// ============================================================================

export interface ShoppingCartTicketType {
  typeId: number;
  quantity: number;
  waveTimeId?: number;
}

export interface SaveCartRequest {
  cartId: string;
  ticketTypes: ShoppingCartTicketType[];
}

export interface DeleteCartRequest {
  cartId: string;
}

export interface ShoppingCartItem {
  typeId: number;
  quantity: number;
  waveTimeId?: number;
  name?: string;
  price?: number;
  eventId?: number;
}

export interface ShoppingCartResponse {
  cartId: string;
  ticketTypes: ShoppingCartItem[];
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// Cart Types
// ============================================================================

export interface AttendeeAddress {
  street?: string;
  street2?: string;
  city?: string;
  zip?: string;
  country?: string;
  phone?: string;
}

export interface CreateOrderAnswer {
  questionId: number;
  answerId?: number;
  answerText?: string;
  quantity?: number;
  displayText?: string;
}

export interface ClaimInfo {
  claimCode?: string;
  originalTicketId?: number;
}

/**
 * v1 API ticket structure for order creation
 * Uses ticketTypeId and partyMember* fields (not typeId/attendee*)
 */
export interface CreateOrderTicket {
  /** Ticket type ID (required) */
  ticketTypeId: number;
  /** Attendee first name */
  partyMember?: string;
  /** Attendee last name */
  partyMemberLastName?: string;
  /** Attendee email address */
  partyMemberEmail?: string;
  /** Birth month (1-12) */
  partyMemberBirthMonth?: number;
  /** Birth day (1-31) */
  partyMemberBirthDay?: number;
  /** Birth year (YYYY) */
  partyMemberBirthYear?: number;
  /** Gender (M/F) */
  partyMemberGender?: string;
  /** Whether the ticket is NOT for the purchaser (0 or 1) */
  notForPurchaser?: number;
  /** External membership ID */
  externalMembershipId?: string;
  /** Attendee address */
  attendeeAddress?: AttendeeAddress;
}

export interface BasicInfo {
  firstName: string;
  lastName: string;
  emailAddress: string;
  /** Optional cart ID reference */
  cartId?: string;
  /** Optional promo code */
  promoCode?: string;
  /** Street address */
  address?: string;
  /** Address line 2 */
  address2?: string;
  /** City */
  city?: string;
  /** State/Province */
  state?: string;
  /** Country */
  country?: string;
  /** Postal/ZIP code */
  zip?: string;
  /** External ID for integration */
  externalId?: string;
}

export interface CartPromoCode {
  code: string;
}

export interface ShippingOption {
  ticketTypeId: number;
  shippingOptionId: number;
}

export interface InsuranceInfo {
  optedIn?: number; // 0 or 1
  price?: number;
  quote?: string;
  protectionProduct?: string;
  vendor?: string;
}

export type PaymentMethod = 'credit' | 'cash' | 'sezzle';

export interface CartOptions {
  includeFees?: number; // 0 or 1
}

export interface BuildCartItemsRequest extends CartOptions {
  basicInfo?: BasicInfo;
  tickets?: CreateOrderTicket[];
  promoCodes?: CartPromoCode[];
  orderAnswers?: CreateOrderAnswer[];
  shippingOptions?: ShippingOption[];
  insuranceInfo?: InsuranceInfo;
}

export interface ProcessCartRequest extends BuildCartItemsRequest {
  paymentMethod?: PaymentMethod;
  /**
   * When true, creates an order without processing payment.
   * Payment must be handled separately (e.g., via PayVia).
   * Returns the order ID that can be used to finalize after payment.
   */
  detachPaymentMethod?: boolean;
  /** Send email receipt (0 or 1) */
  emailReceipt?: '1' | '0';
  /** Optional cart ID reference (NOT required) */
  cartId?: string;
  /** Credit card details for payment */
  card?: CardPaymentInfo;
  /** Sezzle payment details */
  sezzle?: SezzlePaymentInfo;
  /** Send waiver emails to attendees */
  sendWaiverEmails?: boolean;
  /** Flag order as deleted */
  flagAsDeleted?: boolean;
}

/**
 * Credit card payment information
 */
export interface CardPaymentInfo {
  /** Card expiration date (MM/YYYY format) */
  expirationDate?: string;
  /** Card number */
  number?: string;
  /** CVV code */
  cvv?: string;
  /** Stripe token for tokenized payments */
  stripeToken?: string;
  /** Square card token */
  squareCardToken?: string;
  /** Stripe payment intent ID */
  stripePaymentIntentId?: string;
  /** Whether using Sezzle payment */
  sezzlePayment?: boolean;
  /** GlobalPay token ID */
  globalPayTokenId?: string;
}

/**
 * Sezzle payment information
 */
export interface SezzlePaymentInfo {
  /** Card PAN for Sezzle */
  cardPan?: string;
  /** Card expiration month (MM) */
  cardExpMonth?: string;
  /** Card expiration year (YYYY) */
  cardExpYear?: string;
  /** Card CVV */
  cardCvv?: string;
}

/**
 * Response when creating an order with detachPaymentMethod: true
 */
export interface DetachedOrderResponse {
  success: boolean;
  message?: string;
  data: {
    orderId: string;
    total: number;
  };
}

// ============================================================================
// Order Creation Types (v1 API)
// ============================================================================

/**
 * Request to create an order.
 * POST /api/v1/orders
 *
 * This is the same structure as ProcessCartRequest - the v1 API uses
 * the same payload for both /orders/describe (pricing) and /orders (create).
 */
export type CreateOrderRequest = ProcessCartRequest;

/**
 * Response from POST /api/v1/orders when order is created successfully (200)
 */
export interface CreateOrderResponse {
  success: boolean;
  message?: string;
  data: {
    /** The id of the new order */
    id: string;
    /** Unix timestamp when created */
    created: string;
    /** Order hash */
    hash?: string;
    /** Tickets in the order */
    tickets?: {
      data: Ticket[];
      count: number;
      totalCount: number;
      offset: number;
      limit: number;
    };
  };
}

/**
 * Response from POST /api/v1/order when payment is still processing (202)
 */
export interface PaymentProcessingResponse {
  /** Status returned by payment processor: error, failed, cancelled, processing, or verify */
  status: 'error' | 'failed' | 'cancelled' | 'processing' | 'verify';
  /** Token returned by payment processor for additional verification */
  token?: string;
}

/**
 * Request to complete a staged order.
 * POST /api/v1/orders/{orderId}/complete-staged-order
 */
export interface CompleteOrderRequest {
  /** ID of the order to complete */
  orderId: number;
  /** Optional stripe payment intent ID to associate with the order */
  paymentIntentId?: string;
}

/**
 * Cart response structure
 */
export interface CartResponse {
  items?: CartLineItem[];
  subtotal?: number;
  fees?: number;
  discounts?: number;
  total?: number;
  tickets?: CreateOrderTicket[];
}

/**
 * v2 API cart line item - ticket item
 */
export interface V2CartTicketItem {
  itemType: 'ticketType';
  itemId: number;
  eventId: number;
  ticketIndex: number;
  description: string;
  price: number;
  originalPrice: number;
  total: number;
  quantity: number;
  fee1: number;
  fee2: number;
  serviceFee: number;
  thirdPartyFee: number;
  processingFee: number;
  waveTimeId?: string | number;
  teamId?: string;
  claimInfo?: string;
  bulkDiscountData?: unknown[];
  attendeeInfo?: {
    firstName?: string;
    lastName?: string;
    emailAddress?: string;
    phone?: string;
    gender?: string;
    address?: string;
  };
}

/**
 * v2 API cart line item - fee item
 */
export interface V2CartFeeItem {
  category: 'fee';
  itemType: 'fee1' | 'fee2' | 'serviceFee' | 'thirdPartyFee' | 'processingFee';
  itemId: string;
  description: string;
  price: number;
  total: number;
  taxType?: string | null;
}

/**
 * v2 API cart line item - discount item
 */
export interface V2CartDiscountItem {
  category: 'discount';
  itemType: 'discount' | 'promoCode';
  itemId: string;
  description: string;
  price: number;
  total: number;
}

/**
 * Union type for all v2 cart item types
 */
export type V2CartItem = V2CartTicketItem | V2CartFeeItem | V2CartDiscountItem;

/**
 * v2 API build cart items response
 * POST /api/v1/cart/build-cart-items
 *
 * Note: data is an object with numeric string keys, not an array
 */
export interface V2BuildCartItemsResponse {
  success: boolean;
  data: Record<string, V2CartItem>;
}

/**
 * Normalized cart line item for internal use
 */
export interface CartLineItem {
  id?: string;
  type: 'ticket' | 'fee' | 'discount' | 'insurance' | 'shipping' | 'addon';
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  ticketTypeId?: number;
  questionId?: number;
  answerId?: number;
}

export interface CartSummary {
  subtotal: number;
  fees: number;
  discounts: number;
  insurance: number;
  shipping: number;
  total: number;
  items: CartLineItem[];
}

// ============================================================================
// Order Types
// ============================================================================

export type OrderStatus =
  | 'active'
  | 'cancelled'
  | 'partially cancelled'
  | 'refunded'
  | 'refunded cancelled'
  | 'partial refund';

export type TicketStatus =
  | 'active'
  | 'checked in'
  | 'cancelled'
  | 'other';

export interface Ticket {
  id: string;
  status: TicketStatus;
  price: number;
  attendee?: string;
  name: string;
  attendeeAddress?: Person;
  answers?: Answer[];
}

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  date: string;
  status?: string;
}

export interface Order {
  id: string;
  created: string;
  purchasedDate: string;
  status: OrderStatus;
  emailAddress: string;
  total: number;
  purchaser?: Person;
  affiliate?: string;
  paymentMethod?: string;
  lastFour?: string;
  tickets?: Ticket[];
  transactions?: Transaction[];
  answers?: Answer[];
}

// ============================================================================
// API Response Types (v1 API)
// ============================================================================

/**
 * v1 API list response format.
 */
export interface ListResponse<T> {
  success?: boolean;
  data: T[];
  count: number;
  totalCount: number | string;
  limit: number | string | null;
  offset?: number | null;
  message?: string;
}

/**
 * v1 API single item response format.
 */
export interface SingleResponse<T> {
  success?: boolean;
  data: T;
  count?: number;
  message?: string;
}

export interface ResultResponse {
  success?: boolean;
  data?: unknown;
  message?: string;
}

/**
 * Response from POST /api/v1/orders/describe
 * Returns the cart with all fees calculated
 */
export interface DescribeOrderResponse {
  success: boolean;
  data: {
    /** Final total including all fees */
    orderTotal?: number;
    /** Split payment amount */
    splitAmount?: number;
    /** Cart subtotal (base ticket prices) */
    cartTotal?: number;
    /** Service fee total */
    serviceFee?: number;
    /** Third party fee total */
    thirdPartyFee?: number;
    /** Add-ons total */
    addOnsTotal?: number;
    /** Fee 1 total (e.g., Tax) */
    fee1Total?: number;
    /** Fee 2 total (e.g., Gratuity) */
    fee2Total?: number;
    /** Discount total */
    discountTotal?: number;
    /** Insurance total */
    insuranceTotal?: number;
    /** Payment processing fee */
    processingFee?: number;
    /** Individual ticket details */
    tickets?: DescribeOrderTicket[];
    /** Order ID if created with detachPaymentMethod */
    orderId?: number;
  };
  message?: string;
}

/**
 * Individual ticket from /orders/describe response (v1 API)
 */
export interface DescribeOrderTicket {
  typeId: number;
  totalPrice: number;
  basePrice: number;
  fee1Amount: number;
  fee1Name?: string;
  fee2Amount: number;
  fee2Name?: string;
  originalPrice: number;
  serviceFee: number;
  thirdPartyFee: number;
  processingFee: number;
  promoCodeUsed: number;
  bulkDiscountData?: {
    bulkDiscountUsed: boolean;
    bulkDiscountLevelUsed: boolean;
  };
  passTicketData?: boolean;
  vatData?: unknown;
}

export interface ErrorResponse {
  data: {
    field?: string;
    message: string;
  };
  count: number;
}

export class TSCheckoutError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public field?: string,
    public response?: ErrorResponse
  ) {
    super(message);
    this.name = 'TSCheckoutError';
  }
}
