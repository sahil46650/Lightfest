---
id: ECOMM-4
title: UI/UX Fixes and Events Page Improvements
type: bug
status: closed
priority: high
created: 2026-01-19
updated: 2026-01-19
closed: 2026-01-19
assignee: claude
labels: [ui, events, tanstack-query, layout]
depends_on: [ECOMM-2]
---

# UI/UX Fixes and Events Page Improvements

## Summary

Fix various UI issues including header overlap on pages, events page not displaying events, and improve the homepage event cards to enable direct checkout.

## Issues to Fix

### 1. Header Overlap on Pages ✅ (Partial)

The floating header (`fixed top-6`) overlaps page content. Pages need sufficient top padding.

**Fixed:**
- [x] Checkout page (`app/(main)/checkout/[bookingId]/page.tsx`) - Changed `py-12` to `pt-28 pb-12`

**Remaining:**
- [ ] Events page (`app/(main)/events/`) - Header still blocking content
- [ ] Event detail page (`app/(main)/events/[slug]/page.tsx`) - Needs top padding

### 2. Events Page Not Showing Events ✅

The events page was using SSR to fetch from `/api/events` which failed when TSCheckout API was inaccessible.

**Completed Changes:**
- [x] Convert events page to use TanStack Query (client-side) instead of SSR
- [x] Use `useAvailableEvents` hook from `features/events/api/`
- [x] Show fallback events or loading skeleton on error
- [x] Match the pattern used in `FeaturedEventsSection`

**Implementation Notes:**
- `page.tsx` now wraps `EventsClient` in Suspense with skeleton loading
- `events-client.tsx` uses `useAvailableEvents()` hook for data fetching
- Client-side sorting implemented for fields TSCheckout API doesn't support (location, availability)
- URL-based state management for sorting and pagination preserved

**Why TanStack Query:**
- Better error handling and retry logic
- Caching prevents redundant requests
- Consistent with rest of codebase
- TSCheckout API doesn't need SEO indexing

### 3. Event Detail Page 404 ✅

Created the dynamic route for individual event pages.

- [x] Create `app/(main)/events/[slug]/page.tsx`
- [x] Fetch event by slug using TanStack Query
- [x] Display event details with ticket selection

### 4. Homepage Event Cards ✅

**Fixed:**
- [x] Removed "Join Waitlist" button - now always shows "Get Tickets"
- [x] Replaced "Location TBD" with event name in `features/events/utils.ts`

**Remaining:**
- [ ] Enable ticket selection directly from homepage cards (opens modal or navigates to event detail)

## Technical Notes

### Header Height Calculation

The floating header requires content offset:
- Header position: `fixed top-6` (24px from top)
- Header height: ~64px (py-3 padding + content)
- **Required top padding: `pt-28` (112px) minimum**

### TanStack Query Pattern

Use this pattern for events pages (from `FeaturedEventsSection`):

```typescript
import { useAvailableEvents } from '@/features/events/api';

function EventsPage() {
  const { data, isLoading, isError } = useAvailableEvents({
    _limit: 20,
    _include: 'sold',
  });

  if (isLoading) return <LoadingSkeleton />;
  if (isError) return <FallbackEvents />;

  return <EventGrid events={data.data} />;
}
```

## Files to Modify

### Events Page Refactor
- `app/(main)/events/page.tsx` - Remove SSR, make client component
- `app/(main)/events/events-client.tsx` - Integrate TanStack Query

### Header Padding Fixes
- `app/(main)/events/page.tsx` - Add `pt-28` padding
- `app/(main)/events/[slug]/page.tsx` - Add `pt-28` padding

## Acceptance Criteria

- [x] Events page loads and displays events using TanStack Query
- [x] Event detail page (`/events/[slug]`) loads without 404
- [x] Homepage event cards show "Get Tickets" (not waitlist)
- [x] Location shows event name instead of "TBD"
- [x] Graceful fallback when TSCheckout API is unavailable

**Note:** Header overlap fix moved to separate issue.

## Resume Instructions

To continue this work:

1. **Fix remaining header overlap issues:**
   - Events page already has `pt-28` in the container
   - Check event detail page (`app/(main)/events/[slug]/page.tsx`) for header padding

2. ~~**Convert events page to TanStack Query:**~~ ✅ COMPLETED
   - `events-client.tsx` now uses `useAvailableEvents()` hook
   - No SSR fetching - pure client-side React Query
   - Removed `/api/events` dependency for main listing

3. **Test the flow:** ✅ VERIFIED
   - Navigate to `/events` - shows events from TSCheckout API
   - Click event card - goes to `/events/[slug]`
   - Event detail page loads with ticket info
