import { NextRequest } from "next/server"
import { handleApiError, successResponse, Errors } from "@/lib/api/errors"
import { cleanupExpiredLocks, cleanupExpiredDraftBookings } from "@/lib/booking"

/**
 * Cron secret for authentication
 * This should be set in environment variables and passed in the request
 */
const CRON_SECRET = process.env.CRON_SECRET

/**
 * POST /api/inventory/cleanup
 *
 * Clean up expired inventory locks and draft bookings
 * This endpoint is designed to be called by a cron job
 *
 * Headers:
 * - Authorization: Bearer <CRON_SECRET>
 *
 * Actions:
 * 1. Delete all InventoryLock records where expiresAt < now()
 * 2. Delete all DraftBooking records where expiresAt < now()
 *
 * Response:
 * - locksDeleted: number - Count of expired locks cleaned up
 * - draftsDeleted: number - Count of expired drafts cleaned up
 *
 * Schedule: Run every 5 minutes via Vercel Cron or similar
 *
 * Example cron configuration (vercel.json):
 * {
 *   "crons": [
 *     {
 *       "path": "/api/inventory/cleanup",
 *       "schedule": "run every 5 minutes"
 *     }
 *   ]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate cron request
    // Allow if:
    // 1. Running in development mode
    // 2. Authorization header matches CRON_SECRET
    // 3. Vercel cron protection header is present

    const authHeader = request.headers.get("authorization")
    const isVercelCron = request.headers.get("x-vercel-cron") === "1"
    const isDevelopment = process.env.NODE_ENV === "development"

    // In development, allow without auth for testing
    if (!isDevelopment) {
      // Production security check
      const isAuthorized =
        isVercelCron ||
        (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`)

      if (!isAuthorized) {
        throw Errors.unauthorized("Invalid cron authorization")
      }
    }

    // Perform cleanup
    const locksDeleted = await cleanupExpiredLocks()
    const draftsDeleted = await cleanupExpiredDraftBookings()

    // Log the cleanup
    console.log(
      `[Inventory Cleanup] Deleted ${locksDeleted} expired locks, ${draftsDeleted} expired drafts`
    )

    return successResponse(
      {
        locksDeleted,
        draftsDeleted,
        cleanedAt: new Date().toISOString(),
      },
      `Cleanup complete: ${locksDeleted} locks, ${draftsDeleted} drafts removed`
    )
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * GET /api/inventory/cleanup
 *
 * Get statistics about items pending cleanup
 * Useful for monitoring and debugging
 *
 * Headers:
 * - Authorization: Bearer <CRON_SECRET>
 *
 * Response:
 * - expiredLocks: number - Count of expired locks
 * - expiredDrafts: number - Count of expired drafts
 * - activeLocks: number - Count of valid locks
 * - activeDrafts: number - Count of valid drafts
 */
export async function GET(request: NextRequest) {
  try {
    // Import prisma here to avoid potential issues
    const { prisma } = await import("@/lib/prisma")

    // Same auth check as POST
    const authHeader = request.headers.get("authorization")
    const isVercelCron = request.headers.get("x-vercel-cron") === "1"
    const isDevelopment = process.env.NODE_ENV === "development"

    if (!isDevelopment) {
      const isAuthorized =
        isVercelCron ||
        (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`)

      if (!isAuthorized) {
        throw Errors.unauthorized("Invalid authorization")
      }
    }

    const now = new Date()

    // Get counts
    const [expiredLocks, activeLocks, expiredDrafts, activeDrafts] =
      await Promise.all([
        prisma.inventoryLock.count({
          where: { expiresAt: { lt: now } },
        }),
        prisma.inventoryLock.count({
          where: { expiresAt: { gte: now } },
        }),
        prisma.draftBooking.count({
          where: { expiresAt: { lt: now } },
        }),
        prisma.draftBooking.count({
          where: { expiresAt: { gte: now } },
        }),
      ])

    return successResponse({
      expiredLocks,
      activeLocks,
      expiredDrafts,
      activeDrafts,
      checkTime: now.toISOString(),
    })
  } catch (error) {
    return handleApiError(error)
  }
}
