/**
 * Standard API response types for consistent response formats
 */

export interface ApiSuccessResponse<T = unknown> {
  success: true
  data: T
  message?: string
}

export interface ApiErrorResponse {
  success: false
  error: string
  message: string
  details?: Record<string, string | string[]>
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * Standard error codes used across API endpoints
 */
export enum ErrorCode {
  // Validation errors
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_REQUEST = "INVALID_REQUEST",

  // Resource errors
  NOT_FOUND = "NOT_FOUND",
  ALREADY_EXISTS = "ALREADY_EXISTS",

  // Auth errors
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",

  // Inventory errors
  INVENTORY_CONFLICT = "INVENTORY_CONFLICT",
  INSUFFICIENT_INVENTORY = "INSUFFICIENT_INVENTORY",
  INVENTORY_LOCK_EXPIRED = "INVENTORY_LOCK_EXPIRED",

  // Booking errors
  BOOKING_EXPIRED = "BOOKING_EXPIRED",
  BOOKING_NOT_FOUND = "BOOKING_NOT_FOUND",
  BOOKING_ALREADY_CONFIRMED = "BOOKING_ALREADY_CONFIRMED",
  INVALID_CHECKOUT_STEP = "INVALID_CHECKOUT_STEP",
  MISSING_PERSONAL_INFO = "MISSING_PERSONAL_INFO",

  // Promo code errors
  PROMO_CODE_INVALID = "PROMO_CODE_INVALID",
  PROMO_CODE_EXPIRED = "PROMO_CODE_EXPIRED",
  PROMO_CODE_MAX_USES = "PROMO_CODE_MAX_USES",
  PROMO_CODE_MIN_PURCHASE = "PROMO_CODE_MIN_PURCHASE",

  // Server errors
  INTERNAL_ERROR = "INTERNAL_ERROR",
  TRANSACTION_FAILED = "TRANSACTION_FAILED",
}

/**
 * Cart-related types
 */
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

export interface CartUpdateRequest {
  bookingId: string
  updates: Record<string, number> // ticketTypeId -> quantity
}

export interface CartUpdateResponse {
  cart: CartItem[]
  subtotal: number
  serviceFee: number
  discount: number
  total: number
  expiresAt: string
}

export interface PromoCodeRequest {
  bookingId: string
  code: string
}

export interface PromoCodeResponse {
  code: string
  discountType: "PERCENTAGE" | "FIXED"
  discountValue: number
  discount: number
  total: number
}

/**
 * Checkout-related types
 */
export interface PersonalInfoRequest {
  bookingId: string
  personalInfo: {
    email: string
    firstName: string
    lastName: string
    phone: string
    countryCode?: string
    createAccount?: boolean
    password?: string
  }
}

export interface AttendeeInfoRequest {
  bookingId: string
  attendees: Record<string, {
    name: string
    email: string
    addOns?: Array<{ name: string; price: number }>
  }>
}

/**
 * Booking confirmation types
 */
export interface BookingConfirmRequest {
  bookingId: string
}

export interface BookingConfirmResponse {
  bookingId: string
  confirmationNumber: string
  email: string
  total: number
  ticketCount: number
}

/**
 * Inventory types
 */
export interface InventoryCheckRequest {
  eventId: string
  ticketTypeIds?: string[]
}

export interface TicketTypeAvailability {
  ticketTypeId: string
  name: string
  price: number
  available: number
  locked: number
  actualAvailable: number
}

export interface InventoryCheckResponse {
  eventId: string
  ticketTypes: TicketTypeAvailability[]
  sessionLocks?: Record<string, number>
}
