/**
 * Booking utilities index
 * Re-exports all booking-related functions for easy importing
 */

// Inventory management
export {
  SERVICE_FEE_RATE,
  CART_EXPIRY_MS,
  calculateServiceFee,
  getAvailableInventory,
  getInventoryForEvent,
  validateInventoryAvailability,
  updateInventoryLocks,
  getBookingLocks,
  releaseInventoryLocks,
  cleanupExpiredLocks,
  cleanupExpiredDraftBookings,
} from "./inventory"

// Promo code handling
export {
  validatePromoCode,
  calculateDiscount,
  getPromoCodeDetails,
  incrementPromoCodeUsage,
  applyPromoCodeToBooking,
  removePromoCodeFromBooking,
  type PromoCodeDetails,
} from "./promo"

// Transaction handling
export {
  confirmBooking,
  getBookingById,
  getBookingByConfirmationNumber,
  cancelBooking,
  type BookingConfirmationResult,
} from "./transaction"
