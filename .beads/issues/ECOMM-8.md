---
id: ECOMM-8
title: Integrate TSCheckout Shopping Cart API
type: task
status: done
priority: high
created: 2026-01-19
updated: 2026-01-19
closed: 2026-01-19
assignee: claude
labels: [api, cart, checkout, integration]
---

# Integrate TSCheckout Shopping Cart API

## Summary

Wire up the "Proceed to Checkout" button in the event detail page to use the TSCheckout Shopping Cart API instead of only storing data in sessionStorage.

## Problem

The current checkout flow in `app/(main)/events/[id]/page.tsx` doesn't call any API when users proceed to checkout. It only stores cart data in sessionStorage, which means:
- No server-side cart persistence
- No inventory validation before checkout
- Cart data lost on browser close

## Solution

Integrate the TSCheckout Shopping Cart API endpoints:
- `POST /api/v1/shopping-cart/save` - Save cart with ticket selections
- `GET /api/v1/shopping-cart?cartId=` - Retrieve cart details
- `POST /api/v1/shopping-cart/delete` - Delete cart

## Tasks

- [x] Add shopping cart types to `lib/tscheckout/types.ts`
- [x] Add shopping cart methods to `TSCheckoutClient`
- [x] Create shopping cart mutation hooks for React Query
- [x] Update event detail page to call saveCart API on checkout
- [x] Generate unique cartId for each session
- [x] Remove Prisma references from checkout flow
- [x] Test the complete checkout flow

## Completion Notes

All tasks completed. The checkout flow now:
1. Saves cart to TSCheckout API via `useSaveCart` mutation
2. Populates Zustand store for checkout UI rendering
3. Navigates to checkout page with cart data visible

Key files modified:
- `lib/tscheckout/client.ts` - Added shopping cart API methods
- `lib/tscheckout/types.ts` - Added shopping cart types
- `features/cart/api/mutations.ts` - Created React Query mutation hooks
- `app/(main)/events/[id]/page.tsx` - Integrated cart API and Zustand store sync

## API Payload Reference

```typescript
// Save Cart
POST /api/v1/shopping-cart/save
{
  cartId: string,
  ticketTypes: [{ typeId: number, quantity: number, waveTimeId?: number }]
}

// Get Cart
GET /api/v1/shopping-cart?cartId={cartId}

// Delete Cart
POST /api/v1/shopping-cart/delete
{ cartId: string }
```

## Related Issues

- ECOMM-1: TSCheckout API Integration Service (dependency - completed)
