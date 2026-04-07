/**
 * TSCheckout API Client
 *
 * A TypeScript service for integrating with the TSCheckout API.
 * Handles authentication, events, ticket types, and cart operations.
 */

import {
  type LoginRequest,
  type LoginResponse,
  type TSEvent,
  type ListEventsParams,
  type TicketType,
  type ListTicketTypesParams,
  type ProcessCartRequest,
  type ListResponse,
  type SingleResponse,
  type Order,
  type CreateOrderRequest,
  type CreateOrderResponse,
  type PaymentProcessingResponse,
  type CompleteOrderRequest,
  type DescribeOrderResponse,
  type ResultResponse,
  TSCheckoutError,
} from './types';

// ============================================================================
// Configuration
// ============================================================================

export interface TSCheckoutConfig {
  baseUrl: string;
  credentials?: {
    userName: string;
    password: string;
    publicKey: string;
    publicKeySlug: string;
  };
  token?: string;
  autoRefreshToken?: boolean;
  onTokenRefresh?: (token: string) => void;
  timeout?: number;
}

const DEFAULT_CONFIG: Partial<TSCheckoutConfig> = {
  baseUrl: 'https://clevergroup.tscheckout.com/api/v1',
  autoRefreshToken: true,
  timeout: 30000,
};

// ============================================================================
// Client Class
// ============================================================================

export class TSCheckoutClient {
  private config: TSCheckoutConfig;
  private token: string | null = null;
  private tokenExpiresAt: number | null = null;

  constructor(config: Partial<TSCheckoutConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config } as TSCheckoutConfig;

    if (config.token) {
      this.token = config.token;
    }
  }

  // ==========================================================================
  // HTTP Methods
  // ==========================================================================

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add auth token if available
    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.config.timeout
    );

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle 401 - attempt token refresh
      if (response.status === 401 && this.config.autoRefreshToken) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry the request with new token
          (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
          const retryResponse = await fetch(url, { ...options, headers });
          return this.handleResponse<T>(retryResponse);
        }
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new TSCheckoutError('Request timeout', 408);
      }
      throw error;
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      let errorData;
      if (isJson) {
        try {
          errorData = await response.json();
        } catch {
          errorData = null;
        }
      }

      const message = errorData?.data?.message || response.statusText || 'Request failed';
      const field = errorData?.data?.field;

      throw new TSCheckoutError(message, response.status, field, errorData);
    }

    if (isJson) {
      return response.json();
    }

    return response.text() as unknown as T;
  }

  private buildQueryString(params: object): string {
    const searchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    }

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  // ==========================================================================
  // Authentication (v1 API)
  // ==========================================================================

  /**
   * Authenticate with the TSCheckout API using credentials.
   * Stores the token internally for subsequent requests.
   *
   * Uses the v1 /tokens endpoint which requires:
   * - userName
   * - password
   * - publicKey
   * - publicKeySlug
   */
  async login(credentials?: LoginRequest): Promise<LoginResponse> {
    const loginData = credentials || this.config.credentials;

    if (!loginData) {
      throw new TSCheckoutError(
        'No credentials provided for login',
        400
      );
    }

    // v1 API returns { success: true, data: { jwt: "..." } }
    const response = await this.request<{ success: boolean; data: { jwt: string } }>(
      '/tokens',
      {
        method: 'POST',
        body: JSON.stringify(loginData),
      }
    );

    const token = response.data.jwt;
    this.token = token;
    this.config.onTokenRefresh?.(token);

    return { token };
  }

  /**
   * Set the auth token directly (useful when token is stored externally).
   */
  setToken(token: string): void {
    this.token = token;
  }

  /**
   * Get the current auth token.
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Check if we have a token (doesn't validate with server).
   * For v1 API, tokens are validated by attempting to make a request.
   */
  hasToken(): boolean {
    return !!this.token;
  }

  /**
   * Attempt to refresh the auth token using stored credentials.
   */
  private async refreshToken(): Promise<boolean> {
    if (!this.config.credentials) {
      return false;
    }

    try {
      await this.login(this.config.credentials);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Ensure the client is authenticated before making protected requests.
   * If credentials are available but no token exists, performs login.
   *
   * @returns true if authenticated (token exists), false otherwise
   */
  async ensureAuthenticated(): Promise<boolean> {
    console.log('[TSCheckout] ensureAuthenticated() called');
    console.log('[TSCheckout] Current token:', this.token ? 'EXISTS' : 'NULL');
    console.log('[TSCheckout] Has credentials:', !!this.config.credentials);

    // Already have a token
    if (this.token) {
      console.log('[TSCheckout] Already authenticated, returning true');
      return true;
    }

    // Try to login with credentials
    if (this.config.credentials) {
      console.log('[TSCheckout] Attempting login with credentials...');
      try {
        await this.login(this.config.credentials);
        console.log('[TSCheckout] Login successful!');
        return true;
      } catch (error) {
        console.error('[TSCheckout] Failed to authenticate:', error);
        return false;
      }
    }

    console.log('[TSCheckout] No credentials available, cannot authenticate');
    return false;
  }

  // ==========================================================================
  // Events (v1 API)
  // ==========================================================================

  /**
   * List events matching the provided filters.
   * Uses v1 /events endpoint.
   *
   * @example
   * ```ts
   * // Get upcoming events available for online purchase
   * const events = await client.listEvents({
   *   status: 'availableonline',
   *   _include: 'sold,tags',
   *   _orderBy: 'start',
   *   _limit: 20
   * });
   * ```
   */
  async listEvents(
    params: ListEventsParams = {}
  ): Promise<ListResponse<TSEvent>> {
    // Ensure authenticated - TSCheckout API requires JWT for all endpoints
    await this.ensureAuthenticated();

    // Convert legacy param names to v1 API format
    const v1Params: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      // Strip underscore prefix from param names (_limit -> limit)
      const v1Key = key.startsWith('_') ? key.slice(1) : key;
      v1Params[v1Key] = value;
    }

    const queryString = this.buildQueryString(v1Params);
    return this.request<ListResponse<TSEvent>>(`/events${queryString}`);
  }

  /**
   * Get a single event by ID.
   * Uses v1 /events/{id} endpoint.
   * Requires authentication - will auto-login if credentials are available.
   */
  async getEvent(eventId: number | string): Promise<SingleResponse<TSEvent>> {
    await this.ensureAuthenticated();
    return this.request<SingleResponse<TSEvent>>(`/events/${eventId}`);
  }

  /**
   * Get events available for online purchase.
   * Convenience method that pre-filters for online availability.
   */
  async getAvailableEvents(
    params: Omit<ListEventsParams, 'status'> = {}
  ): Promise<ListResponse<TSEvent>> {
    return this.listEvents({
      ...params,
      status: 'availableonline',
      _include: params._include || 'sold',
    });
  }

  /**
   * Get upcoming events (start date in the future).
   */
  async getUpcomingEvents(
    params: Omit<ListEventsParams, 'status'> = {}
  ): Promise<ListResponse<TSEvent>> {
    return this.listEvents({
      ...params,
      status: 'upcoming',
      _orderBy: params._orderBy || 'start',
    });
  }

  /**
   * Search events by text query.
   */
  async searchEvents(
    query: string,
    params: Omit<ListEventsParams, 'search'> = {}
  ): Promise<ListResponse<TSEvent>> {
    return this.listEvents({
      ...params,
      search: query,
    });
  }

  // ==========================================================================
  // Ticket Types (v1 API)
  // ==========================================================================

  /**
   * Get ticket types for a specific event.
   * Uses v1 /events/{id}/ticket-types endpoint.
   *
   * @example
   * ```ts
   * const ticketTypes = await client.getTicketTypes(12345);
   * ```
   */
  async getTicketTypes(
    eventId: number | string,
    params: ListTicketTypesParams = {}
  ): Promise<ListResponse<TicketType>> {
    // Ensure authenticated - TSCheckout API requires JWT for all endpoints
    await this.ensureAuthenticated();

    // Convert legacy param names to v1 API format
    const v1Params: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      const v1Key = key.startsWith('_') ? key.slice(1) : key;
      v1Params[v1Key] = value;
    }
    const queryString = this.buildQueryString(v1Params);
    return this.request<ListResponse<TicketType>>(
      `/events/${eventId}/ticket-types${queryString}`
    );
  }

  /**
   * Get wave times for an event (if applicable).
   * Uses v1 /events/{id}/wave-times endpoint.
   */
  async getWaveTimes(eventId: number | string): Promise<SingleResponse<unknown>> {
    await this.ensureAuthenticated();
    return this.request<SingleResponse<unknown>>(`/events/${eventId}/wave-times`);
  }

  // ==========================================================================
  // Orders (v1 API)
  // ==========================================================================
  // Note: v1 API does not have separate cart endpoints.
  // Use describeOrder() to validate and price cart items.
  // Cart state is managed client-side using Zustand.

  /**
   * Get an order by ID.
   * Uses v1 /orders/{id} endpoint.
   */
  async getOrder(
    orderId: number | string,
    options?: {
      includeTickets?: boolean;
      includeAnswers?: boolean;
      includeCosts?: boolean;
    }
  ): Promise<SingleResponse<Order>> {
    await this.ensureAuthenticated();
    const params: Record<string, string> = {};
    if (options?.includeTickets) params.includeTickets = 'true';
    if (options?.includeAnswers) params.includeAnswers = 'true';
    if (options?.includeCosts) params.includeCosts = 'true';

    const queryString = this.buildQueryString(params);
    return this.request<SingleResponse<Order>>(`/orders/${orderId}${queryString}`);
  }

  /**
   * Describe what order would be created from the cart data.
   * This builds and returns the cart with all fees calculated.
   * This is the primary method for cart validation in v1 API.
   *
   * @example
   * ```ts
   * const orderPreview = await client.describeOrder({
   *   includeFees: 1,
   *   basicInfo: { firstName: 'John', lastName: 'Doe', emailAddress: 'john@example.com' },
   *   tickets: [{ ticketTypeId: 12345 }],  // v1 API uses ticketTypeId
   *   promoCodes: [{ code: 'SAVE10' }]
   * });
   * // Access totals: orderPreview.data.total, orderPreview.data.fees, etc.
   * ```
   */
  async describeOrder(data: ProcessCartRequest): Promise<DescribeOrderResponse> {
    await this.ensureAuthenticated();
    return this.request<DescribeOrderResponse>('/orders/describe', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Create an order after payment has been verified.
   *
   * Flow:
   * 1. Build cart with describeOrder() to preview fees
   * 2. Process payment externally (e.g., via PayVia iframe)
   * 3. Call createOrder() with order data once payment is verified
   *
   * @param data - The order data (same structure as describeOrder)
   * @returns Order ID and details on success, or payment processing status if still pending
   *
   * @example
   * ```ts
   * // After payment is verified via PayVia
   * const result = await client.createOrder({
   *   paymentMethod: 'credit',
   *   detachPaymentMethod: true, // Payment already processed externally
   *   basicInfo: { firstName: 'John', lastName: 'Doe', emailAddress: 'john@example.com' },
   *   tickets: [{ ticketTypeId: 12345, partyMember: 'John', partyMemberLastName: 'Doe' }],
   * });
   *
   * if ('id' in result) {
   *   console.log('Order ID:', result.id);
   * }
   * ```
   */
  async createOrder(
    data: CreateOrderRequest
  ): Promise<CreateOrderResponse | PaymentProcessingResponse> {
    await this.ensureAuthenticated();
    return this.request<CreateOrderResponse | PaymentProcessingResponse>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Complete a staged order and run after-order processes.
   * Use this to finalize an order after it has been created.
   *
   * @example
   * ```ts
   * // After creating an order
   * await client.completeOrder({ orderId: 12345 });
   * ```
   */
  async completeOrder(data: CompleteOrderRequest): Promise<ResultResponse> {
    await this.ensureAuthenticated();
    const orderId = data.orderId;
    const params = data.paymentIntentId ? `?paymentIntentId=${data.paymentIntentId}` : '';
    return this.request<ResultResponse>(`/orders/${orderId}/complete-staged-order${params}`, {
      method: 'POST',
    });
  }

  // ==========================================================================
  // v1 Cart Flow Summary
  // ==========================================================================
  // Cart state is managed client-side using Zustand store.
  // Use describeOrder() to calculate cart totals and fees.
  //
  // v1 Cart Flow:
  // 1. Manage cart state client-side (Zustand)
  // 2. Use describeOrder() to preview order with fees calculated
  // 3. Process payment externally (PayVia)
  // 4. Use createOrder() to create the order after payment verification
  // 5. Use completeOrder() to finalize after payment is confirmed
  // ==========================================================================
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new TSCheckout client instance.
 *
 * @example
 * ```ts
 * // With credentials (auto-login)
 * const client = createTSCheckoutClient({
 *   credentials: {
 *     login: process.env.TSCHECKOUT_LOGIN!,
 *     password: process.env.TSCHECKOUT_PASSWORD!
 *   }
 * });
 *
 * // With existing token
 * const client = createTSCheckoutClient({
 *   token: 'existing-jwt-token'
 * });
 * ```
 */
export function createTSCheckoutClient(
  config: Partial<TSCheckoutConfig> = {}
): TSCheckoutClient {
  return new TSCheckoutClient(config);
}

// ============================================================================
// Singleton Instance
// ============================================================================

let defaultClient: TSCheckoutClient | null = null;

/**
 * Get or create the default TSCheckout client instance.
 * Uses environment variables for configuration.
 *
 * Required env vars for authentication (v1 API):
 * - NEXT_PUBLIC_TS_USERNAME
 * - NEXT_PUBLIC_TS_PASSWORD
 * - NEXT_PUBLIC_TS_PUBLIC_KEY
 * - NEXT_PUBLIC_TS_PUBLIC_KEY_SLUG
 * - NEXT_PUBLIC_TS_API_URL (optional, defaults to clevergroup.tscheckout.com/api/v1)
 */
export function getTSCheckoutClient(): TSCheckoutClient {
  if (!defaultClient) {
    // Debug: Log environment variable status
    console.log('[TSCheckout] Creating client singleton (v1 API)...');
    console.log('[TSCheckout] ENV check:', {
      hasUsername: !!process.env.NEXT_PUBLIC_TS_USERNAME,
      hasPassword: !!process.env.NEXT_PUBLIC_TS_PASSWORD,
      hasPublicKey: !!process.env.NEXT_PUBLIC_TS_PUBLIC_KEY,
      hasPublicKeySlug: !!process.env.NEXT_PUBLIC_TS_PUBLIC_KEY_SLUG,
      apiUrl: process.env.NEXT_PUBLIC_TS_API_URL,
    });

    const hasCredentials =
      process.env.NEXT_PUBLIC_TS_USERNAME &&
      process.env.NEXT_PUBLIC_TS_PASSWORD &&
      process.env.NEXT_PUBLIC_TS_PUBLIC_KEY &&
      process.env.NEXT_PUBLIC_TS_PUBLIC_KEY_SLUG;

    defaultClient = new TSCheckoutClient({
      baseUrl:
        process.env.NEXT_PUBLIC_TS_API_URL
          ? `${process.env.NEXT_PUBLIC_TS_API_URL}/api/v1`
          : 'https://clevergroup.tscheckout.com/api/v1',
      credentials: hasCredentials
        ? {
            userName: process.env.NEXT_PUBLIC_TS_USERNAME!,
            password: process.env.NEXT_PUBLIC_TS_PASSWORD!,
            publicKey: process.env.NEXT_PUBLIC_TS_PUBLIC_KEY!,
            publicKeySlug: process.env.NEXT_PUBLIC_TS_PUBLIC_KEY_SLUG!,
          }
        : undefined,
      token: process.env.TSCHECKOUT_TOKEN,
    });
  }

  return defaultClient;
}

/**
 * Reset the default client (useful for testing).
 */
export function resetTSCheckoutClient(): void {
  defaultClient = null;
}
