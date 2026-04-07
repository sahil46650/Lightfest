/**
 * PayVia Embedded Checkout Types
 *
 * Type definitions for the PayVia payment gateway integration.
 * Includes types for iframe communication, API requests/responses, and error handling.
 */

// ============================================================================
// Environment Configuration
// ============================================================================

export type PayViaEnvironment = 'staging' | 'production';

export const PAYVIA_CHECKOUT_URLS: Record<PayViaEnvironment, string> = {
  staging: 'https://checkout.staging.digitzs.com',
  production: 'https://checkout.digitzs.com',
};

export const PAYVIA_API_URLS: Record<PayViaEnvironment, string> = {
  staging: 'https://api.payvia.staging.ondeets.ai',
  production: 'https://api.payvia.ondeets.ai',
};

export const PAYVIA_ALLOWED_ORIGINS = [
  'https://checkout.staging.digitzs.com',
  'https://checkout.digitzs.com',
];

// ============================================================================
// Checkout Configuration (Parent → Iframe)
// ============================================================================

export interface CheckoutStyles {
  backgroundColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  inputBorderColor?: string;
  borderRadius?: string;
  fontSize?: string;
}

export interface CheckoutOrderItem {
  type: string;
  description: string;
  quantity: number;
  price: number;
  sku: string;
}

export interface CheckoutOrderPayload {
  orderItems: CheckoutOrderItem[];
}

/**
 * Configuration sent to the PayVia checkout iframe
 * via postMessage when `digitzs:ready` is received
 */
export interface CheckoutConfig {
  /** Amount in dollars (e.g., 25.00) */
  amount: number;
  /** Your PayVia merchant ID */
  merchantId: string;
  /** Customer email (pre-filled in form) */
  email: string;
  /** Customer ZIP code (pre-filled in form) */
  zipCode?: string;
  /** Cardholder name (pre-filled in form) */
  cardHolderName: string;
  /** Your order/invoice ID */
  invoice: string;
  /** Show ZIP code field in form */
  isZipCodeEnabled: boolean;
  /** Show email field in form */
  isEmailEnabled: boolean;
  /** Payment method type ('card' for credit card) */
  defaultPaymentMethod: string;
  /** Optional styling customization */
  styles?: CheckoutStyles;
  /** Optional order details for display */
  orderPayload?: CheckoutOrderPayload;
}

// ============================================================================
// PostMessage Types (Iframe ↔ Parent)
// ============================================================================

export type PostMessageType =
  | 'digitzs:ready'
  | 'digitzs:init-checkout'
  | 'digitzs:token-created'
  | 'digitzs:error'
  | 'digitzs:resize'
  | 'digitzs:validation-error';

export interface PostMessageBase {
  type: PostMessageType;
}

export interface ReadyMessage extends PostMessageBase {
  type: 'digitzs:ready';
}

export interface InitCheckoutMessage extends PostMessageBase {
  type: 'digitzs:init-checkout';
  config: CheckoutConfig;
}

export interface TokenData {
  /** First 6 digits of card */
  firstSix: string;
  /** Last 4 digits of card */
  lastFour: string;
  /** TokenEx token */
  token: string;
  /** Reference number */
  referenceNumber: string;
  /** HMAC for token verification */
  tokenHMAC: string;
  /** Whether CVV was included */
  cvvIncluded: boolean;
  /** Card type (visa, mastercard, etc.) */
  cardType: string;
}

export interface TokenFormData {
  firstName?: string;
  lastName?: string;
  email?: string;
  /** Note: capital 'H' in cardHolderName */
  cardHolderName?: string;
  /** Format: "MM/YY" */
  expiry?: string;
  zipCode?: string;
}

/**
 * Data received when the iframe tokenizes a card
 * Sent via `digitzs:token-created` postMessage
 */
export interface TokenCreatedData {
  /** The tokenized card (use this for payment) */
  token: string;
  /** Transaction amount */
  amount: number;
  /** Your order ID */
  invoice: string;
  /** Merchant ID */
  merchantId: string;
  /** Detailed token information */
  tokenData?: TokenData;
  /** Payment method type */
  paymentMethod?: string;
  /** Form data from the checkout */
  form: TokenFormData;
}

export interface TokenCreatedMessage extends PostMessageBase {
  type: 'digitzs:token-created';
  data: TokenCreatedData;
}

export interface PayViaError {
  message: string;
  code?: string;
}

export interface ErrorMessage extends PostMessageBase {
  type: 'digitzs:error';
  error: PayViaError;
}

export interface ResizeMessage extends PostMessageBase {
  type: 'digitzs:resize';
  height: number;
}

export interface ValidationErrorMessage extends PostMessageBase {
  type: 'digitzs:validation-error';
  errors?: Record<string, string>;
}

export type PayViaPostMessage =
  | ReadyMessage
  | InitCheckoutMessage
  | TokenCreatedMessage
  | ErrorMessage
  | ResizeMessage
  | ValidationErrorMessage;

// ============================================================================
// PayVia API Authentication
// ============================================================================

export interface AuthRequest {
  data: {
    type: 'auth';
    attributes: {
      appKey: string;
    };
  };
}

export interface AuthResponse {
  data: {
    type: 'auth';
    attributes: {
      app_token: string;
    };
  };
}

// ============================================================================
// PayVia API Payment Request/Response
// ============================================================================

export interface BillingAddress {
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  billingAddress: BillingAddress;
}

export interface PaymentMethodData {
  type: 'card';
  /** TokenEx token from iframe */
  token: string;
  /** "01" - "12" */
  expirationMonth: string;
  /** "2027" */
  expirationYear: string;
  cardholderName: string;
}

export interface PaymentAttributes {
  merchantId: string;
  /** Amount in dollars (e.g., 25.00) */
  amount: number;
  currency: 'USD';
  orderId: string;
  customerInfo: CustomerInfo;
  paymentMethodData: PaymentMethodData;
}

export interface PaymentRequest {
  data: {
    type: 'payments';
    attributes: PaymentAttributes;
  };
}

export interface PaymentResponseAttributes {
  status: 'approved' | 'succeeded' | 'completed' | 'declined' | 'pending' | 'error';
  amount: number;
  currency: string;
  orderId: string;
  createdAt: string;
}

export interface PaymentResponse {
  // Core response fields
  success: boolean;
  status: 'completed' | 'pending' | 'failed';
  transactionId: string;
  amount: number;
  paymentMethod: string;
  gateway: 'nmi' | 'stripe';
  
  // Detailed payment data
  data: {
    id: string;
    type: 'payments';
    attributes: PaymentResponseAttributes;
  };
  
  // Metadata
  meta?: {
    gateway: 'nmi' | 'stripe';
    processingTime: string;
  };
  
  // Raw gateway response
  result?: Record<string, unknown>;
  
  // Error details (present on failure)
  error?: {
    code: 'PAYMENT_FAILED' | 'PAYMENT_PROCESSING_FAILED';
    message: string;
    gateway?: 'nmi' | 'stripe';
    gatewayResponse?: Record<string, unknown>;
  };
}

// ============================================================================
// PayVia API Error Types
// ============================================================================

export interface PayViaApiErrorMeta {
  field?: string;
}

export interface PayViaApiErrorItem {
  status: string;
  code: string;
  title: string;
  detail: string;
  meta?: PayViaApiErrorMeta;
}

export interface PayViaApiErrorResponse {
  errors: PayViaApiErrorItem[];
}

/**
 * Custom error class for PayVia API errors
 */
export class PayViaApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly errors: PayViaApiErrorItem[];

  constructor(
    message: string,
    status: number,
    code: string,
    errors: PayViaApiErrorItem[] = []
  ) {
    super(message);
    this.name = 'PayViaApiError';
    this.status = status;
    this.code = code;
    this.errors = errors;
  }

  static fromResponse(status: number, response: PayViaApiErrorResponse): PayViaApiError {
    const firstError = response.errors?.[0];
    const message = firstError?.detail || firstError?.title || 'Unknown PayVia error';
    const code = firstError?.code || 'unknown_error';
    return new PayViaApiError(message, status, code, response.errors);
  }
}

// ============================================================================
// Token Cache Types (for auth token caching)
// ============================================================================

export interface CachedToken {
  token: string;
  expiresAt: number;
}

// ============================================================================
// Internal API Route Types
// ============================================================================

/**
 * Request body for the internal payment API route
 */
export interface ProcessPaymentRequest {
  /** Draft booking ID from Prisma */
  draftBookingId: string;
  /** Token data from PayVia checkout iframe */
  tokenData: TokenCreatedData;
}

/**
 * Response from the internal payment API route
 */
export interface ProcessPaymentResponse {
  success: boolean;
  bookingId?: string;
  confirmationNumber?: string;
  email?: string;
  total?: number;
  status?: string;
  error?: string;
}
