import { NextRequest } from "next/server"
import { z } from "zod"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { handleApiError, successResponse } from "@/lib/api/errors"

/**
 * Request validation schema
 */
const forgotPasswordSchema = z.object({
  email: z.string().email("Valid email required"),
})

/**
 * POST /api/auth/forgot-password
 *
 * Request a password reset link
 *
 * Request body:
 * - email: string - User's email address
 *
 * Response:
 * - success: boolean
 * - message: string
 *
 * Note: Always returns success to prevent email enumeration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = forgotPasswordSchema.parse(body)

    const normalizedEmail = email.toLowerCase()

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    // Always return success to prevent email enumeration
    // But only create token if user exists
    if (user) {
      // Delete any existing reset tokens for this user
      await prisma.verificationToken.deleteMany({
        where: { identifier: normalizedEmail },
      })

      // Generate secure reset token
      const resetToken = crypto.randomBytes(32).toString("hex")
      const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

      // Store reset token
      await prisma.verificationToken.create({
        data: {
          identifier: normalizedEmail,
          token: resetToken,
          expires: resetTokenExpiry,
        },
      })

      // Create email log for password reset email
      await prisma.emailLog.create({
        data: {
          recipientEmail: normalizedEmail,
          templateType: "PASSWORD_RESET",
          status: "PENDING",
          subject: "Reset Your Password - Festival Lights",
          content: JSON.stringify({
            resetUrl: `${process.env.NEXTAUTH_URL}/reset-password/${resetToken}`,
            expiresAt: resetTokenExpiry.toISOString(),
          }),
        },
      })

      console.log(`Password reset token created for ${normalizedEmail}: ${resetToken}`)
    }

    // Always return success to prevent email enumeration
    return successResponse(
      { sent: true },
      "If an account exists with this email, you will receive a password reset link."
    )
  } catch (error) {
    return handleApiError(error)
  }
}
