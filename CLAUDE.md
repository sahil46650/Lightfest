# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Festival Lights is an event booking platform built with Next.js 15, React 19, and TypeScript. It features multi-step checkout with inventory locking, promo codes, QR ticket generation, and transactional emails.

## Commands

```bash
# Development
npm run dev                    # Start dev server at localhost:3000

# Type Checking
npx tsc --noEmit               # Type check without building (use this during dev)

# Build & Production
npm run build                  # Production build (avoid while dev server runs)
npm start                      # Start production server
npm run lint                   # ESLint check

# Database
npx prisma migrate dev         # Run migrations in development
npx prisma db push             # Push schema changes (no migration)
npx prisma db seed             # Seed database
npx prisma studio              # Open Prisma Studio GUI

# Testing (custom test scripts)
npm run test:booking-flow      # End-to-end booking flow
npm run test:inventory         # Inventory management
npm run test:promo             # Promo code functionality
npm run test:all               # Run all tests
```

## TSCheckout API Integration (IMPORTANT)

**Always use the TSCheckout API for handling events, cart, and checkout flow.** This is the primary backend for all commerce operations.

### TSCheckout API Responsibilities
- **Events**: Fetch event listings, event details, ticket types, availability
- **Cart**: Add/remove items, cart management, inventory validation
- **Checkout**: Create orders, apply promo codes, validate checkout data
- **Orders**: Order creation, order status, order history

### Payment Flow
The **Payvia iframe embed** is used **only for payment processing**:
1. TSCheckout API creates an order and returns an `orderId`
2. The Payvia iframe is initialized with the `orderId` reference
3. User completes payment within the Payvia iframe
4. Payvia webhook notifies TSCheckout of payment status
5. TSCheckout finalizes the order and triggers ticket generation

### Integration Pattern
```typescript
// 1. Use TSCheckout for order creation
const order = await tsCheckoutApi.createOrder({
  items: cartItems,
  customerInfo: personalInfo,
  promoCode: appliedPromo
})

// 2. Pass order reference to Payvia iframe
<PayviaEmbed orderId={order.id} amount={order.total} />

// 3. Handle payment completion callback
onPaymentComplete={(paymentId) => {
  // TSCheckout webhook handles order finalization
  redirectToConfirmation(order.id)
})
```

### TSCheckout Client Location
- Client configuration: `lib/tscheckout/`
- API types: `lib/tscheckout/types.ts`
- React Query hooks: `lib/query/` or feature modules

**Do NOT implement custom cart/checkout logic that bypasses TSCheckout API.**

## Architecture

### Route Groups (App Router)
- `app/(main)/` - Public routes with main layout (events, checkout, account)
- `app/(auth)/` - Authentication routes (login, register, password reset)
- `app/(admin)/` - Admin dashboard (requires ADMIN/SUPER_ADMIN role)
- `app/api/` - API routes

### Feature Modules
The `features/` directory contains domain-driven modules with co-located API queries, mutations, components, and hooks:
```
features/
├── events/          # Event listing, queries
├── checkout/        # Checkout forms, payment integration
└── cart/            # Cart management
```

Each feature exports via barrel files. Import from feature root: `import { useEvent } from '@/features/events'`

### Key Directories
- `components/` - Shared UI components (layout, events, checkout, ui)
- `lib/` - Utilities: `prisma.ts`, `api/errors.ts`, `payvia/`, `validations/`
- `store/` - Zustand stores (checkout state with localStorage persistence)

### State Management
**Zustand store** (`store/useCheckoutStore.ts`) manages checkout flow:
- Cart items, personal info, attendees
- Computed values: `subtotal()`, `discount()`, `serviceFee()`, `total()`
- Persists to localStorage via `zustand/middleware`

### Error Handling Pattern
Use the `Errors` factory from `lib/api/errors.ts`:
```typescript
import { Errors, handleApiError, successResponse } from '@/lib/api'

// In API routes:
if (!booking) throw Errors.bookingNotFound()
return successResponse(data)

// Wrap handlers with:
try { ... } catch (error) { return handleApiError(error) }
```

Error codes are typed via `ErrorCode` enum. Zod errors auto-convert via `fromZodError()`.

### Database Models (Prisma)
Core models: `User`, `Event`, `TicketType`, `Ticket`, `Booking`, `DraftBooking`, `InventoryLock`, `PromoCode`

Key patterns:
- `DraftBooking` holds checkout state server-side during multi-step flow
- `InventoryLock` temporarily reserves tickets (15-min expiry)
- `Booking` is the final confirmed order with `BookingGuest` entries

### Middleware
`middleware.ts` handles route protection:
- `/account/*` - Requires authentication
- `/admin/*` - Requires ADMIN or SUPER_ADMIN role
- Auth routes redirect authenticated users to `/account`

## Code Patterns

### API Response Format
All API routes return consistent structure:
```typescript
// Success
{ success: true, data: T, message?: string }

// Error
{ success: false, error: ErrorCode, message: string, details?: object }
```

### Validation
Use Zod schemas from `lib/validations/`. Convert errors with `fromZodError()`.

### Component Imports
Shared components are exported from `components/index.ts`:
```typescript
import { Button, Input, Card, EventCard, Header } from '@/components'
```

### React Query
Feature modules define query keys in `api/keys.ts` and queries/mutations in separate files. Use React Query for server state.

## Environment Variables

```
DATABASE_URL          # PostgreSQL connection string
NEXTAUTH_URL          # Base URL for NextAuth
NEXTAUTH_SECRET       # JWT signing secret
RESEND_API_KEY        # Email service (Resend)

# TSCheckout API (primary commerce backend)
TSCHECKOUT_API_URL    # TSCheckout API base URL
TSCHECKOUT_API_KEY    # TSCheckout API authentication key

# Payvia (payment iframe only)
PAYVIA_API_KEY        # Payment gateway API key
PAYVIA_EMBED_URL      # Payvia iframe embed URL
```

## Design System

- **Primary color**: `#cd2bee` (magenta)
- **Font**: Plus Jakarta Sans
- **Border radius**: 1rem default
- **Service fee**: 37% of subtotal (configured in checkout store)
