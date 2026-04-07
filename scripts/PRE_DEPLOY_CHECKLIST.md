# Pre-Deployment Testing Checklist

Use this checklist before deploying to production or staging environments.

## Prerequisites

- [ ] Application is running locally (`npm run dev`)
- [ ] Database is accessible and up-to-date
- [ ] Environment variables are configured
- [ ] Test data exists (at least one published event with available tickets)
- [ ] Dependencies are installed (`npm install`)

## Critical Tests (Must Pass 100%)

### 1. Inventory Validation
```bash
npm run test:inventory
```
- [ ] All inventory consistency checks pass
- [ ] No negative inventory values
- [ ] No orphaned inventory locks
- [ ] SQL verification passes

**Expected:** All tests pass, 0 failures

---

### 2. Booking Flow
```bash
npm run test:booking-flow
```
- [ ] Guest checkout completes successfully
- [ ] Authenticated checkout completes successfully
- [ ] Bookings created in database
- [ ] Tickets generated with QR codes
- [ ] Inventory locks cleaned up
- [ ] Draft bookings deleted
- [ ] Confirmation emails queued

**Expected:** All tests pass, 2 complete bookings created

---

### 3. Cleanup Operations
```bash
npm run test:cleanup
```
- [ ] Expired locks are deleted
- [ ] Expired draft bookings are deleted
- [ ] Active records are preserved
- [ ] Cascade deletion works
- [ ] No orphaned records
- [ ] Cleanup is idempotent

**Expected:** All tests pass, cleanup operations work correctly

---

## Important Tests (Should Pass)

### 4. Email Queue
```bash
npm run test:email
```
- [ ] All email template types supported
- [ ] Retry logic with exponential backoff
- [ ] Max 3 retry attempts enforced
- [ ] Status transitions work
- [ ] Booking confirmations queued

**Expected:** Most tests pass, warnings acceptable for unused templates

---

### 5. Promo Codes
```bash
npm run test:promo
```
- [ ] PERCENTAGE discounts work
- [ ] FIXED discounts work
- [ ] Minimum purchase enforced
- [ ] Max usage enforced
- [ ] Expiry validation works
- [ ] Usage count increments

**Expected:** All tests pass, constraints properly enforced

---

## Stress Tests (Informational)

### 6. Concurrent Bookings
```bash
npm run test:concurrent
```
- [ ] Race conditions handled correctly
- [ ] Some bookings succeed, some fail with INSUFFICIENT_INVENTORY
- [ ] No double-booking occurs
- [ ] Inventory remains consistent
- [ ] Promo code limits enforced

**Expected:** Mix of success/failure, no inventory corruption

**Note:** This test is expected to have some failures due to inventory constraints. What matters is that failures are graceful and inventory stays consistent.

---

## Run All Tests

```bash
npm run test:all
```

This runs all critical and important tests sequentially (excludes stress test).

**Expected Duration:** ~2 minutes
**Expected Result:** 100% pass rate (or very close)

---

## Post-Test Verification

After running tests, verify:

### Database State
- [ ] No orphaned inventory locks exist
- [ ] Inventory is consistent across all ticket types
- [ ] Test bookings are present in database
- [ ] Email logs show queued confirmation emails

### Application State
- [ ] Application is still running without errors
- [ ] No memory leaks or performance degradation
- [ ] Logs show no unexpected errors

---

## Deployment Decision Matrix

| Scenario | Action |
|----------|--------|
| All tests pass 100% | ✅ Safe to deploy |
| 1-2 minor tests fail with warnings | ⚠️ Review warnings, likely safe |
| Inventory tests fail | ❌ Do not deploy - critical issue |
| Booking flow fails | ❌ Do not deploy - critical issue |
| Cleanup tests fail | ⚠️ Deploy with caution, monitor cleanup job |
| Email tests fail | ⚠️ Deploy with caution, monitor email delivery |
| Concurrent tests show corruption | ❌ Do not deploy - race condition issue |

---

## Quick Decision Guide

### Green Light for Deployment
- `test:inventory` - 100% pass
- `test:booking-flow` - 100% pass
- `test:cleanup` - 100% pass
- No inventory inconsistencies
- No negative inventory values

### Yellow Light (Deploy with Caution)
- Email tests have warnings
- Promo code edge cases fail
- Concurrent test shows expected failures only

### Red Light (Do Not Deploy)
- Inventory consistency failures
- Negative inventory detected
- Booking flow failures
- Double-booking in concurrent test
- Data corruption detected

---

## Troubleshooting Failed Tests

### "No published events found"
1. Create an event in admin panel
2. Ensure event status is PUBLISHED
3. Ensure event date is in the future
4. Add ticket types with available inventory

### "Insufficient inventory"
1. Increase ticket quantities in database
2. Or run tests with fewer bookings
3. Or run cleanup to release expired locks

### "Connection refused"
1. Start the application: `npm run dev`
2. Wait for server to fully start
3. Verify port 3000 is accessible

### "Database error"
1. Check DATABASE_URL in .env
2. Run migrations: `npx prisma db push`
3. Regenerate client: `npx prisma generate`

### "ts-node not found"
1. Install dependencies: `npm install`
2. Verify ts-node in node_modules

---

## Final Checklist

Before clicking "Deploy":

- [ ] Ran `npm run test:all`
- [ ] All critical tests passed
- [ ] Reviewed any warnings
- [ ] No inventory inconsistencies
- [ ] No orphaned records
- [ ] Application logs are clean
- [ ] Database state is healthy
- [ ] Git commit includes test results
- [ ] Team notified of deployment

---

## Emergency Rollback Criteria

After deployment, monitor for:

- Inventory going negative
- Double-bookings occurring
- Email failures exceeding threshold
- Cleanup jobs not running
- Database deadlocks or timeouts

If any occur, initiate immediate rollback.

---

## Additional Resources

- Full documentation: [README.md](./README.md)
- Quick start: [QUICKSTART.md](./QUICKSTART.md)
- Test coverage: [TEST_COVERAGE.md](./TEST_COVERAGE.md)
- Implementation details: [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)

---

**Last Updated:** January 9, 2026
**Version:** 1.0.0
