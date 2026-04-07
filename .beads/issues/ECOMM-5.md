---
id: ECOMM-5
title: Fix event details page to use ID instead of slug
type: bug
status: closed
priority: high
created: 2026-01-19
updated: 2026-01-19
assignee: ""
labels: [routing, bug-fix]
---

# Fix event details page to use ID instead of slug

## Summary

The event details page (`app/(main)/events/[slug]/`) currently expects a slug/name in the URL parameter, but should use the event ID instead to match the API requirements.

## Problem

- Current behavior: Route expects `/events/summer-music-festival` (slug)
- Expected behavior: `/events/123` (event ID)

The TSCheckout API uses event IDs for lookups, so the page needs to accept and use the ID parameter.

## Acceptance Criteria

- [x] Rename route folder from `[slug]` to `[id]` for clarity
- [x] Event details page should fetch event by ID
- [x] Links to event details throughout the app should use event ID
- [x] Handle case where ID is not found (404 page)

## Related Files

- `app/(main)/events/[id]/page.tsx` - Event details page (renamed from `[slug]`)
- `app/(main)/events/events-client.tsx` - Events listing with links
- `components/landing/event-slider.tsx` - Landing page event cards
- `lib/tscheckout/client.ts` - API client

## Resolution

Fixed on 2026-01-19:
- Renamed route folder from `[slug]` to `[id]`
- Page uses `useEvent(eventId)` hook to fetch by ID
- All links throughout the app use `event.id` for URLs
- 404 handling implemented with "Event Not Found" UI
- Build verified successful
