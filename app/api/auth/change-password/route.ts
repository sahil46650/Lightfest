import { NextRequest } from "next/server"
import bcrypt from "bcrypt"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth/config"
import { handleApiError, successResponse, Errors, ApiError } from "@/lib/api/errors"
import { changePasswordSchema } from "@/lib/validations/auth"
import { ErrorCode } from "@/lib/api/types"

/**
 * POST /api/auth/change-password
 *
 * Change password for authenticated user
 *
 * Request body:
 * - currentPassword: string - Current password
 * - newPassword: string - New password (8+ chars, strong requirements)
 * - confirmNewPassword: string - Must match newPassword
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      throw Errors.unauthorized()
    }

    const userId = (session.user as any).id
    const body = await request.json()
    const { currentPassword, newPassword } = changePasswordSchema.parse(body)

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
      },
    })

    if (!user || !user.password) {
      throw Errors.notFound("User")
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)

    if (!isCurrentPasswordValid) {
      throw new ApiError(
        ErrorCode.VALIDATION_ERROR,
        "Current password is incorrect",
        400,
        { currentPassword: ["Current password is incorrect"] }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    })

    return successResponse(
      { changed: true },
      "Password changed successfully"
    )
  } catch (error) {
    return handleApiError(error)
  }
}
