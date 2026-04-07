import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { ApiErrorResponse, ErrorCode } from "./types"

/**
 * Custom API error class for consistent error handling
 */
export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 400,
    public details?: Record<string, string | string[]>
  ) {
    super(message)
    this.name = "ApiError"
  }

  toResponse(): NextResponse<ApiErrorResponse> {
    return NextResponse.json(
      {
        success: false,
        error: this.code,
        message: this.message,
        details: this.details,
      },
      { status: this.statusCode }
    )
  }
}

/**
 * Pre-defined error factories for common error scenarios
 */
export const Errors = {
  // Validation
  validation: (message: string, details?: Record<string, string | string[]>) =>
    new ApiError(ErrorCode.VALIDATION_ERROR, message, 400, details),

  invalidRequest: (message: string) =>
    new ApiError(ErrorCode.INVALID_REQUEST, message, 400),

  // Resource
  notFound: (resource: string) =>
    new ApiError(ErrorCode.NOT_FOUND, `${resource} not found`, 404),

  alreadyExists: (resource: string) =>
    new ApiError(ErrorCode.ALREADY_EXISTS, `${resource} already exists`, 409),

  // Auth
  unauthorized: (message = "Authentication required") =>
    new ApiError(ErrorCode.UNAUTHORIZED, message, 401),

  forbidden: (message = "Access denied") =>
    new ApiError(ErrorCode.FORBIDDEN, message, 403),

  // Inventory
  inventoryConflict: (message = "Inventory has changed since selection") =>
    new ApiError(ErrorCode.INVENTORY_CONFLICT, message, 409),

  insufficientInventory: (ticketType: string, available: number) =>
    new ApiError(
      ErrorCode.INSUFFICIENT_INVENTORY,
      `Not enough ${ticketType} tickets available. Only ${available} remaining.`,
      409
    ),

  inventoryLockExpired: () =>
    new ApiError(
      ErrorCode.INVENTORY_LOCK_EXPIRED,
      "Your cart has expired. Please start over.",
      410
    ),

  // Booking
  bookingExpired: () =>
    new ApiError(
      ErrorCode.BOOKING_EXPIRED,
      "Your booking session has expired. Please start over.",
      410
    ),

  bookingNotFound: () =>
    new ApiError(ErrorCode.BOOKING_NOT_FOUND, "Booking not found", 404),

  bookingAlreadyConfirmed: () =>
    new ApiError(
      ErrorCode.BOOKING_ALREADY_CONFIRMED,
      "This booking has already been confirmed",
      409
    ),

  invalidStep: (current: string, expected: string) =>
    new ApiError(
      ErrorCode.INVALID_CHECKOUT_STEP,
      `Invalid checkout step. Expected '${expected}', but currently at '${current}'.`,
      400
    ),

  missingPersonalInfo: () =>
    new ApiError(
      ErrorCode.MISSING_PERSONAL_INFO,
      "Personal information is required before payment",
      400
    ),

  // Promo codes
  promoCodeInvalid: () =>
    new ApiError(ErrorCode.PROMO_CODE_INVALID, "Invalid promo code", 400),

  promoCodeExpired: () =>
    new ApiError(ErrorCode.PROMO_CODE_EXPIRED, "This promo code has expired", 400),

  promoCodeMaxUses: () =>
    new ApiError(
      ErrorCode.PROMO_CODE_MAX_USES,
      "This promo code has reached its maximum uses",
      400
    ),

  promoCodeMinPurchase: (minAmount: number) =>
    new ApiError(
      ErrorCode.PROMO_CODE_MIN_PURCHASE,
      `Minimum purchase of $${minAmount.toFixed(2)} required for this promo code`,
      400
    ),

  // Server
  internal: (message = "An unexpected error occurred") =>
    new ApiError(ErrorCode.INTERNAL_ERROR, message, 500),

  transactionFailed: (message = "Transaction failed. Please try again.") =>
    new ApiError(ErrorCode.TRANSACTION_FAILED, message, 500),
}

/**
 * Convert Zod validation errors to ApiError
 */
export function fromZodError(error: ZodError): ApiError {
  const details: Record<string, string[]> = {}

  error.issues.forEach((err) => {
    const path = err.path.join(".")
    if (!details[path]) {
      details[path] = []
    }
    details[path].push(err.message)
  })

  return Errors.validation("Validation failed", details)
}

/**
 * Global error handler for API routes
 */
export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  console.error("API Error:", error)

  if (error instanceof ApiError) {
    return error.toResponse()
  }

  if (error instanceof ZodError) {
    return fromZodError(error).toResponse()
  }

  // Prisma errors
  if (error instanceof Error) {
    if (error.message.includes("P2002")) {
      return Errors.alreadyExists("Record").toResponse()
    }
    if (error.message.includes("P2025")) {
      return Errors.notFound("Record").toResponse()
    }
  }

  return Errors.internal().toResponse()
}

/**
 * Success response helper
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status }
  )
}
