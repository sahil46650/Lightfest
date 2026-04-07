# E-Commerce Demo Testing Suite

Comprehensive testing suite for the event booking platform, covering booking flows, concurrency, inventory management, email queueing, cleanup operations, and promo codes.

## Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Ensure the application is running:
```bash
npm run dev
```

3. Ensure database is accessible and seeded with test data (at least one published event with available tickets)

## Test Scripts

### 1. Booking Flow Test (`test-booking-flow.ts`)

Tests the complete booking flow from cart initialization to confirmation.

```bash
npm run test:booking-flow
```

**What it tests:**
- Guest checkout flow (no authentication)
- Authenticated user checkout flow (with account creation)
- Cart initialization
- Inventory lock creation and management
- Personal information submission
- Attendee information submission
- Promo code application
- Booking confirmation

**Verifies:**
- Booking record created with correct details
- Tickets created with QR codes
- InventoryLock records deleted after confirmation
- DraftBooking deleted after confirmation
- EmailLog created for confirmation email

**Expected outcome:** All tests pass, demonstrating end-to-end booking functionality

---

### 2. Concurrent Bookings Test (`validate-concurrent-bookings.ts`)

Stress tests the system with parallel booking attempts to validate race condition handling.

```bash
npm run test:concurrent
# or
npm run test:stress
```

**What it tests:**
- 5, 10, and 20 parallel booking attempts
- Inventory race conditions
- Atomic transaction protection
- Promo code concurrent usage limits
- Latency under load

**Verifies:**
- No double-booking occurs
- No negative inventory values
- Inventory consistency maintained
- Some bookings succeed while others fail gracefully with INSUFFICIENT_INVENTORY
- Promo code max usage limits enforced

**Expected outcome:**
- Success rate depends on available inventory
- All failed bookings show proper error messages
- No inventory inconsistencies
- Performance metrics show reasonable latency

---

### 3. Inventory Validation Test (`validate-inventory.ts`)

Comprehensive inventory consistency checks using both Prisma and raw SQL queries.

```bash
npm run test:inventory
```

**What it tests:**
- Inventory equation: `quantityTotal = quantityAvailable + quantitySold + locked`
- Negative inventory detection
- Orphaned InventoryLock records
- Active vs expired locks
- SQL-based consistency verification

**Verifies:**
- All ticket types have consistent inventory
- No negative inventory values exist
- No orphaned locks (locks without draft bookings)
- Inventory calculations are accurate

**Expected outcome:** All consistency checks pass with no errors

---

### 4. Email Queue Validation Test (`validate-email-queue.ts`)

Tests email queueing, retry logic, and status transitions.

```bash
npm run test:email
```

**What it tests:**
- All 5 email template types (BOOKING_CONFIRMATION, EVENT_REMINDER, ABANDONED_CART, PASSWORD_RESET, WELCOME)
- Exponential backoff retry intervals (15, 30, 60 minutes)
- Maximum 3 retry attempts
- Status transitions (PENDING → SENT/FAILED)
- Email log statistics

**Verifies:**
- All template types are supported
- Retry logic follows exponential backoff
- No emails exceed max retry attempts
- Status transitions work correctly
- Booking confirmation emails are queued

**Expected outcome:** Email system configured correctly with proper retry logic

---

### 5. Cleanup Validation Test (`validate-cleanup.ts`)

Tests cleanup of expired records and cascade deletions.

```bash
npm run test:cleanup
```

**What it tests:**
- Cleanup of expired InventoryLock records
- Cleanup of expired DraftBooking records
- Cascade deletion of related records
- Active record preservation
- Idempotency of cleanup operations

**Verifies:**
- Expired locks are deleted
- Expired draft bookings are deleted
- Active records are preserved
- Cascade deletion works (locks deleted when draft booking is deleted)
- No orphaned records remain
- Cleanup can run multiple times safely

**Expected outcome:** All expired records cleaned up, active records preserved

---

### 6. Promo Code Test (`test-promo-codes.ts`)

Comprehensive promo code functionality testing.

```bash
npm run test:promo
```

**What it tests:**
- PERCENTAGE discount type
- FIXED discount type
- Minimum purchase amount constraints
- Maximum usage limits
- Expiry date validation
- Promo code application and removal
- Promo code with complete booking flow
- Edge cases (invalid codes, empty cart, case sensitivity)

**Verifies:**
- Both discount types work correctly
- Constraints are enforced
- Usage count increments on booking confirmation
- Promo codes are linked to bookings
- Invalid/expired codes are rejected

**Expected outcome:** All promo code validations pass

---

## Running All Tests

Run the complete test suite (excluding stress test):

```bash
npm run test:all
```

This runs:
1. Booking flow test
2. Inventory validation
3. Email queue validation
4. Cleanup validation
5. Promo code test

## Test Output

All tests use colored console output:
- ✓ Green: Test passed
- ✗ Red: Test failed
- ⚠ Yellow: Warning
- ℹ Blue: Information

Each test shows:
- Test name
- Pass/fail status
- Execution time in milliseconds
- Summary statistics at the end

## Helper Modules

### `helpers/logger.ts`
Colored console logging functions for clear test output.

Functions:
- `logSection()` - Section headers
- `logSuccess()` - Success messages
- `logError()` - Error messages
- `logWarning()` - Warnings
- `logInfo()` - Information
- `logTest()` - Test results with timing
- `logSummary()` - Test suite summary

### `helpers/api-client.ts`
Centralized API client for making requests to the application.

Functions:
- `initializeCart()` - Initialize a cart
- `updateCart()` - Update cart quantities
- `applyPromoCode()` - Apply promo code
- `submitPersonalInfo()` - Submit personal information
- `submitAttendeeInfo()` - Submit attendee information
- `confirmBooking()` - Confirm booking
- Generic `post()`, `get()`, `del()` methods

### `helpers/database.ts`
Prisma-based database query helpers.

Functions:
- `verifyInventoryConsistency()` - Check inventory equation
- `checkNegativeInventory()` - Find negative values
- `findOrphanedInventoryLocks()` - Find orphaned locks
- `getBookingDetails()` - Get booking with relations
- `getInventoryLocks()` - Get locks for draft booking
- `getEmailLogs()` - Get email logs
- `getPromoCode()` - Get promo code details

## Configuration

### Environment Variables

The tests use the following environment variables:

- `NEXT_PUBLIC_API_URL` - Base URL for API requests (default: http://localhost:3000)
- `DATABASE_URL` - PostgreSQL database connection string

### Test Data Requirements

For tests to run successfully, ensure:

1. At least one published event exists in the database
2. Events have ticket types with available inventory (at least 20 tickets for concurrent tests)
3. Database is accessible and migrations are up to date

## Troubleshooting

### Tests failing due to no events
Seed your database with test events:
```bash
# Create events manually in the admin panel or via seed script
```

### Connection errors
Ensure the application is running:
```bash
npm run dev
```

### Database errors
Verify database connection:
```bash
npx prisma db push
npx prisma studio  # Opens database browser
```

### TypeScript errors
Regenerate Prisma client:
```bash
npx prisma generate
```

## Best Practices

1. Run tests against a test database, not production
2. Run `test:inventory` regularly to catch inconsistencies early
3. Run `test:cleanup` to verify cleanup jobs work correctly
4. Run `test:concurrent` to validate race condition handling
5. Review failed test output carefully - includes error details and stack traces
6. Use `test:all` before deploying to catch regressions

## Contributing

When adding new tests:

1. Create the test file in `/scripts/`
2. Use the helper modules for consistency
3. Follow the existing test structure
4. Add the test script to `package.json`
5. Document what it tests and verifies
6. Include expected outcomes
7. Update this README

## Support

For issues or questions about the testing suite, contact the development team.
