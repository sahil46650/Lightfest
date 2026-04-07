---
id: ECOMM-1
title: TSCheckout API Integration Service
type: feature
status: closed
priority: high
created: 2026-01-16
updated: 2026-01-19
assignee: claude
labels: [api, integration, typescript]
---

# TSCheckout API Integration Service

## Summary

Created a TypeScript service to integrate with the TSCheckout **v1 API** (`https://clevergroup.tscheckout.com/api/v1`) for fetching events and managing cart operations.

## Completed Work

### 1. API Documentation Analysis
- Fetched and analyzed the OpenAPI spec from `/api/v1/docs.json`
- Documented all relevant endpoints for events, ticket types, and cart operations
- Created reference documentation at `references/tscheckout-api-reference.md`

### 2. TypeScript Types (`lib/tscheckout/types.ts`)
- Authentication types (LoginRequest, LoginResponse) with v1 credentials format
- Event types (TSEvent, EventInventory, ListEventsParams)
- Ticket type definitions (TicketType, Question, Answer)
- Cart types (CreateOrderTicket, BasicInfo, CartPromoCode, etc.)
- Order types (Order, Ticket, Transaction)
- API response types updated for v1 format:
  - `ListResponse<T>` with `success`, `message`, string `totalCount`/`limit`
  - `SingleResponse<T>` with `success`, `message` wrapper
- Custom error class (TSCheckoutError)

### 3. Client Service (`lib/tscheckout/client.ts`)
- `TSCheckoutClient` class with full API coverage
- **v1 API Authentication**: `/tokens` endpoint with `userName`, `password`, `publicKey`, `publicKeySlug`
- **Public/Authenticated Endpoints**:
  - `/public-events` for unauthenticated, `/events` for authenticated
  - `/events/{id}/public-ticket-types` for unauthenticated, `/events/{id}/ticket-types` for authenticated
- **Parameter Transformation**: Strips underscore prefix (`_limit` → `limit`, `_include` → `include`)
- Event methods: `listEvents()`, `getEvent()`, `getAvailableEvents()`, `searchEvents()`
- Ticket methods: `getTicketTypes()`, `getWaveTimes()`
- Cart methods: `buildCartItems()`, `processCart()`, `rebuildCartFromOrder()`
- Inventory helpers: `getAnswerSold()`, `getAnswerRemaining()`
- Factory functions: `createTSCheckoutClient()`, `getTSCheckoutClient()`

### 4. Cart Builder (`lib/tscheckout/cart-builder.ts`)
- Fluent `CartBuilder` class for ergonomic cart construction
- `TicketBuilder` for building individual tickets
- Helper functions: `createCart()`, `createTicket()`, `quickCart()`

### 5. Clean Exports (`lib/tscheckout/index.ts`)
- Organized exports for all types and functions
- Documentation with usage examples

## Files Created/Updated

```
lib/tscheckout/
├── index.ts        # Main exports with documentation
├── types.ts        # All TypeScript types (v1 format)
├── client.ts       # API client service (v1 endpoints)
└── cart-builder.ts # Fluent cart builder
```

## Environment Variables Required

```bash
NEXT_PUBLIC_TS_API_URL="https://clevergroup.tscheckout.com"
NEXT_PUBLIC_TS_USERNAME="your-username"
NEXT_PUBLIC_TS_PASSWORD="your-password"
NEXT_PUBLIC_TS_PUBLIC_KEY="your-public-key"
NEXT_PUBLIC_TS_PUBLIC_KEY_SLUG="your-key-slug"
```

## v1 API Migration Notes

Key differences from v2 API:
- Authentication uses `/tokens` endpoint (not `/administrator/login`)
- Credentials include `publicKey` and `publicKeySlug` fields
- Event endpoints are plural: `/events` not `/event`
- Public endpoints available: `/public-events`, `/public-ticket-types`
- Query params without underscore: `limit` not `_limit`
- Response format includes `success` and `message` wrapper fields
- `totalCount` and `limit` may be strings in response

## Verification

✅ API call to `/public-events?limit=6&include=sold&status=availableonline` returns 200
✅ FeaturedEventsSection displays real events from TSCheckout
✅ TanStack Query integration working
✅ Build passes without errors

## Usage Example

```typescript
import { getTSCheckoutClient, createCart, createTicket } from '@/lib/tscheckout';

const client = getTSCheckoutClient();

// Fetch events (uses public endpoint if no auth)
const events = await client.getAvailableEvents({ _limit: 10 });

// Get ticket types
const ticketTypes = await client.getTicketTypes(events.data[0].id);

// Build cart
const cart = createCart()
  .customer('John', 'Doe', 'john@example.com')
  .addTicket(
    createTicket(ticketTypes.data[0].id)
      .attendee('John', 'Doe')
      .email('john@example.com')
      .build()
  )
  .promoCode('SAVE10')
  .buildRequest();

// Calculate pricing
const cartItems = await client.buildCartItems(cart);
```
