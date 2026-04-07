# Project Overview: Festival Lights

## Purpose
Festival Lights is an event booking platform that allows users to browse events, select tickets, and complete purchases through a multi-step checkout flow. The application features inventory management with locking, promo codes, QR ticket generation, and transactional emails.

## Tech Stack
- **Framework**: Next.js 15 with App Router
- **React**: React 19
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL via Prisma ORM
- **Authentication**: NextAuth v4 with Prisma adapter
- **State Management**: Zustand (with localStorage persistence)
- **Server State**: TanStack React Query v5
- **Styling**: Tailwind CSS 3.4
- **UI Components**: Radix UI primitives
- **Form Handling**: React Hook Form with Zod validation
- **Email**: Resend with React Email templates
- **Payments**: TSCheckout API (commerce backend) + PayVia iframe (payment processing)

## Architecture

### App Router Structure (Route Groups)
- `app/(main)/` - Public routes with main layout (events, checkout, account)
- `app/(auth)/` - Authentication routes (login, register, password reset)
- `app/(admin)/` - Admin dashboard (requires ADMIN/SUPER_ADMIN role)
- `app/api/` - API routes

### Feature Modules (`features/`)
Domain-driven modules with co-located queries, mutations, components, and hooks:
- `features/events/` - Event listing and details
- `features/checkout/` - Checkout forms and payment integration
- `features/cart/` - Cart management

### Key Directories
- `components/` - Shared UI components (layout, events, checkout, ui)
- `lib/` - Utilities: prisma, api errors, payvia, validations, tscheckout, email
- `store/` - Zustand stores (checkout state)
- `prisma/` - Database schema and migrations

### TSCheckout API Integration
TSCheckout handles all commerce operations:
- Events: listings, details, ticket types, availability
- Cart: add/remove items, inventory validation
- Checkout: order creation, promo codes

PayVia iframe is used ONLY for payment processing after TSCheckout creates an order.

### Database Models (Prisma)
Core entities: User, Event, TicketType, Ticket, Booking, DraftBooking, InventoryLock, PromoCode

Key patterns:
- `DraftBooking` holds checkout state during multi-step flow
- `InventoryLock` temporarily reserves tickets (15-min expiry)
- `Booking` is the final confirmed order

## Design System
- Primary color: `#cd2bee` (magenta)
- Font: Plus Jakarta Sans
- Border radius: 1rem default
- Service fee: 37% of subtotal
