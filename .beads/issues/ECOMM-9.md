---
id: ECOMM-9
title: "Form continue button not working after populating fields"
type: bug
status: closed
priority: 1
created: 2026-01-19
closed: 2026-01-20
---

## Description
After populating the form fields and pressing the "Continue" button, nothing happens. The form doesn't advance to the next step or show any validation errors.

## Steps to Reproduce
1. Navigate to checkout flow
2. Fill in all required form fields
3. Click "Continue" button
4. Expected: Form advances to next step or shows validation errors
5. Actual: Nothing happens

## Technical Investigation
- [x] Check form submission handler
- [x] Verify Zod validation is executing
- [x] Check for silent JavaScript errors
- [x] Verify form state management

## Root Cause
Zod's `.optional()` modifier only skips validation for `undefined`, NOT for empty strings `""`.

The form initialized `password: ''` as a default value, but the schema expected either:
- `undefined` (skip validation)
- A valid 8+ character password

When the form submitted `password: ''`, Zod's `.min(8)` validation failed silently because React Hook Form's `zodResolver` doesn't properly surface errors from refined schemas.

## Fix Applied
Changed the password field schema from:
```typescript
password: z.string().min(8, "Password must be 8+ characters").optional()
```

To:
```typescript
password: z.union([
  z.string().min(8, "Password must be 8+ characters"),
  z.literal('')
]).optional()
```

This explicitly allows empty strings while maintaining proper TypeScript type inference.

## Files Modified
- `lib/validations/checkout.ts` - Base schema used by UI forms
- `features/checkout/schemas/index.ts` - API request schemas

## Verification
Tested in browser - form now successfully advances from Personal Info to Attendee Info step after filling required fields.
