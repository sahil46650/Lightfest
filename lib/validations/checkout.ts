import { z } from "zod"

/**
 * Personal info schema for checkout forms.
 *
 * Note: countryCode and createAccount are required (not using .default())
 * so that React Hook Form types match. Forms should provide default values.
 */
export const personalInfoSchema = z.object({
  email: z.string().email("Valid email required"),
  firstName: z.string().min(1, "First name required").max(50),
  lastName: z.string().min(1, "Last name required").max(50),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Valid phone required"),
  countryCode: z.string(),
  createAccount: z.boolean(),
  // Allow empty string (form default) OR valid password (8+ chars)
  // .optional() handles undefined, union handles '' vs valid password
  password: z.union([
    z.string().min(8, "Password must be 8+ characters"),
    z.literal('')
  ]).optional(),
}).refine(
  data => !data.createAccount || data.password,
  { message: "Password required when creating account", path: ["password"] }
)

export const attendeeInfoSchema = z.object({
  name: z.string().min(1, "Name required").max(100),
  email: z.string().email("Valid email required"),
  addOns: z.array(z.object({
    name: z.string(),
    price: z.number()
  })).optional()
})

export const promoCodeSchema = z.object({
  code: z.string().min(1, "Promo code required")
})

export type PersonalInfo = z.infer<typeof personalInfoSchema>
export type AttendeeInfo = z.infer<typeof attendeeInfoSchema>
export type PromoCode = z.infer<typeof promoCodeSchema>
