---
id: ECOMM-10
title: "Migrate TSCheckout client to v2 API - events endpoints"
type: task
status: closed
priority: 2
created: 2026-01-20
closed: 2026-01-20
---

## Description
Migrate the TSCheckout API client from v1 to v2 endpoints for events, event details, and ticket-types operations.

## Changes Made

### Authentication
- Changed from v1 `/tokens` endpoint to v2 `/administrator/login`
- Simplified credentials: now only requires `login` (email) and `password`
- Removed `publicKey` and `publicKeySlug` requirements for v2 auth

### Endpoints Updated
| Operation | v1 Path | v2 Path |
|-----------|---------|---------|
| Login | `/api/v1/tokens` | `/api/v2/administrator/login` |
| List Events | `/api/v1/events` | `/api/v2/event` |
| Get Event | `/api/v1/events/{id}` | `/api/v2/event/{id}` |
| Ticket Types | `/api/v1/events/{id}/ticket-types` | `/api/v2/event/{id}/ticket-type` |
| Wave Times | `/api/v1/events/{id}/wave-times` | `/api/v2/event/{id}/wave-times` |

### Response Format Changes
- v2 responses no longer include `success` and `message` fields
- v2 list responses: `{ data, count, totalCount, limit, offset }`
- v2 single responses: `{ data, count }`
- v2 login response: `{ count, data: { token } }`

### Type Updates
- Added v2-specific types: `V2LoginApiResponse`, `V2Venue`, `V2VenueAddress`, `V2Payee`, etc.
- Updated `TSEvent` with additional v2 fields: `featured`, `onSale`, `eventType`, `payee`, `show`, etc.
- Updated `TicketType` with v2 fields: `quantityLimits`, `fee1`, `fee2`, `vat`, etc.

### Query Parameter Limitation
Removed filter query parameters from `listEvents()` - only `_limit` and `_offset` are passed to avoid server errors with other filter params.

## Files Modified
- `lib/tscheckout/types.ts` - Updated types for v2 API
- `lib/tscheckout/client.ts` - Updated endpoints and auth flow

## Testing
Verified endpoints work via curl:
```bash
# Login
curl -X POST "https://clevergroup.tscheckout.com/api/v2/administrator/login" \
  -H "Content-Type: application/json" \
  -d '{"login": "user@example.com", "password": "***"}'

# List Events
curl "https://clevergroup.tscheckout.com/api/v2/event?_limit=2" \
  -H "Authorization: Bearer <token>"

# Get Event
curl "https://clevergroup.tscheckout.com/api/v2/event/1" \
  -H "Authorization: Bearer <token>"

# Ticket Types
curl "https://clevergroup.tscheckout.com/api/v2/event/1/ticket-type" \
  -H "Authorization: Bearer <token>"
```
