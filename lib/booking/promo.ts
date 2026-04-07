import { prisma } from "@/lib/prisma"
import { PromoCode, DiscountType } from "@prisma/client"
import { Errors, ApiError } from "@/lib/api/errors"

/**
 * Validate a promo code and return it if valid
 */
export async function validatePromoCode(
  code: string,
  subtotal: number
): Promise<PromoCode> {
  const promoCode = await prisma.promoCode.findUnique({
    where: { code: code.toUpperCase().trim() },
  })

  if (!promoCode) {
    throw Errors.promoCodeInvalid()
  }

  // Check expiration
  if (promoCode.expiresAt && promoCode.expiresAt < new Date()) {
    throw Errors.promoCodeExpired()
  }

  // Check max uses
  if (promoCode.maxUses !== null && promoCode.usedCount >= promoCode.maxUses) {
    throw Errors.promoCodeMaxUses()
  }

  // Check minimum purchase
  if (promoCode.minPurchaseAmount !== null) {
    const minAmount = Number(promoCode.minPurchaseAmount)
    if (subtotal < minAmount) {
      throw Errors.promoCodeMinPurchase(minAmount)
    }
  }

  return promoCode
}

/**
 * Calculate discount amount based on promo code and subtotal
 */
export function calculateDiscount(
  promoCode: PromoCode | null,
  subtotal: number
): number {
  if (!promoCode) {
    return 0
  }

  const discountValue = Number(promoCode.discountValue)

  if (promoCode.discountType === DiscountType.PERCENTAGE) {
    // Percentage discount - cap at 100%
    const percentage = Math.min(discountValue, 100)
    return Math.round((subtotal * percentage) / 100 * 100) / 100
  } else {
    // Fixed discount - cap at subtotal
    return Math.min(discountValue, subtotal)
  }
}

/**
 * Get promo code details for API response
 */
export interface PromoCodeDetails {
  id: string
  code: string
  discountType: "PERCENTAGE" | "FIXED"
  discountValue: number
  description: string | null
}

export async function getPromoCodeDetails(
  promoCodeId: string
): Promise<PromoCodeDetails | null> {
  const promoCode = await prisma.promoCode.findUnique({
    where: { id: promoCodeId },
    select: {
      id: true,
      code: true,
      discountType: true,
      discountValue: true,
      description: true,
    },
  })

  if (!promoCode) {
    return null
  }

  return {
    id: promoCode.id,
    code: promoCode.code,
    discountType: promoCode.discountType,
    discountValue: Number(promoCode.discountValue),
    description: promoCode.description,
  }
}

/**
 * Increment promo code usage count (call during booking confirmation)
 */
export async function incrementPromoCodeUsage(
  promoCodeId: string,
  tx?: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
): Promise<void> {
  const client = tx || prisma
  await client.promoCode.update({
    where: { id: promoCodeId },
    data: {
      usedCount: { increment: 1 },
    },
  })
}

/**
 * Apply promo code to a draft booking
 */
export async function applyPromoCodeToBooking(
  bookingId: string,
  code: string,
  subtotal: number
): Promise<{
  promoCode: PromoCodeDetails
  discount: number
}> {
  // Validate the promo code
  const validatedCode = await validatePromoCode(code, subtotal)

  // Calculate discount
  const discount = calculateDiscount(validatedCode, subtotal)

  // Update the draft booking with the promo code
  await prisma.draftBooking.update({
    where: { id: bookingId },
    data: { promoCodeId: validatedCode.id },
  })

  return {
    promoCode: {
      id: validatedCode.id,
      code: validatedCode.code,
      discountType: validatedCode.discountType,
      discountValue: Number(validatedCode.discountValue),
      description: validatedCode.description,
    },
    discount,
  }
}

/**
 * Remove promo code from a draft booking
 */
export async function removePromoCodeFromBooking(
  bookingId: string
): Promise<void> {
  await prisma.draftBooking.update({
    where: { id: bookingId },
    data: { promoCodeId: null },
  })
}
