/**
 * QR Code Generator
 *
 * This is a placeholder implementation that generates unique QR code identifiers.
 * In production, this would integrate with a QR code generation library (like 'qrcode')
 * to generate actual QR code images.
 *
 * The QR code format includes:
 * - Booking ID for verification
 * - Ticket Type ID for validation
 * - Ticket index within the booking
 * - Timestamp for uniqueness
 * - Checksum for integrity
 */

/**
 * Generate a unique QR code string for a ticket
 *
 * Format: QR_{bookingId}_{ticketTypeId}_{index}_{timestamp}_{checksum}
 *
 * @param bookingId - The booking ID this ticket belongs to
 * @param ticketTypeId - The ticket type ID
 * @param ticketIndex - Index of this ticket within the booking (0-based)
 * @returns Unique QR code string
 */
export function generateQRCode(
  bookingId: string,
  ticketTypeId: string,
  ticketIndex: number
): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)

  // Create a simple checksum from the components
  const data = `${bookingId}-${ticketTypeId}-${ticketIndex}-${timestamp}-${random}`
  const checksum = simpleChecksum(data)

  return `QR_${bookingId.substring(0, 8)}_${ticketTypeId.substring(0, 8)}_${ticketIndex}_${timestamp}_${checksum}`
}

/**
 * Parse a QR code string back to its components
 */
export function parseQRCode(qrCode: string): {
  bookingIdPrefix: string
  ticketTypeIdPrefix: string
  ticketIndex: number
  timestamp: number
  checksum: string
  isValid: boolean
} | null {
  const parts = qrCode.split("_")

  if (parts.length !== 6 || parts[0] !== "QR") {
    return null
  }

  try {
    const result = {
      bookingIdPrefix: parts[1],
      ticketTypeIdPrefix: parts[2],
      ticketIndex: parseInt(parts[3], 10),
      timestamp: parseInt(parts[4], 10),
      checksum: parts[5],
      isValid: false,
    }

    // Verify checksum
    const data = `${result.bookingIdPrefix}-${result.ticketTypeIdPrefix}-${result.ticketIndex}-${result.timestamp}-${parts[5]}`
    // Note: In a real implementation, we'd verify the checksum properly

    result.isValid = true
    return result
  } catch {
    return null
  }
}

/**
 * Simple checksum function (placeholder)
 * In production, use a proper cryptographic hash
 */
function simpleChecksum(data: string): string {
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36).substring(0, 6)
}

/**
 * Validate a ticket QR code against a booking
 *
 * @param qrCode - The QR code to validate
 * @param bookingId - The expected booking ID
 * @returns True if valid, false otherwise
 */
export function validateQRCodeForBooking(
  qrCode: string,
  bookingId: string
): boolean {
  const parsed = parseQRCode(qrCode)

  if (!parsed || !parsed.isValid) {
    return false
  }

  // Check if the booking ID prefix matches
  return bookingId.startsWith(parsed.bookingIdPrefix)
}

/**
 * Generate a data URL for a QR code image (placeholder)
 *
 * In production, this would use a library like 'qrcode' to generate
 * an actual QR code image as a data URL.
 *
 * @param qrCode - The QR code string to encode
 * @returns Data URL of the QR code image (placeholder returns empty string)
 */
export function generateQRCodeImage(qrCode: string): string {
  // Placeholder - in production, use:
  // import QRCode from 'qrcode'
  // return await QRCode.toDataURL(qrCode)

  // For now, return a placeholder indicating this should be implemented
  return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="50" y="50" text-anchor="middle">QR</text></svg>`
}
