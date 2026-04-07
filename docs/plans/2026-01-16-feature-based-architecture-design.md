# Feature-Based Architecture with TanStack Query

**Date:** 2026-01-16
**Status:** Approved
**Issue:** ECOMM-2

## Overview

Migrate to feature-based architecture using TanStack Query for server state, Zod + React Hook Form for forms, and shadcn/ui components.

## Architecture Layers

```
lib/tscheckout/           # API SERVICE LAYER (exists)
├── client.ts             # HTTP client, auth, raw API calls
├── types.ts              # API response types
├── cart-builder.ts       # Cart construction utilities
└── index.ts

features/                 # FEATURE LAYER (new)
├── events/
│   ├── api/
│   │   ├── queries.ts    # useEvents, useEvent, useTicketTypes
│   │   └── keys.ts       # Query key factory
│   ├── components/
│   │   ├── EventCard.tsx
│   │   ├── EventList.tsx
│   │   └── EventFilters.tsx
│   └── index.ts
│
├── cart/
│   ├── api/
│   │   ├── queries.ts    # useCart
│   │   ├── mutations.ts  # useAddToCart, useRemoveFromCart
│   │   └── keys.ts
│   ├── components/
│   │   └── CartSummary.tsx
│   ├── schemas/
│   │   └── cart.ts
│   └── index.ts
│
└── checkout/
    ├── api/
    │   └── mutations.ts  # useProcessCheckout
    ├── components/
    │   ├── PersonalInfoForm.tsx
    │   ├── AttendeeForm.tsx
    │   └── PaymentForm.tsx
    ├── schemas/
    │   └── checkout.ts
    └── index.ts
```

## Key Decisions

- **TSCheckout = API service** ("How to talk to the API")
- **Features = User capabilities** ("What users can do")
- **TSCheckout is source of truth** for all events data

## TanStack Query Setup

### Provider Configuration

```typescript
// app/providers.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: true,
        retry: 1,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

### Query Key Factory Pattern

```typescript
// features/events/api/keys.ts
export const eventKeys = {
  all: ['events'] as const,
  lists: () => [...eventKeys.all, 'list'] as const,
  list: (filters: EventFilters) => [...eventKeys.lists(), filters] as const,
  details: () => [...eventKeys.all, 'detail'] as const,
  detail: (id: number) => [...eventKeys.details(), id] as const,
  ticketTypes: (eventId: number) => [...eventKeys.detail(eventId), 'tickets'] as const,
}
```

## Query Hooks

```typescript
// features/events/api/queries.ts
import { useQuery } from '@tanstack/react-query'
import { getTSCheckoutClient } from '@/lib/tscheckout'
import { eventKeys } from './keys'
import type { ListEventsParams } from '@/lib/tscheckout'

export function useEvents(filters?: ListEventsParams) {
  return useQuery({
    queryKey: eventKeys.list(filters ?? {}),
    queryFn: () => getTSCheckoutClient().getAvailableEvents(filters),
    staleTime: 10 * 60 * 1000,
  })
}

export function useEvent(id: number) {
  return useQuery({
    queryKey: eventKeys.detail(id),
    queryFn: () => getTSCheckoutClient().getEvent(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  })
}

export function useTicketTypes(eventId: number) {
  return useQuery({
    queryKey: eventKeys.ticketTypes(eventId),
    queryFn: () => getTSCheckoutClient().getTicketTypes(eventId),
    staleTime: 30 * 1000,
    enabled: !!eventId,
  })
}
```

### Cache Time Rationale

| Query | Stale Time | Reason |
|-------|-----------|--------|
| Events list | 10 min | Rarely changes |
| Event detail | 5 min | Might update descriptions |
| Ticket types | 30 sec | Inventory-sensitive |

## Zod Schemas

```typescript
// features/checkout/schemas/checkout.ts
import { z } from 'zod'

export const personalInfoSchema = z.object({
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
})

export const attendeeSchema = z.object({
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  email: z.string().email('Valid email required'),
})

export const checkoutSchema = z.object({
  personalInfo: personalInfoSchema,
  attendees: z.array(attendeeSchema).min(1, 'At least one attendee required'),
  promoCode: z.string().optional(),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: 'Must accept terms' }) }),
})

export type PersonalInfo = z.infer<typeof personalInfoSchema>
export type Attendee = z.infer<typeof attendeeSchema>
export type CheckoutForm = z.infer<typeof checkoutSchema>
```

## shadcn/ui Form Integration

```typescript
// features/checkout/components/PersonalInfoForm.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { personalInfoSchema, type PersonalInfo } from '../schemas/checkout'

interface PersonalInfoFormProps {
  onSubmit: (data: PersonalInfo) => void
  defaultValues?: Partial<PersonalInfo>
}

export function PersonalInfoForm({ onSubmit, defaultValues }: PersonalInfoFormProps) {
  const form = useForm<PersonalInfo>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      ...defaultValues,
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input placeholder="John" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Additional fields follow same pattern */}
        <Button type="submit">Continue</Button>
      </form>
    </Form>
  )
}
```

## Error Handling

```typescript
// features/events/api/queries.ts
import { TSCheckoutError } from '@/lib/tscheckout'

export function useEvents(filters?: ListEventsParams) {
  return useQuery({
    queryKey: eventKeys.list(filters ?? {}),
    queryFn: () => getTSCheckoutClient().getAvailableEvents(filters),
    retry: (failureCount, error) => {
      if (error instanceof TSCheckoutError && error.status === 401) {
        return false
      }
      return failureCount < 2
    },
  })
}
```

## shadcn/ui Components Required

- `form` (wraps react-hook-form)
- `input`
- `button`
- `select`
- `card`
- `skeleton` (loading states)

## Implementation Order

1. Install TanStack Query
2. Set up Providers
3. Add shadcn/ui form components
4. Create `features/events/` structure
5. Build events queries and components
6. Create `features/cart/`
7. Create `features/checkout/`
8. Integrate with existing pages
