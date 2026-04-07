import { NextRequest } from "next/server"
import { z } from "zod"
import bcrypt from "bcrypt"
import { prisma } from "@/lib/prisma"
import { handleApiError, successResponse, Errors, ApiError } from "@/lib/api/errors"
import { passwordSchema } from "@/lib/validations/auth"
import { ErrorCode } from "@/lib/api/types"

/**
 * Request validation schema
 */
const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: passwordSchema,
})

/**
 * POST /api/auth/reset-password
 *
 * Reset password using a valid reset token
 *
 * Request body:
 * - token: string - Reset token from email link
 * - password: string - New password (8+ chars, strong requirements)
 *
 * Response:
 * - success: boolean
 * - message: string
 * - data.email: string - User's email for auto-login
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = resetPasswordSchema.parse(body)

    // Find and validate token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    })

    if (!verificationToken) {
      throw new ApiError(
        ErrorCode.VALIDATION_ERROR,
        "Invalid or expired reset link. Please request a new one.",
        400
      )
    }

    // Check if token is expired
    if (verificationToken.expires < new Date()) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: { token },
      })

      throw new ApiError(
        ErrorCode.VALIDATION_ERROR,
        "This reset link has expired. Please request a new one.",
        400
      )
    }

    // Find user by email (identifier)
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
    })

    if (!user) {
      throw Errors.notFound("User")
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update user password in a transaction
    await prisma.$transaction(async (tx) => {
      // Update password
      await tx.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      })

      // Delete the used token
      await tx.verificationToken.delete({
        where: { token },
      })
    })

    return successResponse(
      { email: user.email },
      "Password reset successfully. You can now sign in with your new password."
    )
  } catch (error) {
    return handleApiError(error)
  }
}
