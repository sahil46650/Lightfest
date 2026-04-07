/**
 * PayVia API Client
 *
 * Handles authentication and payment processing with the PayVia API.
 * Implements token caching for efficiency (55 min TTL).
 */

import {
  PayViaEnvironment,
  PAYVIA_API_URLS,
  AuthRequest,
  AuthResponse,
  PaymentRequest,
  PaymentResponse,
  PayViaApiError,
  PayViaApiErrorResponse,
  CachedToken,
  CustomerInfo,
  PaymentMethodData,
} from './types';

// ============================================================================
// Configuration
// ============================================================================

const TOKEN_CACHE_TTL = 55 * 60 * 1000; // 55 minutes (tokens expire at 60)

// Module-level token cache
const tokenCache = new Map<string, CachedToken>();

// ============================================================================
// PayVia Client Class
// ============================================================================

export class PayViaClient {
  private readonly environment: PayViaEnvironment;
  private readonly apiKey: string;
  private readonly appKey: string;
  private readonly merchantId: string;
  private readonly apiUrl: string;

  constructor(config: {
    environment: PayViaEnvironment;
    apiKey: string;
    appKey: string;
    merchantId: string;
  }) {
    this.environment = config.environment;
    this.apiKey = config.apiKey;
    this.appKey = config.appKey;
    this.merchantId = config.merchantId;
    this.apiUrl = PAYVIA_API_URLS[config.environment];
  }

  /**
   * Get authentication token from PayVia API
   * Implements caching with 55-minute TTL
   */
  async getAuthToken(): Promise<string> {
    const cacheKey = `${this.environment}-${this.apiKey}-${this.appKey}`;
    const cached = tokenCache.get(cacheKey);

    // Return cached token if still valid
    if (cached && cached.expiresAt > Date.now()) {
      return cached.token;
    }

    const authUrl = `${this.apiUrl}/v4/auth/token`;

    const authRequest: AuthRequest = {
      data: {
        type: 'auth',
        attributes: {
          appKey: this.appKey,
        },
      },
    };

    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(authRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData: PayViaApiErrorResponse;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        throw new PayViaApiError(
          `Authentication failed: ${errorText}`,
          response.status,
          'auth_failed'
        );
      }
      throw PayViaApiError.fromResponse(response.status, errorData);
    }

    const result: AuthResponse = await response.json();
    const token = result.data.attributes.app_token;

    // Cache the token
    tokenCache.set(cacheKey, {
      token,
      expiresAt: Date.now() + TOKEN_CACHE_TTL,
    });

    return token;
  }

  /**
   * Process a payment through the PayVia API
   */
  async processPayment(params: {
    amount: number;
    orderId: string;
    customerInfo: CustomerInfo;
    paymentMethodData: PaymentMethodData;
  }): Promise<PaymentResponse> {
    // Get auth token (cached if available)
    const authToken = await this.getAuthToken();

    const paymentUrl = `${this.apiUrl}/v4/payments`;

    const paymentRequest: PaymentRequest = {
      data: {
        type: 'payments',
        attributes: {
          merchantId: this.merchantId,
          amount: params.amount,
          currency: 'USD',
          orderId: params.orderId,
          customerInfo: params.customerInfo,
          paymentMethodData: params.paymentMethodData,
        },
      },
    };

    const response = await fetch(paymentUrl, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData: PayViaApiErrorResponse;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        throw new PayViaApiError(
          `Payment processing failed: ${errorText}`,
          response.status,
          'payment_failed'
        );
      }
      throw PayViaApiError.fromResponse(response.status, errorData);
    }

    return response.json();
  }

  /**
   * Clear the cached auth token (useful for forcing re-authentication)
   */
  clearTokenCache(): void {
    const cacheKey = `${this.environment}-${this.apiKey}-${this.appKey}`;
    tokenCache.delete(cacheKey);
  }

  /**
   * Get the merchant ID
   */
  getMerchantId(): string {
    return this.merchantId;
  }

  /**
   * Get the environment
   */
  getEnvironment(): PayViaEnvironment {
    return this.environment;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a new PayVia client instance
 */
export function createPayViaClient(config: {
  environment?: PayViaEnvironment;
  apiKey: string;
  appKey: string;
  merchantId: string;
}): PayViaClient {
  return new PayViaClient({
    environment: config.environment || 'staging',
    apiKey: config.apiKey,
    appKey: config.appKey,
    merchantId: config.merchantId,
  });
}

/**
 * Get a PayVia client configured from environment variables
 * Throws if required environment variables are missing
 */
export function getPayViaClient(): PayViaClient {
  const apiKey = process.env.PAYVIA_API_KEY;
  const appKey = process.env.PAYVIA_APP_KEY;
  const merchantId = process.env.NEXT_PUBLIC_PAYVIA_MERCHANT_ID;
  const environment = (process.env.NEXT_PUBLIC_PAYVIA_ENVIRONMENT || 'staging') as PayViaEnvironment;

  if (!apiKey) {
    throw new Error('PAYVIA_API_KEY environment variable is required');
  }
  if (!appKey) {
    throw new Error('PAYVIA_APP_KEY environment variable is required');
  }
  if (!merchantId) {
    throw new Error('NEXT_PUBLIC_PAYVIA_MERCHANT_ID environment variable is required');
  }

  return new PayViaClient({
    environment,
    apiKey,
    appKey,
    merchantId,
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Parse expiration date from "MM/YY" format to separate month and year
 */
export function parseExpirationDate(expiry: string): {
  expirationMonth: string;
  expirationYear: string;
} {
  const cleanDate = expiry.replace('/', '');
  const expirationMonth = cleanDate.substring(0, 2) || '01';
  const expirationYear = `20${cleanDate.substring(2, 4)}` || '2099';
  return { expirationMonth, expirationYear };
}

/**
 * Parse cardholder name into first and last name
 */
export function parseCardholderName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  const trimmed = fullName.trim();
  const [firstName, ...lastNameParts] = trimmed.split(' ');
  return {
    firstName: firstName || 'Unknown',
    lastName: lastNameParts.join(' ') || 'Customer',
  };
}

/**
 * Build PaymentMethodData from token created event
 */
export function buildPaymentMethodData(
  token: string,
  expiry: string,
  cardholderName: string
): PaymentMethodData {
  const { expirationMonth, expirationYear } = parseExpirationDate(expiry);
  return {
    type: 'card',
    token,
    expirationMonth,
    expirationYear,
    cardholderName,
  };
}
