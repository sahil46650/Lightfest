import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { handleApiError, successResponse, Errors } from "@/lib/api/errors"
import { PromoCodeRequest, PromoCodeResponse, CartItem } from "@/lib/api/types"
import {
  applyPromoCodeToBooking,
  removePromoCodeFromBooking,
  calculateDiscount,
  calculateServiceFee,
} from "@/lib/booking"

/**
 * Request validation schema for applying promo code
 */
const applyPromoSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
  code: z.string().min(1, "Promo code is required"),
})

/**
 * Request validation schema for removing promo code
 */
const removePromoSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
})

/**
 * POST /api/cart/promo
 *
 * Apply a promo code to a draft booking
 *
 * Request body:
 * - bookingId: string - The draft booking ID
 * - code: string - The promo code to apply
 *
 * Response:
 * - code: string - The applied promo code
 * - discountType: "PERCENTAGE" | "FIXED"
 * - discountValue: number - The discount value (percentage or fixed amount)
 * - discount: number - The calculated discount amount
 * - total: number - New total after discount
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const { bookingId, code } = applyPromoSchema.parse(body)

    // Fetch draft booking
    const draftBooking = await prisma.draftBooking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        cart: true,
        expiresAt: true,
        promoCodeId: true,
      },
    })

    if (!draftBooking) {
      throw Errors.bookingNotFound()
    }

    // Check expiration
    if (draftBooking.expiresAt < new Date()) {
      throw Errors.bookingExpired()
    }

    // Parse cart and calculate subtotal
    const cart = JSON.parse(draftBooking.cart) as CartItem[]
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

    if (subtotal === 0) {
      throw Errors.validation("Cannot apply promo code to an empty cart")
    }

    // Apply promo code (validates and updates draft booking)
    const result = await applyPromoCodeToBooking(bookingId, code, subtotal)

    // Calculate total
    const serviceFee = calculateServiceFee(subtotal)
    const total = subtotal + serviceFee - result.discount

    return successResponse<PromoCodeResponse>({
      code: result.promoCode.code,
      discountType: result.promoCode.discountType,
      discountValue: result.promoCode.discountValue,
      discount: result.discount,
      total,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/cart/promo
 *
 * Remove promo code from a draft booking
 *
 * Request body:
 * - bookingId: string - The draft booking ID
 *
 * Response:
 * - success: true
 * - data.total: number - New total without discount
 */
export async function DELETE(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const { bookingId } = removePromoSchema.parse(body)

    // Fetch draft booking
    const draftBooking = await prisma.draftBooking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        cart: true,
        expiresAt: true,
        promoCodeId: true,
      },
    })

    if (!draftBooking) {
      throw Errors.bookingNotFound()
    }

    // Check expiration
    if (draftBooking.expiresAt < new Date()) {
      throw Errors.bookingExpired()
    }

    // Remove promo code
    await removePromoCodeFromBooking(bookingId)

    // Calculate new total
    const cart = JSON.parse(draftBooking.cart) as CartItem[]
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const serviceFee = calculateServiceFee(subtotal)
    const total = subtotal + serviceFee

    return successResponse({
      discount: 0,
      total,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * GET /api/cart/promo
 *
 * Get current promo code details for a booking
 *
 * Query params:
 * - bookingId: string - The draft booking ID
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get("bookingId")

    if (!bookingId) {
      throw Errors.invalidRequest("bookingId is required")
    }

    // Fetch draft booking with promo code
    const draftBooking = await prisma.draftBooking.findUnique({
      where: { id: bookingId },
      select: {
        cart: true,
        expiresAt: true,
        promoCode: {
          select: {
            code: true,
            discountType: true,
            discountValue: true,
            description: true,
          },
        },
      },
    })

    if (!draftBooking) {
      throw Errors.bookingNotFound()
    }

    // Check expiration
    if (draftBooking.expiresAt < new Date()) {
      throw Errors.bookingExpired()
    }

    // If no promo code applied
    if (!draftBooking.promoCode) {
      return successResponse(null, "No promo code applied")
    }

    // Calculate discount
    const cart = JSON.parse(draftBooking.cart) as CartItem[]
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

    // Create a mock PromoCode object for calculateDiscount
    const promoCode = {
      discountType: draftBooking.promoCode.discountType,
      discountValue: draftBooking.promoCode.discountValue,
    } as { discountType: "PERCENTAGE" | "FIXED"; discountValue: number | { toNumber(): number } }

    const discount = calculateDiscount(promoCode as any, subtotal)

    return successResponse<PromoCodeResponse>({
      code: draftBooking.promoCode.code,
      discountType: draftBooking.promoCode.discountType,
      discountValue: Number(draftBooking.promoCode.discountValue),
      discount,
      total: subtotal + calculateServiceFee(subtotal) - discount,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
