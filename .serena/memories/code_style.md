# Code Style & Conventions

## TypeScript
- Strict mode enabled
- Use `@/*` path aliases for imports
- Prefer interfaces over types for object shapes
- Use enums for fixed sets of values (e.g., `CheckoutStep`, `ErrorCode`)

## Naming Conventions
- **Files**: kebab-case for most files, PascalCase for React components
- **Components**: PascalCase (e.g., `EventCard`, `PersonalInfoForm`)
- **Hooks**: camelCase with `use` prefix (e.g., `useCheckoutStore`, `useEvent`)
- **API keys**: camelCase (e.g., `eventKeys`, `cartKeys`)
- **Constants**: SCREAMING_SNAKE_CASE for true constants

## Component Structure
```typescript
// Feature module barrel export pattern
// features/events/index.ts
export * from './components'
export * from './api'
```

## API Error Handling
Use the `Errors` factory from `lib/api/errors.ts`:
```typescript
import { Errors, handleApiError, successResponse } from '@/lib/api'

if (!booking) throw Errors.bookingNotFound()
return successResponse(data)

// Wrap handlers with try-catch:
try { ... } catch (error) { return handleApiError(error) }
```

## API Response Format
```typescript
// Success
{ success: true, data: T, message?: string }

// Error
{ success: false, error: ErrorCode, message: string, details?: object }
```

## Validation
- Use Zod schemas from `lib/validations/`
- Convert Zod errors to API errors with `fromZodError()`

## State Management
- Zustand for client state (checkout store)
- React Query for server state (events, cart data)
- Zustand store persists to localStorage

## Import Organization
1. React/Next.js imports
2. Third-party libraries
3. Local imports (`@/` aliases)

## Component Imports
Use barrel exports from `components/index.ts`:
```typescript
import { Button, Input, Card, EventCard, Header } from '@/components'
```

## Feature Module Imports
Import from feature root:
```typescript
import { useEvent } from '@/features/events'
```

## React Query Patterns
- Define query keys in `api/keys.ts`
- Queries and mutations in separate files
- Use query factory pattern for consistent keys
