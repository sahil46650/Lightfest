import { z } from "zod"

/**
 * Password validation regex patterns
 */
const PASSWORD_MIN_LENGTH = 8
const HAS_UPPERCASE = /[A-Z]/
const HAS_LOWERCASE = /[a-z]/
const HAS_NUMBER = /\d/
const HAS_SPECIAL = /[!@#$%^&*(),.?":{}|<>]/

/**
 * Password strength validation
 */
export const passwordSchema = z.string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .refine((val) => HAS_UPPERCASE.test(val), {
    message: "Password must contain at least one uppercase letter",
  })
  .refine((val) => HAS_LOWERCASE.test(val), {
    message: "Password must contain at least one lowercase letter",
  })
  .refine((val) => HAS_NUMBER.test(val), {
    message: "Password must contain at least one number",
  })
  .refine((val) => HAS_SPECIAL.test(val), {
    message: "Password must contain at least one special character (!@#$%^&*)",
  })

/**
 * Login form schema
 */
export const loginSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
})

/**
 * Registration form schema
 */
export const registerSchema = z.object({
  email: z.string().email("Valid email required"),
  password: passwordSchema,
  confirmPassword: z.string().min(1, "Please confirm your password"),
  fullName: z.string().min(1, "Full name is required").max(100, "Name too long"),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

/**
 * Forgot password (request reset) schema
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email("Valid email required"),
})

/**
 * Reset password schema
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: passwordSchema,
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

/**
 * Change password (while logged in) schema
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
  confirmNewPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Passwords do not match",
  path: ["confirmNewPassword"],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "New password must be different from current password",
  path: ["newPassword"],
})

/**
 * Profile update schema
 */
export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long").optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Valid phone required").optional().or(z.literal("")),
  image: z.string().url("Invalid image URL").optional().or(z.literal("")),
})

/**
 * Password strength checker utility
 */
export interface PasswordStrength {
  score: number // 0-5
  label: "Weak" | "Fair" | "Good" | "Strong" | "Very Strong"
  checks: {
    length: boolean
    uppercase: boolean
    lowercase: boolean
    number: boolean
    special: boolean
  }
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const checks = {
    length: password.length >= PASSWORD_MIN_LENGTH,
    uppercase: HAS_UPPERCASE.test(password),
    lowercase: HAS_LOWERCASE.test(password),
    number: HAS_NUMBER.test(password),
    special: HAS_SPECIAL.test(password),
  }

  const score = Object.values(checks).filter(Boolean).length

  const labels: Record<number, PasswordStrength["label"]> = {
    0: "Weak",
    1: "Weak",
    2: "Fair",
    3: "Good",
    4: "Strong",
    5: "Very Strong",
  }

  return {
    score,
    label: labels[score],
    checks,
  }
}

// Export types
export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>
