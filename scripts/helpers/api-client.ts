/**
 * Centralized API client for test scripts
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface CartItem {
  ticketTypeId: string
  ticketName: string
  price: number
  quantity: number
}

export interface CartInitializeResponse {
  bookingId: string
  eventId: string
  expiresAt: string
  cart: CartItem[]
}

export interface CartUpdateResponse {
  cart: CartItem[]
  subtotal: number
  serviceFee: number
  discount: number
  total: number
  expiresAt: string
}

export interface BookingConfirmResponse {
  bookingId: string
  confirmationNumber: string
  email: string
  total: number
  ticketCount: number
}

export interface PromoCodeResponse {
  code: string
  discountType: 'PERCENTAGE' | 'FIXED'
  discountValue: number
  discount: number
  total: number
}

/**
 * Generic POST request
 */
export async function post<T = unknown>(
  endpoint: string,
  body: unknown
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Generic GET request
 */
export async function get<T = unknown>(
  endpoint: string,
  params?: Record<string, string>
): Promise<ApiResponse<T>> {
  let url = `${API_BASE_URL}${endpoint}`

  if (params) {
    const searchParams = new URLSearchParams(params)
    url += `?${searchParams.toString()}`
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Generic DELETE request
 */
export async function del<T = unknown>(
  endpoint: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Initialize a cart for an event
 */
export async function initializeCart(
  eventId: string
): Promise<ApiResponse<CartInitializeResponse>> {
  return post<CartInitializeResponse>('/api/cart/initialize', { eventId })
}

/**
 * Update cart with ticket quantities
 */
export async function updateCart(
  bookingId: string,
  updates: Record<string, number>
): Promise<ApiResponse<CartUpdateResponse>> {
  return post<CartUpdateResponse>('/api/cart/update', { bookingId, updates })
}

/**
 * Get current cart state
 */
export async function getCart(bookingId: string): Promise<ApiResponse<CartUpdateResponse>> {
  return get<CartUpdateResponse>('/api/cart/update', { bookingId })
}

/**
 * Apply promo code to cart
 */
export async function applyPromoCode(
  bookingId: string,
  code: string
): Promise<ApiResponse<PromoCodeResponse>> {
  return post<PromoCodeResponse>('/api/cart/promo', { bookingId, code })
}

/**
 * Remove promo code from cart
 */
export async function removePromoCode(bookingId: string): Promise<ApiResponse<void>> {
  return del('/api/cart/promo', { bookingId })
}

/**
 * Submit personal information
 */
export async function submitPersonalInfo(
  bookingId: string,
  personalInfo: {
    email: string
    firstName: string
    lastName: string
    phone: string
    countryCode?: string
    createAccount?: boolean
    password?: string
  }
): Promise<ApiResponse<unknown>> {
  return post('/api/checkout/personal', { bookingId, personalInfo })
}

/**
 * Submit attendee information
 */
export async function submitAttendeeInfo(
  bookingId: string,
  attendees: Record<string, { name: string; email: string }>
): Promise<ApiResponse<unknown>> {
  return post('/api/checkout/attendees', { bookingId, attendees })
}

/**
 * Confirm the booking
 */
export async function confirmBooking(
  bookingId: string
): Promise<ApiResponse<BookingConfirmResponse>> {
  return post<BookingConfirmResponse>('/api/bookings/confirm', { bookingId })
}

/**
 * Check inventory availability
 */
export async function checkInventory(
  eventId: string,
  ticketTypeIds?: string[]
): Promise<ApiResponse<unknown>> {
  const params: Record<string, string> = { eventId }
  if (ticketTypeIds) {
    params.ticketTypeIds = ticketTypeIds.join(',')
  }
  return get('/api/inventory/check', params)
}

/**
 * Cleanup expired inventory locks
 */
export async function cleanupInventory(): Promise<ApiResponse<unknown>> {
  return post('/api/inventory/cleanup', {})
}

/**
 * Queue an email (for testing)
 */
export async function queueEmail(
  recipientEmail: string,
  templateType: string,
  bookingId?: string
): Promise<ApiResponse<unknown>> {
  return post('/api/email/queue', { recipientEmail, templateType, bookingId })
}
