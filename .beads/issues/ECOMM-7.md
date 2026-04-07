---
id: ECOMM-7
title: Fix currency formatting for TSCheckout API prices
type: bug
status: closed
priority: high
created: 2026-01-19
updated: 2026-01-19
assignee: claude
labels: [bug-fix, currency, api]
---

## Summary

Fixed incorrect currency formatting throughout the application. The TSCheckout API returns prices in **dollars** (e.g., `price: 1` = $1.00), but several components were incorrectly treating these values as cents and dividing by 100, resulting in prices being displayed 100x lower than they should be.

## Problem

- Ticket prices displayed as $0.01 instead of $1.00
- `formatCentsAsDollars()` utility was being used for API data that was already in dollars
- Event detail page had explicit `/100` divisions on prices

## Solution

1. Created `formatDollars()` utility in `lib/utils.ts` for values already in dollars
2. Replaced all `formatCentsAsDollars()` calls with `formatDollars()` for TSCheckout API data
3. Removed explicit `/100` divisions in event detail page

## Files Modified

- `lib/utils.ts` - Added `formatDollars()` utility function
- `app/(main)/events/[id]/page.tsx` - Removed `/100` divisions, use `formatDollars`
- `components/checkout/ticket-selection-modal.tsx` - Changed to use `formatDollars`
- `components/checkout/order-summary.tsx` - Already using `formatDollars` (verified)

## Verification

- Grep confirmed no remaining `formatCentsAsDollars` usage for API data
- The utility definition still exists in `lib/utils.ts` for any future cents-based data

## Notes

- `formatCentsAsDollars()` remains available for any data actually stored in cents (e.g., internal database values)
- `formatDollars()` should be used for all TSCheckout API responses
