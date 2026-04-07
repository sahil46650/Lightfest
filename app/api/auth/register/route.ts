import { NextRequest } from "next/server"
import { z } from "zod"
import bcrypt from "bcrypt"
import { prisma } from "@/lib/prisma"
import { handleApiError, successResponse, Errors } from "@/lib/api/errors"
import { passwordSchema } from "@/lib/validations/auth"

/**
 * Request validation schema
 */
const registerSchema = z.object({
  email: z.string().email("Valid email required"),
  password: passwordSchema,
  fullName: z.string().min(1, "Full name is required").max(100),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
})

/**
 * POST /api/auth/register
 *
 * Register a new user account
 *
 * Request body:
 * - email: string - User's email address
 * - password: string - Password (8+ chars, strong requirements)
 * - fullName: string - User's full name
 * - acceptTerms: boolean - Must be true
 *
 * Response:
 * - success: boolean
 * - message: string
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, fullName, acceptTerms } = registerSchema.parse(body)

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      throw Errors.alreadyExists("An account with this email")
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name: fullName,
        emailVerified: null, // Can implement email verification later
      },
    })

    // Create email log for welcome email
    await prisma.emailLog.create({
      data: {
        recipientEmail: user.email!,
        templateType: "WELCOME",
        status: "PENDING",
        subject: "Welcome to Festival Lights!",
      },
    })

    return successResponse(
      { userId: user.id },
      "Account created successfully! Please sign in."
    )
  } catch (error) {
    return handleApiError(error)
  }
}
