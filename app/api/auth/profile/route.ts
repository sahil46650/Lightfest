import { NextRequest } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth/config"
import { handleApiError, successResponse, Errors } from "@/lib/api/errors"
import { updateProfileSchema } from "@/lib/validations/auth"

/**
 * GET /api/auth/profile
 *
 * Get current user's profile
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      throw Errors.unauthorized()
    }

    const userId = (session.user as any).id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        image: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    })

    if (!user) {
      throw Errors.notFound("User")
    }

    return successResponse(user)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PATCH /api/auth/profile
 *
 * Update current user's profile
 *
 * Request body:
 * - name: string (optional)
 * - phone: string (optional)
 * - image: string (optional)
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      throw Errors.unauthorized()
    }

    const userId = (session.user as any).id
    const body = await request.json()
    const validatedData = updateProfileSchema.parse(body)

    // Build update data - only include non-empty fields
    const updateData: Record<string, string | null> = {}

    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name || null
    }

    if (validatedData.phone !== undefined) {
      updateData.phone = validatedData.phone || null
    }

    if (validatedData.image !== undefined) {
      updateData.image = validatedData.image || null
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        image: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    })

    return successResponse(user, "Profile updated successfully")
  } catch (error) {
    return handleApiError(error)
  }
}
