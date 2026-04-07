import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { handleApiError, successResponse, Errors } from "@/lib/api/errors"
import { CartInitializeResponse } from "@/lib/api/types"
import { CART_EXPIRY_MS } from "@/lib/booking"
import { CheckoutStep } from "@prisma/client"
import { cookies } from "next/headers"
import { randomUUID } from "crypto"

/**
 * Request validation schema
 */
const initializeSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
})

/**
 * Generate a unique session ID for cart tracking
 */
function generateSessionId(): string {
  // Use crypto.randomUUID() which is available in Node.js 19+ and modern browsers
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}

/**
 * POST /api/cart/initialize
 *
 * Initialize a new cart/draft booking for an event
 *
 * Request body:
 * - eventId: string - The event to create a cart for
 *
 * Response:
 * - bookingId: string - The draft booking ID to use for cart operations
 * - eventId: string - The event ID
 * - expiresAt: string - ISO timestamp when the cart expires
 * - cart: CartItem[] - Empty cart array
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const { eventId } = initializeSchema.parse(body)

    // Verify event exists and is available for booking
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        name: true,
        status: true,
        date: true,
      },
    })

    if (!event) {
      throw Errors.notFound("Event")
    }

    if (event.status !== "PUBLISHED") {
      throw Errors.validation("This event is not currently available for booking")
    }

    if (event.date < new Date()) {
      throw Errors.validation("This event has already passed")
    }

    // Generate or retrieve session ID
    let sessionId: string

    // Try to get session from cookie or create new one
    const cookieStore = await cookies()
    const existingSession = cookieStore.get("cart_session")?.value

    if (existingSession) {
      // Check if there's an existing draft for this session and event
      const existingDraft = await prisma.draftBooking.findFirst({
        where: {
          sessionId: existingSession,
          eventId,
          expiresAt: { gt: new Date() },
        },
        select: {
          id: true,
          expiresAt: true,
          cart: true,
        },
      })

      if (existingDraft) {
        // Return existing draft booking
        const cart = JSON.parse(existingDraft.cart)
        return successResponse<CartInitializeResponse>({
          bookingId: existingDraft.id,
          eventId,
          expiresAt: existingDraft.expiresAt.toISOString(),
          cart,
        })
      }

      sessionId = existingSession
    } else {
      sessionId = generateSessionId()
    }

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + CART_EXPIRY_MS)

    // Create new draft booking
    const draftBooking = await prisma.draftBooking.create({
      data: {
        eventId,
        sessionId,
        currentStep: CheckoutStep.TICKET_SELECTION,
        cart: JSON.stringify([]), // Empty cart
        expiresAt,
      },
    })

    // Create response with Set-Cookie header
    const response = NextResponse.json(
      {
        success: true,
        data: {
          bookingId: draftBooking.id,
          eventId,
          expiresAt: expiresAt.toISOString(),
          cart: [],
        } satisfies CartInitializeResponse,
      },
      { status: 200 }
    )

    // Set session cookie if new
    if (!existingSession) {
      response.cookies.set("cart_session", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 60, // 30 minutes
      })
    }

    return response
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * GET /api/cart/initialize
 *
 * Get current cart state for a session
 * Useful for page refresh/recovery
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get("eventId")
    const bookingId = searchParams.get("bookingId")

    const cookieStore = await cookies()
    const sessionId = cookieStore.get("cart_session")?.value

    if (!sessionId && !bookingId) {
      return successResponse<CartInitializeResponse | null>(null, "No active cart")
    }

    // Build query conditions
    const whereClause: Record<string, unknown> = {
      expiresAt: { gt: new Date() },
    }

    if (bookingId) {
      whereClause.id = bookingId
    } else if (sessionId) {
      whereClause.sessionId = sessionId
      if (eventId) {
        whereClause.eventId = eventId
      }
    }

    const draftBooking = await prisma.draftBooking.findFirst({
      where: whereClause,
      select: {
        id: true,
        eventId: true,
        expiresAt: true,
        cart: true,
        currentStep: true,
        personalInfo: true,
        attendees: true,
        promoCodeId: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    if (!draftBooking) {
      return successResponse<CartInitializeResponse | null>(null, "No active cart found")
    }

    const cart = JSON.parse(draftBooking.cart)

    return successResponse<CartInitializeResponse>({
      bookingId: draftBooking.id,
      eventId: draftBooking.eventId,
      expiresAt: draftBooking.expiresAt.toISOString(),
      cart,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
