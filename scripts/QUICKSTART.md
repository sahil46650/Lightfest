# Testing Suite Quick Start Guide

Get started with the e-commerce testing suite in 5 minutes.

## Step 1: Install Dependencies

```bash
npm install
```

This installs `ts-node` and other required dependencies.

## Step 2: Start the Application

```bash
npm run dev
```

Wait for the application to start on http://localhost:3000

## Step 3: Run Your First Test

Open a new terminal and run:

```bash
npm run test:inventory
```

This runs the inventory validation test which checks:
- Inventory consistency
- No negative values
- No orphaned locks

Expected output:
```
════════════════════════════════════════════════════════════════════════════════
  Inventory Validation Suite
════════════════════════════════════════════════════════════════════════════════

✓ Verify inventory equation consistency (45ms) - PASS
✓ Check for negative inventory values (12ms) - PASS
✓ Check for orphaned inventory locks (8ms) - PASS

────────────────────────────────────────────────────────────────────────────────
  Test Summary
────────────────────────────────────────────────────────────────────────────────
  Total Tests:  3
  Passed:       3
  Failed:       0
  Pass Rate:    100.0%
  Duration:     65ms (0.07s)
────────────────────────────────────────────────────────────────────────────────
```

## Step 4: Run a Complete Booking Flow Test

```bash
npm run test:booking-flow
```

This tests:
- Guest checkout
- Authenticated checkout
- Cart management
- Booking confirmation
- Email queueing

## Step 5: Run All Tests

```bash
npm run test:all
```

This runs all validation tests (takes 1-2 minutes).

## Available Test Commands

| Command | Description | Duration |
|---------|-------------|----------|
| `npm run test:booking-flow` | Complete booking flows | ~30s |
| `npm run test:concurrent` | Stress test with parallel bookings | ~45s |
| `npm run test:inventory` | Inventory consistency checks | ~5s |
| `npm run test:email` | Email queue validation | ~10s |
| `npm run test:cleanup` | Cleanup operations | ~15s |
| `npm run test:promo` | Promo code functionality | ~20s |
| `npm run test:all` | All tests except concurrent | ~90s |
| `npm run test:stress` | Alias for concurrent test | ~45s |

## Common Issues

### "No published events found"

**Solution:** Create an event in the admin panel or seed your database.

### "Cannot connect to localhost:3000"

**Solution:** Make sure `npm run dev` is running in another terminal.

### "Database connection error"

**Solution:** Check your `.env` file has the correct `DATABASE_URL`.

### "ts-node: command not found"

**Solution:** Run `npm install` to install dev dependencies.

## Next Steps

1. Read the full [README.md](./README.md) for detailed documentation
2. Explore individual test files in `/scripts/`
3. Review helper modules in `/scripts/helpers/`
4. Customize tests for your specific needs

## Test Results Interpretation

### All Green (100% Pass Rate)
Your system is working correctly!

### Some Yellow Warnings
Not necessarily failures - review the warnings to understand context.

### Red Failures
Review the error messages and stack traces. Common causes:
- Insufficient test data
- Application not running
- Database schema mismatch
- Race conditions in concurrent tests (expected in some cases)

## Getting Help

- Check the error message and stack trace
- Review the test file to understand what's being tested
- Ensure test prerequisites are met (events, tickets, etc.)
- Check application logs in the dev server terminal

Happy testing!
