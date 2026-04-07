---
id: ECOMM-2
title: Feature-Based Architecture Migration with TanStack Query
type: feature
status: completed
priority: high
created: 2026-01-16
updated: 2026-01-19
assignee: claude
labels: [architecture, tanstack-query, react-hook-form, zod]
depends_on: [ECOMM-1]
---

# Feature-Based Architecture Migration with TanStack Query

## Summary

Migrate the TSCheckout integration to a feature-based architecture using TanStack Query for data fetching and Zod + React Hook Form for form validation. This establishes the pattern for future feature development.

## Scope

**Gradual Migration Approach:**
- New TSCheckout features use feature-based architecture
- Existing code remains intact until touched
- Establishes patterns for future migrations

## Technical Stack

- **Data Fetching**: TanStack Query (React Query v5)
- **Form Validation**: Zod + React Hook Form (already installed)
- **State Management**: Zustand for client state, TanStack Query for server state

## Implemented Structure

```
features/
├── events/
│   ├── api/
│   │   ├── index.ts           # Query hooks exports
│   │   └── queries.ts         # useAvailableEvents, useEvent hooks
│   ├── components/
│   │   ├── index.ts           # Component exports
│   │   └── FeaturedEventsSection.tsx  # Client component with TanStack Query
│   ├── utils/
│   │   └── index.ts           # formatEventDate, formatEventLocation, getEventUrl
│   └── index.ts               # Feature public exports
└── checkout/                  # Planned
    ├── api/
    ├── components/
    ├── schemas/               # Zod validation
    └── hooks/
```

## Completed Tasks

- [x] Install TanStack Query
- [x] Set up QueryClient provider in `components/providers.tsx`
- [x] Design feature folder structure (`features/events/`, `features/checkout/`, `features/cart/`)
- [x] Build TanStack Query hooks (`useAvailableEvents`, `useEvent`, `useTicketTypes`)
- [x] Create FeaturedEventsSection component with TanStack Query
- [x] Integrate with landing page (real events from API)
- [x] Add loading skeleton component
- [x] Document the feature-based pattern
- [x] Create Zod schemas for checkout forms (`features/checkout/schemas/`)
- [x] Create checkout forms with React Hook Form + Zod (PersonalInfoForm, AttendeeForm)
- [x] Build ticket selection modal component (`components/checkout/ticket-selection-modal.tsx`)
- [x] Create checkout mutations (`useSavePersonalInfo`, `useSaveAttendees`, `useProcessPayment`)
- [x] Create TSCheckout cart mutations (`useBuildCartItems`, `useProcessCart`)
- [x] Create checkout API routes (`/api/checkout/personal`, `/api/checkout/attendees`)

## Remaining Tasks

- [x] Create TicketSelector component that uses `useTicketTypes` hook (connect modal to TSCheckout)
- [x] Create payment API route with TSCheckout cart processing
- [x] Add error boundary component for checkout flow
- [x] Add retry logic to TanStack Query hooks

## Implementation Details

### Query Hooks (`features/events/api/queries.ts`)

```typescript
export function useAvailableEvents(params?: Omit<ListEventsParams, 'status'>) {
  return useQuery({
    queryKey: ['events', 'available', params],
    queryFn: async () => {
      const client = getTSCheckoutClient();
      return client.getAvailableEvents(params);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### FeaturedEventsSection Component

- Client component (`'use client'`)
- Uses `useAvailableEvents` hook for data fetching
- Transforms TSCheckout events to EventSlider format
- Shows loading skeleton during fetch
- Falls back to static events on error

### Utility Functions

- `formatEventDate(timestamp)` - Formats Unix timestamp to readable date
- `formatEventLocation(event)` - Extracts location from venue/address
- `getEventUrl(event)` - Generates event detail page URL

## Dependencies

- ECOMM-1: TSCheckout API Integration Service ✅ (completed)

## Acceptance Criteria

- [x] TanStack Query properly configured with caching (5 min staleTime)
- [x] Forms validate with Zod schemas (PersonalInfoForm, AttendeeForm)
- [x] Feature folder is self-contained and well-organized
- [x] Pattern documented for future features
- [x] Retry logic with exponential backoff for transient errors
- [x] Error boundaries provide graceful failure handling

## Verification

✅ FeaturedEventsSection fetches events via TanStack Query
✅ Network request shows proper caching behavior
✅ Loading skeleton displays during fetch
✅ Real "Testing Event" from TSCheckout API displayed
✅ TicketSelector component fetches ticket types via useTicketTypes hook
✅ Payment API route integrates with TSCheckout cart processing
✅ CheckoutErrorBoundary provides graceful error handling with reset capability
✅ Retry logic configured: 3 retries for queries, 1 retry for mutations
✅ Exponential backoff with jitter prevents thundering herd
✅ 4xx errors not retried (client errors indicate bad input)
✅ TypeScript types properly propagate through query hooks
