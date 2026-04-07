# Festival Lights Admin Testing Checklist

**Version**: 1.0
**Last Updated**: January 9, 2025
**Purpose**: Comprehensive manual testing guide for QA testers
**Prerequisites**: Application running locally or in staging environment

---

## Table of Contents

1. [Test Environment Setup](#1-test-environment-setup)
2. [Admin Login & Dashboard](#2-admin-login--dashboard)
3. [Event Management](#3-event-management)
4. [Ticket Type Management](#4-ticket-type-management)
5. [Booking Management](#5-booking-management)
6. [Promo Code Management](#6-promo-code-management)
7. [User Management](#7-user-management)
8. [End-to-End Guest Booking Flow](#8-end-to-end-guest-booking-flow)
9. [Authenticated User Booking](#9-authenticated-user-booking)
10. [Edge Cases & Error Scenarios](#10-edge-cases--error-scenarios)
11. [Database Verification](#11-database-verification)
12. [Performance Checks](#12-performance-checks)
13. [Mobile Responsiveness](#13-mobile-responsiveness)
14. [Test Results Summary](#14-test-results-summary)

---

## 1. Test Environment Setup

### Prerequisites

```bash
# 1. Start the application
cd /home/jrosslee/src/ecomm_demo
npm run dev

# 2. Verify PostgreSQL is running
# Application should be accessible at http://localhost:3000

# 3. Database access for verification
# Connection string from .env file
```

### Test Accounts

| Role | Email | Password | Purpose |
|------|-------|----------|---------|
| Admin | admin@festivalights.com | Admin123! | Primary admin account |
| User | testuser@example.com | User123! | Standard user testing |
| Guest | N/A | N/A | Guest checkout testing |

### Browser Requirements

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (if on macOS)
- Mobile browsers (Chrome Mobile, Safari Mobile)

---

## 2. Admin Login & Dashboard

### 2.1 Admin Login

**Steps:**

1. Navigate to `http://localhost:3000/admin`
2. Enter credentials:
   - Email: `admin@festivalights.com`
   - Password: `Admin123!`
3. Click "Sign In" button
4. Observe redirect behavior

**Expected Results:**

- Login form displays correctly with email and password fields
- Password field has show/hide toggle
- "Remember me" checkbox is present
- Submit button is enabled after entering credentials
- Successful login redirects to `/admin` dashboard
- Session cookie is set (verify in DevTools > Application > Cookies)

**Database Verification:**

```sql
-- Verify admin user exists
SELECT id, email, role, "emailVerified", "createdAt"
FROM "User"
WHERE email = 'admin@festivalights.com';

-- Expected: role = 'ADMIN' or 'SUPER_ADMIN'

-- Verify session was created
SELECT id, "userId", "sessionToken", expires
FROM "Session"
WHERE "userId" = (SELECT id FROM "User" WHERE email = 'admin@festivalights.com')
ORDER BY "id" DESC
LIMIT 1;

-- Expected: New session record with future expiration date
```

### 2.2 Dashboard Display

**Steps:**

1. After successful login, observe the admin dashboard
2. Check all stat cards are visible
3. Verify recent bookings table displays
4. Check navigation menu items

**Expected Results:**

**Dashboard Elements:**

- Header displays "Festival Lights Admin"
- User profile dropdown in top-right corner
- Side navigation menu with sections:
  - Dashboard (home icon)
  - Events
  - Bookings
  - Promo Codes
  - Users
  - Settings

**Stat Cards (4 cards displayed):**

1. **Total Bookings**
   - Shows count of all bookings
   - Icon: Ticket
   - Percentage change from last month

2. **Total Revenue**
   - Shows sum of all booking totals
   - Formatted as currency (e.g., "$12,345.67")
   - Icon: Dollar sign
   - Percentage change from last month

3. **Upcoming Events**
   - Shows count of future published events
   - Icon: Calendar
   - Number of events in next 30 days

4. **Active Users**
   - Shows count of users who made bookings in last 30 days
   - Icon: Users
   - Percentage change from last month

**Recent Bookings Table:**

- Displays 10 most recent bookings
- Columns: Confirmation #, Event, Customer, Date, Status, Total
- Each row has "View Details" action button
- Status badges color-coded:
  - CONFIRMED: Green
  - PENDING: Yellow
  - CANCELLED: Red
  - REFUNDED: Gray

**Database Verification:**

```sql
-- Total bookings count
SELECT COUNT(*) as total_bookings
FROM "Booking";

-- Total revenue
SELECT SUM(total) as total_revenue
FROM "Booking"
WHERE status = 'CONFIRMED';

-- Upcoming events count
SELECT COUNT(*) as upcoming_events
FROM "Event"
WHERE date > NOW()
  AND status = 'PUBLISHED';

-- Active users (last 30 days)
SELECT COUNT(DISTINCT "userId") as active_users
FROM "Booking"
WHERE "createdAt" >= NOW() - INTERVAL '30 days'
  AND "userId" IS NOT NULL;

-- Recent bookings
SELECT
  "confirmationNumber",
  "email",
  "firstName",
  "lastName",
  status,
  total,
  "createdAt"
FROM "Booking"
ORDER BY "createdAt" DESC
LIMIT 10;
```

### 2.3 Navigation Test

**Steps:**

1. Click each menu item in sidebar
2. Verify page loads correctly
3. Use browser back button
4. Test logout functionality

**Expected Results:**

- Each page loads without errors
- Active menu item is highlighted
- Browser back/forward works correctly
- Logout clears session and redirects to login page

---

## 3. Event Management

### 3.1 View Events List

**Steps:**

1. Navigate to `/admin/events`
2. Observe events table
3. Test search functionality
4. Test status filters
5. Test sorting

**Expected Results:**

**Events Table Displays:**

- Event name (clickable to details)
- Date & time
- Location
- Status badge (Draft, Published, Sold Out, Cancelled, Completed)
- Capacity (sold/total)
- Actions dropdown (Edit, Duplicate, Delete)

**Filters Work:**

- Search by event name
- Filter by status (All, Published, Draft, Sold Out, etc.)
- Sort by: Date (asc/desc), Name (A-Z), Created date

**Database Verification:**

```sql
-- List all events with ticket counts
SELECT
  e.id,
  e.name,
  e.slug,
  e.date,
  e.location,
  e.status,
  e.capacity,
  COUNT(DISTINCT b.id) as booking_count,
  COUNT(DISTINCT t.id) as tickets_sold
FROM "Event" e
LEFT JOIN "Booking" b ON e.id = b."eventId" AND b.status = 'CONFIRMED'
LEFT JOIN "Ticket" t ON b.id = t."bookingId"
GROUP BY e.id
ORDER BY e.date DESC;
```

### 3.2 Create New Event

**Steps:**

1. Click "Create Event" button
2. Fill out event form:
   - **Name**: "New Year Light Festival 2025"
   - **Description**: "Ring in the new year with spectacular light displays"
   - **Location**: "Central Park, New York, NY"
   - **Address**: "Central Park West & 79th St, New York, NY 10024"
   - **Date**: "2025-12-31"
   - **Time**: "18:00"
   - **End Date**: "2026-01-01"
   - **End Time**: "02:00"
   - **Capacity**: 5000
   - **Status**: "Draft"
3. Click "Save Draft" or "Publish"

**Expected Results:**

**Form Validation:**

- Name field: Required, min 3 characters, max 255
- Description: Required, min 10 characters
- Location: Required
- Date: Required, must be future date
- Time: Required
- Capacity: Required, must be positive integer
- Status: Default to "Draft"

**Success:**

- Success notification appears
- Redirects to event details or events list
- Event appears in events table
- Slug is auto-generated from name (e.g., "new-year-light-festival-2025")

**Database Verification:**

```sql
-- Verify event was created
SELECT
  id,
  name,
  slug,
  description,
  location,
  date,
  "endDate",
  capacity,
  status,
  "createdAt",
  "updatedAt"
FROM "Event"
WHERE slug = 'new-year-light-festival-2025';

-- Expected: Single row with all fields populated correctly
-- createdAt and updatedAt should be recent timestamps
```

### 3.3 Edit Existing Event

**Steps:**

1. From events list, click "Edit" on an event
2. Modify the following:
   - Change date to next month
   - Update price information
   - Change capacity from 1000 to 1500
3. Click "Save Changes"

**Expected Results:**

- Form pre-populates with current data
- All fields are editable except:
  - Slug (read-only)
  - Created date
- Changes save successfully
- Success notification displays
- Updated fields reflect in database

**Database Verification:**

```sql
-- Verify event updates
SELECT
  name,
  date,
  capacity,
  "updatedAt"
FROM "Event"
WHERE id = '[EVENT_ID]';

-- updatedAt should be more recent than createdAt
```

### 3.4 Publish/Unpublish Event

**Steps:**

1. Select a draft event
2. Click "Publish" button
3. Verify status changes to "Published"
4. Click "Unpublish" to revert

**Expected Results:**

- Status badge updates immediately
- Published events appear in public event listing
- Draft events do not appear in public listing
- Confirmation modal appears before status change

**Database Verification:**

```sql
-- Check event status
SELECT id, name, status, "updatedAt"
FROM "Event"
WHERE id = '[EVENT_ID]';

-- Status should be 'PUBLISHED' or 'DRAFT'
```

### 3.5 View Event Details

**Steps:**

1. Click on event name in table
2. Review all event information
3. Check ticket types section
4. Check bookings section

**Expected Results:**

**Event Details Page Shows:**

- All event metadata
- Image (if uploaded)
- Location with map (if coordinates provided)
- Ticket types list with availability
- Recent bookings for this event
- Quick actions: Edit, Duplicate, Delete
- Analytics: Total bookings, revenue, capacity percentage

**Database Verification:**

```sql
-- Get complete event details with related data
SELECT
  e.*,
  COUNT(DISTINCT tt.id) as ticket_types_count,
  COUNT(DISTINCT b.id) as bookings_count,
  SUM(b.total) as total_revenue
FROM "Event" e
LEFT JOIN "TicketType" tt ON e.id = tt."eventId"
LEFT JOIN "Booking" b ON e.id = b."eventId" AND b.status = 'CONFIRMED'
WHERE e.id = '[EVENT_ID]'
GROUP BY e.id;
```

---

## 4. Ticket Type Management

### 4.1 Create Ticket Types for Event

**Steps:**

1. Navigate to event details page
2. Click "Add Ticket Type" button
3. Create 3 ticket types:

**Ticket Type 1: Early Bird**

- Name: "Early Bird"
- Description: "Limited early access tickets"
- Price: $45.00
- Total Quantity: 100
- Available From: Today's date
- Available To: Event date - 7 days

**Ticket Type 2: General Admission**

- Name: "General Admission"
- Description: "Standard access to the event"
- Price: $65.00
- Total Quantity: 500
- Available From: Today's date
- Available To: Event date

**Ticket Type 3: VIP**

- Name: "VIP Experience"
- Description: "Premium access with exclusive benefits"
- Price: $125.00
- Total Quantity: 50
- Available From: Today's date
- Available To: Event date

4. Save each ticket type

**Expected Results:**

**Form Validation:**

- Name: Required, unique per event
- Price: Required, must be positive decimal (2 decimal places)
- Total Quantity: Required, positive integer
- Available dates: Optional, To date must be after From date
- Available Available should equal Total Quantity initially

**Success:**

- Each ticket type saves successfully
- Appears in ticket types list
- Sorted by sortOrder (or creation order)
- Available quantity updates correctly

**Database Verification:**

```sql
-- Verify all 3 ticket types were created
SELECT
  id,
  "eventId",
  name,
  price,
  "quantityTotal",
  "quantityAvailable",
  "quantitySold",
  "availableFrom",
  "availableTo",
  "sortOrder"
FROM "TicketType"
WHERE "eventId" = '[EVENT_ID]'
ORDER BY "sortOrder";

-- Expected: 3 rows
-- Early Bird: price = 45.00, quantityTotal = 100
-- General Admission: price = 65.00, quantityTotal = 500
-- VIP: price = 125.00, quantityTotal = 50
-- All should have quantityAvailable = quantityTotal
-- All should have quantitySold = 0
```

### 4.2 Edit Ticket Pricing and Inventory

**Steps:**

1. Click "Edit" on General Admission ticket type
2. Change price from $65.00 to $75.00
3. Change quantity from 500 to 600
4. Save changes

**Expected Results:**

- Price updates immediately
- Quantity increase is reflected in available inventory
- If tickets already sold, available = total - sold
- Cannot reduce total below already sold quantity

**Validation Rules:**

- Cannot set price to 0 or negative
- Cannot reduce total quantity below sold quantity
- Price changes don't affect existing bookings

**Database Verification:**

```sql
-- Verify ticket type updates
SELECT
  name,
  price,
  "quantityTotal",
  "quantityAvailable",
  "quantitySold",
  "updatedAt"
FROM "TicketType"
WHERE id = '[TICKET_TYPE_ID]';

-- Expected:
-- price = 75.00
-- quantityTotal = 600
-- quantityAvailable = 600 - quantitySold
```

### 4.3 Verify Inventory Calculations

**Test Scenario:**

After creating a booking with 2 General Admission tickets:

**Steps:**

1. Create a test booking (see section 7)
2. Return to ticket types list
3. Verify inventory updated

**Expected Results:**

```
General Admission:
- Total: 600
- Available: 598
- Sold: 2
```

**Database Verification:**

```sql
-- Check inventory consistency
SELECT
  tt.name,
  tt."quantityTotal",
  tt."quantityAvailable",
  tt."quantitySold",
  COUNT(t.id) as actual_tickets_sold
FROM "TicketType" tt
LEFT JOIN "Ticket" t ON tt.id = t."ticketTypeId"
LEFT JOIN "Booking" b ON t."bookingId" = b.id AND b.status = 'CONFIRMED'
WHERE tt."eventId" = '[EVENT_ID]'
GROUP BY tt.id, tt.name, tt."quantityTotal", tt."quantityAvailable", tt."quantitySold";

-- Verify:
-- quantitySold should match COUNT(t.id)
-- quantityAvailable should equal quantityTotal - quantitySold
```

### 4.4 Test Availability Windows

**Steps:**

1. Create a ticket type with availability window:
   - Available From: Tomorrow's date
   - Available To: Event date
2. Attempt to purchase before "Available From" date
3. Verify error message

**Expected Results:**

- Ticket type marked as "Not Yet Available" in public view
- Add to cart button is disabled
- Helpful message: "Available starting [DATE]"
- After availability window starts, ticket becomes purchasable

**Database Verification:**

```sql
-- Check ticket type availability
SELECT
  name,
  price,
  "availableFrom",
  "availableTo",
  CASE
    WHEN "availableFrom" > NOW() THEN 'Not Yet Available'
    WHEN "availableTo" < NOW() THEN 'No Longer Available'
    ELSE 'Available'
  END as availability_status
FROM "TicketType"
WHERE "eventId" = '[EVENT_ID]';
```

---

## 5. Booking Management

### 5.1 Browse All Bookings

**Steps:**

1. Navigate to `/admin/bookings`
2. Observe bookings table
3. Review table columns
4. Test pagination (if > 50 bookings)

**Expected Results:**

**Bookings Table Displays:**

| Column | Content |
|--------|---------|
| Confirmation # | Unique ID (clickable) |
| Event | Event name |
| Customer | Full name + email |
| Booking Date | Created timestamp |
| Status | Badge (Confirmed/Pending/Cancelled/Refunded) |
| Tickets | Count of tickets |
| Total | Formatted currency |
| Actions | View, Resend Email, Cancel, Refund |

**Table Features:**

- Sortable columns
- Pagination (50 per page)
- Row click opens details
- Status filters in header

**Database Verification:**

```sql
-- List all bookings with related data
SELECT
  b."confirmationNumber",
  b.email,
  b."firstName",
  b."lastName",
  e.name as event_name,
  b.status,
  b.total,
  COUNT(t.id) as ticket_count,
  b."createdAt"
FROM "Booking" b
JOIN "Event" e ON b."eventId" = e.id
LEFT JOIN "Ticket" t ON b.id = t."bookingId"
GROUP BY b.id, e.name
ORDER BY b."createdAt" DESC
LIMIT 50;
```

### 5.2 Search Bookings

**Test Cases:**

| Test | Search Term | Expected Result |
|------|-------------|-----------------|
| By Email | testuser@example.com | All bookings for that email |
| By Confirmation # | [CONF_NUMBER] | Single booking |
| By Name | "John" | All bookings with John in first/last name |
| Partial Email | "@gmail.com" | All Gmail bookings |
| Case Insensitive | "TESTUSER" | Same as lowercase |

**Steps:**

1. Enter search term in search box
2. Press Enter or click search icon
3. Verify results

**Expected Results:**

- Search is case-insensitive
- Searches across: email, confirmation number, first name, last name
- Results update immediately
- No results shows helpful message
- Clear search button appears

**Database Query (for reference):**

```sql
-- Search bookings by email or name
SELECT
  b.*,
  e.name as event_name
FROM "Booking" b
JOIN "Event" e ON b."eventId" = e.id
WHERE
  LOWER(b.email) LIKE LOWER('%[SEARCH_TERM]%')
  OR LOWER(b."firstName") LIKE LOWER('%[SEARCH_TERM]%')
  OR LOWER(b."lastName") LIKE LOWER('%[SEARCH_TERM]%')
  OR b."confirmationNumber" ILIKE '%[SEARCH_TERM]%'
ORDER BY b."createdAt" DESC;
```

### 5.3 Filter by Status and Date

**Filter Tests:**

1. **Status Filter:**
   - Select "Confirmed" → Shows only confirmed bookings
   - Select "Cancelled" → Shows only cancelled bookings
   - Select "All" → Shows all bookings

2. **Date Range Filter:**
   - Last 7 days
   - Last 30 days
   - Last 90 days
   - Custom range (date picker)

**Expected Results:**

- Filters work independently
- Can combine status + date filters
- Count badge shows filtered result count
- Clear filters button resets to all bookings

**Database Verification:**

```sql
-- Filter bookings by status and date range
SELECT
  COUNT(*) as booking_count,
  status
FROM "Booking"
WHERE
  status = 'CONFIRMED'  -- or other status
  AND "createdAt" >= NOW() - INTERVAL '30 days'
GROUP BY status;
```

### 5.4 View Detailed Booking Information

**Steps:**

1. Click on a booking confirmation number
2. Review all booking details

**Expected Booking Details Display:**

**Customer Information:**

- Full name
- Email address
- Phone number
- User account link (if registered user)

**Event Information:**

- Event name (with link)
- Event date and time
- Location

**Ticket Information (for each ticket):**

- Ticket type name
- Price paid
- Attendee name (if provided)
- Attendee email (if provided)
- QR code
- Scan status (scanned/not scanned)

**Financial Information:**

- Subtotal
- Promo code (if used) with discount amount
- Service fee
- Total paid

**Booking Metadata:**

- Confirmation number
- Booking date/time
- Status
- IP address (if captured)
- User agent (if captured)

**Activity Log:**

- Email sent notifications
- Status changes
- Refund history

**Database Verification:**

```sql
-- Complete booking details query
SELECT
  b.*,
  e.name as event_name,
  e.date as event_date,
  e.location as event_location,
  pc.code as promo_code,
  pc."discountValue" as discount_amount,
  u.email as user_email,
  u.role as user_role
FROM "Booking" b
JOIN "Event" e ON b."eventId" = e.id
LEFT JOIN "PromoCode" pc ON b."promoCodeId" = pc.id
LEFT JOIN "User" u ON b."userId" = u.id
WHERE b."confirmationNumber" = '[CONFIRMATION_NUMBER]';

-- Get all tickets for booking
SELECT
  t.*,
  tt.name as ticket_type_name,
  tt.description as ticket_type_description
FROM "Ticket" t
JOIN "TicketType" tt ON t."ticketTypeId" = tt.id
WHERE t."bookingId" = '[BOOKING_ID]';

-- Get email log for booking
SELECT
  "templateType",
  status,
  "sentAt",
  attempts,
  error
FROM "EmailLog"
WHERE "bookingId" = '[BOOKING_ID]'
ORDER BY "createdAt" DESC;
```

### 5.5 Test Booking Actions

#### 5.5.1 Resend Confirmation Email

**Steps:**

1. From booking details, click "Resend Email"
2. Confirm action in modal
3. Verify success message

**Expected Results:**

- Confirmation modal appears
- Email sends successfully
- Success notification displays
- EmailLog table updated

**Database Verification:**

```sql
-- Check email log entry
SELECT
  id,
  "templateType",
  "recipientEmail",
  status,
  attempts,
  "sentAt",
  "createdAt"
FROM "EmailLog"
WHERE
  "bookingId" = '[BOOKING_ID]'
  AND "templateType" = 'BOOKING_CONFIRMATION'
ORDER BY "createdAt" DESC
LIMIT 1;

-- Expected: New row with status = 'SENT' or 'PENDING'
-- attempts should increment if resending
```

#### 5.5.2 Cancel Booking

**Steps:**

1. Click "Cancel Booking" button
2. Enter cancellation reason (if prompted)
3. Confirm cancellation

**Expected Results:**

- Confirmation modal with warning message
- Booking status changes to "CANCELLED"
- Ticket inventory is released back to available pool
- Cancellation email sent to customer
- Cannot cancel already-cancelled booking

**Database Verification:**

```sql
-- Verify booking status changed
SELECT
  "confirmationNumber",
  status,
  "updatedAt"
FROM "Booking"
WHERE id = '[BOOKING_ID]';

-- Expected: status = 'CANCELLED'

-- Verify ticket inventory was released
SELECT
  tt.name,
  tt."quantityAvailable",
  tt."quantitySold"
FROM "TicketType" tt
JOIN "Ticket" t ON tt.id = t."ticketTypeId"
WHERE t."bookingId" = '[BOOKING_ID]';

-- Expected: quantityAvailable increased, quantitySold decreased

-- Verify cancellation email sent
SELECT
  "templateType",
  status,
  "sentAt"
FROM "EmailLog"
WHERE
  "bookingId" = '[BOOKING_ID]'
  AND "createdAt" > (SELECT "updatedAt" FROM "Booking" WHERE id = '[BOOKING_ID]')
ORDER BY "createdAt" DESC;
```

---

## 6. Promo Code Management

### 6.1 View Promo Codes

**Steps:**

1. Navigate to `/admin/promo-codes`
2. Review promo codes table

**Expected Table Columns:**

- Code (uppercase, unique)
- Description
- Discount Type (Percentage / Fixed Amount)
- Discount Value
- Usage (X / Max or "Unlimited")
- Valid Until (or "No Expiration")
- Status (Active/Expired/Maxed Out)
- Actions (Edit, View Usage, Deactivate)

**Database Verification:**

```sql
-- List all promo codes with usage stats
SELECT
  code,
  description,
  "discountType",
  "discountValue",
  "maxUses",
  "usedCount",
  "expiresAt",
  "minPurchaseAmount",
  CASE
    WHEN "expiresAt" IS NOT NULL AND "expiresAt" < NOW() THEN 'Expired'
    WHEN "maxUses" IS NOT NULL AND "usedCount" >= "maxUses" THEN 'Maxed Out'
    ELSE 'Active'
  END as status
FROM "PromoCode"
ORDER BY "createdAt" DESC;
```

### 6.2 Create Promo Code

**Test Cases:**

Create the following promo codes:

**1. Percentage Discount:**

- Code: SUMMER25
- Description: "25% off summer events"
- Discount Type: Percentage
- Discount Value: 25
- Max Uses: 100
- Expires: 90 days from now
- Min Purchase: $50.00

**2. Fixed Amount Discount:**

- Code: WELCOME10
- Description: "Welcome discount for new users"
- Discount Type: Fixed
- Discount Value: 10.00
- Max Uses: Unlimited (null)
- Expires: No expiration (null)
- Min Purchase: None (null)

**3. Limited Use Code:**

- Code: VIP50
- Description: "Exclusive VIP discount"
- Discount Type: Percentage
- Discount Value: 50
- Max Uses: 10
- Expires: 30 days from now
- Min Purchase: $100.00

**Expected Results:**

**Form Validation:**

- Code: Required, uppercase only, no spaces, 3-20 chars
- Discount Value: Required, must be positive
- If Percentage: Max 100
- Max Uses: Optional, must be positive if provided
- Expiration: Optional, must be future date
- Min Purchase: Optional, must be positive if provided

**Success:**

- Code saved successfully
- Appears in promo codes list
- Code is immediately usable in checkout

**Database Verification:**

```sql
-- Verify all 3 promo codes created
SELECT
  code,
  description,
  "discountType",
  "discountValue",
  "maxUses",
  "usedCount",
  "expiresAt",
  "minPurchaseAmount"
FROM "PromoCode"
WHERE code IN ('SUMMER25', 'WELCOME10', 'VIP50');

-- Expected: 3 rows with correct values
-- SUMMER25: discountType = 'PERCENTAGE', discountValue = 25.00
-- WELCOME10: discountType = 'FIXED', discountValue = 10.00, maxUses = null
-- VIP50: discountType = 'PERCENTAGE', discountValue = 50.00, maxUses = 10
```

### 6.3 Verify Discount Calculations

**Test Scenarios:**

| Cart Subtotal | Promo Code | Expected Discount | Expected Total (w/ $5 service fee) |
|---------------|------------|-------------------|-------------------------------------|
| $100.00 | SUMMER25 | $25.00 | $80.00 |
| $50.00 | WELCOME10 | $10.00 | $45.00 |
| $200.00 | VIP50 | $100.00 | $105.00 |
| $40.00 | SUMMER25 | $0 (min not met) | $45.00 |

**Steps:**

1. Create test booking with specified subtotal
2. Apply promo code at checkout
3. Verify discount calculation
4. Complete booking
5. Check admin booking details

**Expected Results:**

- Discount calculates correctly
- Min purchase amount enforced
- Fixed discounts capped at subtotal (cannot go negative)
- Service fee added after discount
- Booking shows promo code used

**Database Verification:**

```sql
-- Verify booking has correct discount applied
SELECT
  b."confirmationNumber",
  b.subtotal,
  b.discount,
  b."serviceFee",
  b.total,
  pc.code as promo_code,
  pc."discountType",
  pc."discountValue"
FROM "Booking" b
LEFT JOIN "PromoCode" pc ON b."promoCodeId" = pc.id
WHERE b."confirmationNumber" = '[CONFIRMATION_NUMBER]';

-- Verify calculation:
-- If PERCENTAGE: discount = subtotal * (discountValue / 100)
-- If FIXED: discount = MIN(discountValue, subtotal)
-- total = subtotal - discount + serviceFee
```

### 6.4 Check Usage Tracking

**Steps:**

1. Use promo code VIP50 (max 10 uses) in 3 different bookings
2. Return to promo codes table
3. Verify usage count incremented

**Expected Results:**

- Usage count: 3 / 10
- Progress bar or indicator shows 30% used
- Code still shows as "Active"
- After 10 uses, status changes to "Maxed Out"

**Database Verification:**

```sql
-- Check promo code usage
SELECT
  code,
  "usedCount",
  "maxUses",
  COUNT(b.id) as actual_bookings
FROM "PromoCode" pc
LEFT JOIN "Booking" b ON pc.id = b."promoCodeId" AND b.status != 'CANCELLED'
WHERE pc.code = 'VIP50'
GROUP BY pc.id, pc.code, pc."usedCount", pc."maxUses";

-- Verify: usedCount matches COUNT(b.id)
```

### 6.5 Test Code Expiry

**Steps:**

1. Create promo code with expiration tomorrow
2. Wait until after expiration (or manually update in DB for testing)
3. Attempt to use expired code
4. Verify error message

**Expected Results:**

- Active codes show expiration date
- Expired codes marked with "Expired" badge
- Cannot apply expired code to booking
- Error message: "This promo code has expired"

**Database Verification:**

```sql
-- Check expired promo codes
SELECT
  code,
  "expiresAt",
  CASE
    WHEN "expiresAt" < NOW() THEN 'Expired'
    ELSE 'Active'
  END as status
FROM "PromoCode"
WHERE "expiresAt" IS NOT NULL
ORDER BY "expiresAt";
```

---

## 7. User Management

### 7.1 List All Users

**Steps:**

1. Navigate to `/admin/users`
2. Review users table

**Expected Table Display:**

| Column | Content |
|--------|---------|
| Name | Full name or email if no name |
| Email | Email address |
| Role | USER / ADMIN / SUPER_ADMIN |
| Joined | Registration date |
| Bookings | Count of bookings |
| Total Spent | Sum of confirmed bookings |
| Status | Active / Inactive |
| Actions | View, Edit, Impersonate |

**Database Verification:**

```sql
-- List all users with booking stats
SELECT
  u.id,
  u.name,
  u.email,
  u.role,
  u."createdAt",
  COUNT(DISTINCT b.id) as booking_count,
  COALESCE(SUM(CASE WHEN b.status = 'CONFIRMED' THEN b.total ELSE 0 END), 0) as total_spent
FROM "User" u
LEFT JOIN "Booking" b ON u.id = b."userId"
GROUP BY u.id
ORDER BY u."createdAt" DESC;
```

### 7.2 View User Details

**Steps:**

1. Click on a user's name
2. Review user profile page

**Expected User Details:**

**Profile Information:**

- Full name
- Email (verified status)
- Phone number
- Account creation date
- Last login date
- Role

**Booking History:**

- List of all bookings
- Total number of bookings
- Total amount spent
- Favorite events (most booked)

**Activity Log:**

- Recent logins
- Password changes
- Booking activity

**Database Verification:**

```sql
-- Get complete user profile
SELECT
  u.*,
  COUNT(DISTINCT b.id) as total_bookings,
  SUM(CASE WHEN b.status = 'CONFIRMED' THEN b.total ELSE 0 END) as lifetime_value,
  MAX(s."expires") as last_session_expiry
FROM "User" u
LEFT JOIN "Booking" b ON u.id = b."userId"
LEFT JOIN "Session" s ON u.id = s."userId"
WHERE u.id = '[USER_ID]'
GROUP BY u.id;

-- Get user's booking history
SELECT
  b."confirmationNumber",
  e.name as event_name,
  b."createdAt",
  b.status,
  b.total
FROM "Booking" b
JOIN "Event" e ON b."eventId" = e.id
WHERE b."userId" = '[USER_ID]'
ORDER BY b."createdAt" DESC;
```

### 7.3 Check Role Assignments

**Test Cases:**

1. **Regular User:**
   - Can access: My Bookings, Account Settings
   - Cannot access: Admin panel

2. **Admin User:**
   - Can access: All user features + Admin panel
   - Can manage: Events, Bookings, Promo Codes, Users
   - Cannot access: Super admin settings

3. **Super Admin:**
   - Can access: Everything
   - Can manage: Other admins, system settings

**Steps:**

1. Login as each role type
2. Verify menu items visible
3. Attempt to access restricted areas
4. Verify authorization checks work

**Expected Results:**

- Role-appropriate menu displays
- Unauthorized access redirects to login or 403 error
- API endpoints enforce role permissions

**Database Verification:**

```sql
-- Check user roles distribution
SELECT
  role,
  COUNT(*) as user_count
FROM "User"
GROUP BY role
ORDER BY
  CASE role
    WHEN 'SUPER_ADMIN' THEN 1
    WHEN 'ADMIN' THEN 2
    WHEN 'USER' THEN 3
  END;
```

### 7.4 Verify User Booking History

**Steps:**

1. Select a user who has made multiple bookings
2. View their booking history section
3. Verify all bookings are listed
4. Check booking totals add up correctly

**Expected Results:**

- All user bookings displayed chronologically
- Each booking shows:
  - Event name
  - Date booked
  - Status
  - Amount paid
- Running total of all confirmed bookings
- Can click through to individual booking details

**Database Verification:**

```sql
-- Verify user booking history completeness
SELECT
  u.email,
  COUNT(b.id) as bookings_in_table,
  COUNT(DISTINCT b."confirmationNumber") as unique_confirmations,
  SUM(CASE WHEN b.status = 'CONFIRMED' THEN 1 ELSE 0 END) as confirmed_count,
  SUM(CASE WHEN b.status = 'CONFIRMED' THEN b.total ELSE 0 END) as confirmed_total
FROM "User" u
LEFT JOIN "Booking" b ON u.id = b."userId"
WHERE u.email = '[USER_EMAIL]'
GROUP BY u.id, u.email;

-- Cross-check with booking table
SELECT
  "confirmationNumber",
  "createdAt",
  status,
  total
FROM "Booking"
WHERE "userId" = (SELECT id FROM "User" WHERE email = '[USER_EMAIL]')
ORDER BY "createdAt" DESC;
```

---

## 8. End-to-End Guest Booking Flow

### 8.1 Navigate as Guest User

**Steps:**

1. Open browser in incognito/private mode
2. Navigate to `http://localhost:3000`
3. Browse available events
4. Do NOT log in

**Expected Results:**

- Homepage displays without requiring login
- Events grid shows published events only
- Navigation shows "Sign In" and "Register" buttons
- No user-specific content visible

### 8.2 Select Event

**Steps:**

1. Click on "Summer Light Festival" event card
2. Review event details page

**Expected Event Details:**

- Event hero image
- Event name and description
- Date, time, location
- Available ticket types with prices
- "Book Now" or "Select Tickets" button
- Event capacity indicator
- Reviews/ratings (if any)

**Database Check:**

Ensure event is published and has available tickets.

```sql
-- Verify event is bookable
SELECT
  e.name,
  e.status,
  e.date,
  COUNT(DISTINCT tt.id) as ticket_types,
  SUM(tt."quantityAvailable") as total_available
FROM "Event" e
JOIN "TicketType" tt ON e.id = tt."eventId"
WHERE
  e.slug = 'summer-light-festival'
  AND e.status = 'PUBLISHED'
  AND e.date > NOW()
GROUP BY e.id;
```

### 8.3 Add Tickets (Multiple Types)

**Steps:**

1. Click "Select Tickets" button
2. Add tickets:
   - 2x General Admission ($65 each)
   - 1x VIP ($125)
3. Click "Continue to Checkout"

**Expected Results:**

**Ticket Selection Modal/Page:**

- Each ticket type displayed with:
  - Name and description
  - Price
  - Availability counter
  - Quantity selector (+ / - buttons)
  - Disabled if sold out
- Running subtotal updates as tickets added
- Service fee displayed (if applicable)
- "Continue" button enabled when at least 1 ticket selected

**Cart Summary:**

- 3 tickets total
- Subtotal: $255.00 (2×$65 + 1×$125)
- Service fee: $5.00
- Total: $260.00

**Database Verification:**

```sql
-- Check ticket availability before booking
SELECT
  name,
  price,
  "quantityAvailable"
FROM "TicketType"
WHERE "eventId" = (SELECT id FROM "Event" WHERE slug = 'summer-light-festival')
  AND "quantityAvailable" >= 1
ORDER BY price;

-- Verify no inventory locks exist yet (cart initialization happens next step)
SELECT COUNT(*)
FROM "InventoryLock"
WHERE "expiresAt" > NOW();
```

### 8.4 Apply Promo Code

**Steps:**

1. In checkout, locate promo code field
2. Enter code: SUMMER25
3. Click "Apply"

**Expected Results:**

- Discount applies: $255 × 25% = $63.75
- Updated totals:
  - Subtotal: $255.00
  - Discount: -$63.75
  - Service Fee: $5.00
  - Total: $196.25
- Success message: "Promo code SUMMER25 applied"
- Promo code field shows applied code with remove option

**Error Cases to Test:**

| Test | Promo Code | Expected Error |
|------|------------|----------------|
| Expired | OLDCODE | "This promo code has expired" |
| Invalid | FAKECODE | "Invalid promo code" |
| Min Purchase | VIP50 ($100 min) on $50 cart | "Minimum purchase of $100 required" |
| Max Uses Reached | Code with 0 remaining | "This promo code has reached its usage limit" |

**Database Verification:**

```sql
-- Verify promo code is valid
SELECT
  code,
  "discountType",
  "discountValue",
  "usedCount",
  "maxUses",
  "expiresAt",
  "minPurchaseAmount",
  CASE
    WHEN "expiresAt" IS NOT NULL AND "expiresAt" < NOW() THEN 'Expired'
    WHEN "maxUses" IS NOT NULL AND "usedCount" >= "maxUses" THEN 'Maxed Out'
    WHEN "minPurchaseAmount" IS NOT NULL AND "minPurchaseAmount" > 255.00 THEN 'Min Not Met'
    ELSE 'Valid'
  END as validation_status
FROM "PromoCode"
WHERE code = 'SUMMER25';
```

### 8.5 Enter Personal Information

**Steps:**

1. Progress to "Personal Information" step
2. Fill out form:
   - First Name: John
   - Last Name: Doe
   - Email: john.doe@example.com
   - Phone: +1-555-0123
3. Click "Continue"

**Expected Results:**

**Form Validation:**

- All fields required
- Email format validated
- Phone format validated (flexible formats accepted)
- Real-time validation as user types
- Error messages display below fields

**Valid Formats:**

- Email: standard email format (name@domain.com)
- Phone: US/international formats
  - (555) 123-4567
  - +1-555-123-4567
  - 5551234567

**Progress Updates:**

- Progress indicator shows step 2 of 4 complete
- Previous steps remain editable
- Form data persists if user navigates back

### 8.6 Fill Attendee Details

**Steps:**

1. For each ticket, provide attendee information:

**Ticket 1 (General Admission):**

- Name: John Doe
- Email: john.doe@example.com

**Ticket 2 (General Admission):**

- Name: Jane Smith
- Email: jane.smith@example.com

**Ticket 3 (VIP):**

- Name: Bob Johnson
- Email: bob.johnson@example.com

2. Click "Continue to Payment"

**Expected Results:**

- One form section per ticket
- Each section shows ticket type and seat number
- Can pre-fill with personal info (checkbox)
- All fields validate
- Can leave email optional if attending with booker
- Progress moves to step 3 of 4

### 8.7 Complete Payment

**Steps:**

1. Review order summary
2. Enter payment details (test mode):
   - Card Number: 4242 4242 4242 4242
   - Expiry: 12/25
   - CVV: 123
   - Name: John Doe
   - Billing ZIP: 10001
3. Accept terms and conditions checkbox
4. Click "Complete Booking"

**Expected Results:**

**Payment Processing:**

- Loading indicator displays
- Submit button disabled during processing
- No duplicate submissions possible

**Success State:**

- Redirects to confirmation page
- Displays confirmation number
- Shows booking summary
- Download tickets button
- Email confirmation sent message

**Confirmation Page Contains:**

- Large confirmation number (e.g., cly123abc456def)
- Success icon/animation
- Booking details:
  - Event name and date
  - Ticket details
  - Total paid
  - Payment method (last 4 digits)
- Next steps instructions
- Add to calendar button
- Email address where confirmation sent
- Customer support contact

**Database Verification:**

```sql
-- Verify booking was created
SELECT
  "confirmationNumber",
  email,
  "firstName",
  "lastName",
  status,
  subtotal,
  discount,
  "serviceFee",
  total,
  "createdAt",
  "confirmedAt"
FROM "Booking"
WHERE email = 'john.doe@example.com'
ORDER BY "createdAt" DESC
LIMIT 1;

-- Expected:
-- status = 'CONFIRMED'
-- subtotal = 255.00
-- discount = 63.75
-- serviceFee = 5.00
-- total = 196.25
-- confirmedAt should be set
```

### 8.8 Verify Confirmation Email

**Steps:**

1. Check email inbox for john.doe@example.com
2. Verify email received
3. Review email content

**Expected Email Content:**

- Subject: "Your Festival Lights Booking Confirmation - [Confirmation Number]"
- Sender: Festival Lights <noreply@festivalights.com>
- Professional HTML template

**Email Should Include:**

- Personalized greeting
- Confirmation number (prominent)
- Event details (name, date, location, time)
- Tickets purchased (each ticket type and quantity)
- Attendee information
- QR codes for each ticket
- Total amount paid
- Add to calendar link
- View booking online link
- Contact support information
- Terms and conditions link

**Database Verification:**

```sql
-- Check email log
SELECT
  id,
  "recipientEmail",
  "templateType",
  status,
  subject,
  "sentAt",
  attempts,
  error
FROM "EmailLog"
WHERE
  "bookingId" = (
    SELECT id FROM "Booking"
    WHERE email = 'john.doe@example.com'
    ORDER BY "createdAt" DESC
    LIMIT 1
  )
  AND "templateType" = 'BOOKING_CONFIRMATION'
ORDER BY "createdAt" DESC;

-- Expected:
-- templateType = 'BOOKING_CONFIRMATION'
-- status = 'SENT'
-- sentAt should be recent
-- error should be null
```

### 8.9 Verify Booking in Admin Dashboard

**Steps:**

1. Login to admin panel
2. Navigate to Bookings
3. Search for john.doe@example.com
4. Click on the booking

**Expected Results:**

- Booking appears in recent bookings
- All details match checkout data
- Status is CONFIRMED
- Promo code SUMMER25 is recorded
- All 3 tickets are listed with attendee info
- Payment details recorded
- Email log shows confirmation sent

**Database Verification:**

```sql
-- Complete booking verification
SELECT
  b.*,
  e.name as event_name,
  pc.code as promo_code
FROM "Booking" b
JOIN "Event" e ON b."eventId" = e.id
LEFT JOIN "PromoCode" pc ON b."promoCodeId" = pc.id
WHERE b.email = 'john.doe@example.com'
ORDER BY b."createdAt" DESC
LIMIT 1;
```

### 8.10 Check Database State

**Comprehensive Database Check:**

```sql
-- 1. Verify Booking record
SELECT
  "confirmationNumber",
  status,
  subtotal,
  discount,
  "serviceFee",
  total
FROM "Booking"
WHERE email = 'john.doe@example.com'
ORDER BY "createdAt" DESC
LIMIT 1;

-- 2. Verify Tickets created
SELECT
  t.id,
  t.price,
  t."attendeeName",
  t."attendeeEmail",
  tt.name as ticket_type
FROM "Ticket" t
JOIN "TicketType" tt ON t."ticketTypeId" = tt.id
WHERE t."bookingId" = (
  SELECT id FROM "Booking"
  WHERE email = 'john.doe@example.com'
  ORDER BY "createdAt" DESC
  LIMIT 1
);

-- Expected: 3 tickets with correct attendee info

-- 3. Verify EmailLog entry
SELECT
  "templateType",
  status,
  "sentAt"
FROM "EmailLog"
WHERE "bookingId" = (
  SELECT id FROM "Booking"
  WHERE email = 'john.doe@example.com'
  ORDER BY "createdAt" DESC
  LIMIT 1
);

-- 4. Verify Promo Code usage incremented
SELECT
  code,
  "usedCount"
FROM "PromoCode"
WHERE code = 'SUMMER25';

-- usedCount should have incremented by 1

-- 5. Verify Ticket inventory updated
SELECT
  name,
  "quantityTotal",
  "quantityAvailable",
  "quantitySold"
FROM "TicketType"
WHERE "eventId" = (
  SELECT "eventId" FROM "Booking"
  WHERE email = 'john.doe@example.com'
  ORDER BY "createdAt" DESC
  LIMIT 1
);

-- General Admission: quantitySold += 2, quantityAvailable -= 2
-- VIP: quantitySold += 1, quantityAvailable -= 1
```

---

## 9. Authenticated User Booking

### 9.1 Create Test User Account

**Steps:**

1. Navigate to `/register`
2. Fill registration form:
   - Name: Test User
   - Email: testuser@example.com
   - Password: User123!
   - Confirm Password: User123!
3. Submit form

**Expected Results:**

- Account created successfully
- Welcome email sent
- Auto-login after registration
- Redirects to user dashboard or events page

**Database Verification:**

```sql
-- Verify user account created
SELECT
  id,
  name,
  email,
  role,
  "emailVerified",
  "createdAt"
FROM "User"
WHERE email = 'testuser@example.com';

-- Expected:
-- role = 'USER'
-- emailVerified might be null (if email verification required)

-- Check welcome email sent
SELECT
  "recipientEmail",
  "templateType",
  status,
  "sentAt"
FROM "EmailLog"
WHERE
  "recipientEmail" = 'testuser@example.com'
  AND "templateType" = 'WELCOME'
ORDER BY "createdAt" DESC
LIMIT 1;
```

### 9.2 Login as Test User

**Steps:**

1. Logout (if logged in)
2. Navigate to `/login`
3. Enter:
   - Email: testuser@example.com
   - Password: User123!
4. Click Sign In

**Expected Results:**

- Login successful
- Redirects to previous page or dashboard
- User menu shows user name
- "My Bookings" link visible in navigation

### 9.3 Complete Booking

**Steps:**

1. While logged in, select an event
2. Add tickets to cart
3. Proceed to checkout

**Expected Differences from Guest Checkout:**

- Personal info form pre-filled with user account data:
  - Name: Test User
  - Email: testuser@example.com
  - Phone: (from user profile if set)
- Option to "Save to my account" for future bookings
- Faster checkout (fewer form fields)
- Booking automatically linked to user account

**Steps to Complete:**

1. Verify pre-filled information
2. Add attendee details
3. Complete payment
4. Verify booking confirmation

### 9.4 Verify Pre-filled Information

**Expected Behavior:**

**Personal Info Step:**

- First Name: "Test"
- Last Name: "User"
- Email: "testuser@example.com"
- Phone: (from profile or empty)
- All fields are editable
- Checkbox: "Update my profile with this information"

**Attendee Info:**

- First ticket defaults to logged-in user
- Option to "Use my information" for first ticket

### 9.5 View Booking in User Account

**Steps:**

1. After booking confirmed, click user menu
2. Click "My Bookings"
3. Verify new booking appears

**Expected User Dashboard:**

**My Bookings Section:**

- List of all user's bookings
- Filters: Upcoming / Past / Cancelled
- Each booking card shows:
  - Event name and image
  - Date and time
  - Confirmation number
  - Number of tickets
  - Total paid
  - Status badge
  - Action buttons: View Details, Download Tickets

**Booking Details Page:**

- Same information as guest booking
- Additional option: "Add to my calendar"
- Can resend confirmation email
- Can request refund (if policy allows)

**Database Verification:**

```sql
-- Verify booking is linked to user account
SELECT
  b."confirmationNumber",
  b.email,
  u.name as user_name,
  u.email as user_email,
  b.status,
  b.total
FROM "Booking" b
JOIN "User" u ON b."userId" = u.id
WHERE u.email = 'testuser@example.com'
ORDER BY b."createdAt" DESC;

-- userId should be populated (not null)

-- Count user's total bookings
SELECT
  COUNT(*) as total_bookings,
  SUM(CASE WHEN status = 'CONFIRMED' THEN total ELSE 0 END) as total_spent
FROM "Booking"
WHERE "userId" = (SELECT id FROM "User" WHERE email = 'testuser@example.com');
```

### 9.6 Verify in Admin Dashboard

**Steps:**

1. Login as admin
2. Navigate to Users section
3. Search for testuser@example.com
4. View user profile

**Expected Results:**

- User profile shows recent booking
- Booking count incremented
- Total spent updated
- Can view all user's bookings from admin panel

---

## 10. Edge Cases & Error Scenarios

### 10.1 Sold-Out Event

**Setup:**

1. Create event with very limited capacity (e.g., 2 tickets)
2. Make bookings until sold out

**Test:**

1. Attempt to book sold-out event
2. Observe behavior

**Expected Results:**

- Event page shows "SOLD OUT" badge
- "Select Tickets" button is disabled
- Message: "This event has reached capacity"
- Event still visible in listing but clearly marked
- Option to "Join Waitlist" (if feature exists)

**Database Verification:**

```sql
-- Verify event is actually sold out
SELECT
  e.name,
  e.capacity,
  SUM(tt."quantitySold") as total_sold,
  SUM(tt."quantityAvailable") as total_available
FROM "Event" e
JOIN "TicketType" tt ON e.id = tt."eventId"
WHERE e.id = '[EVENT_ID]'
GROUP BY e.id, e.name, e.capacity;

-- If total_available = 0, event should show as sold out
-- Event status might auto-update to 'SOLD_OUT'
```

### 10.2 Expired Promo Code

**Test:**

1. Create promo code with expiration date in the past (or modify existing)
2. Attempt to apply to booking

**Expected Results:**

- Error message: "This promo code has expired"
- Promo code field shows error state (red border)
- Cart totals do not change
- Can proceed without promo code

**Database Check:**

```sql
-- Verify code is expired
SELECT
  code,
  "expiresAt",
  NOW() as current_time,
  CASE
    WHEN "expiresAt" < NOW() THEN 'Expired'
    ELSE 'Valid'
  END as status
FROM "PromoCode"
WHERE code = '[CODE]';
```

### 10.3 Promo Code Minimum Purchase Not Met

**Test:**

1. Use promo code VIP50 (requires $100 min)
2. Attempt to apply to cart with $50 subtotal

**Expected Results:**

- Error message: "This promo code requires a minimum purchase of $100.00"
- Current cart total displayed
- Amount needed displayed: "Add $50.00 more to qualify"
- Helpful suggestion to add more tickets

**Database Check:**

```sql
-- Verify minimum purchase requirement
SELECT
  code,
  "minPurchaseAmount",
  "discountValue",
  "discountType"
FROM "PromoCode"
WHERE code = 'VIP50';
```

### 10.4 Concurrent Bookings - Race Condition

**Setup:**

1. Create event with only 1 ticket remaining
2. Open two browser sessions
3. Attempt to book the last ticket in both sessions simultaneously

**Expected Results:**

**Scenario 1: Inventory Lock Works Correctly**

- First user adds ticket to cart → inventory locked
- Second user sees "Only 0 tickets available"
- First user completes booking → inventory updated
- Second user cannot proceed

**Scenario 2: Inventory Lock Expires**

- First user adds to cart but abandons
- Lock expires after 15 minutes
- Inventory released back to available pool
- Second user can now book

**Database Verification:**

```sql
-- Check inventory locks
SELECT
  il.id,
  il.quantity,
  il."expiresAt",
  il."createdAt",
  tt.name as ticket_type,
  tt."quantityAvailable",
  db."sessionId"
FROM "InventoryLock" il
JOIN "TicketType" tt ON il."ticketTypeId" = tt.id
JOIN "DraftBooking" db ON il."draftBookingId" = db.id
WHERE il."expiresAt" > NOW()
ORDER BY il."createdAt" DESC;

-- Locks should expire after set time (e.g., 15 minutes)
-- Cleanup job should remove expired locks

-- Verify inventory is not oversold
SELECT
  name,
  "quantityTotal",
  "quantitySold",
  "quantityAvailable",
  CASE
    WHEN "quantitySold" > "quantityTotal" THEN 'OVERSOLD!'
    WHEN "quantityAvailable" < 0 THEN 'NEGATIVE AVAILABLE!'
    WHEN "quantityAvailable" + "quantitySold" != "quantityTotal" THEN 'MISMATCH!'
    ELSE 'OK'
  END as inventory_check
FROM "TicketType"
WHERE "eventId" = '[EVENT_ID]';
```

### 10.5 Session Timeout During Checkout

**Test:**

1. Add tickets to cart
2. Wait for session timeout (or clear session cookies)
3. Attempt to proceed to next step

**Expected Results:**

**If Session Expires:**

- User redirected to login page
- Message: "Your session has expired. Please log in to continue."
- After re-login, cart should be restored (if using DraftBooking)

**If Cart Expires:**

- Inventory locks released
- Message: "Your reservation has expired. Please start over."
- Cart cleared
- Redirect to event page

**Database Check:**

```sql
-- Check for expired draft bookings
SELECT
  id,
  "sessionId",
  "currentStep",
  "expiresAt",
  "createdAt",
  CASE
    WHEN "expiresAt" < NOW() THEN 'Expired'
    ELSE 'Active'
  END as status
FROM "DraftBooking"
WHERE "sessionId" = '[SESSION_ID]';

-- Expired draft bookings should be cleaned up
-- Inventory locks should be released
```

### 10.6 Invalid Payment Information

**Test:**

Enter invalid payment details:

| Test Case | Card Number | Expected Error |
|-----------|-------------|----------------|
| Invalid Number | 1234 5678 9012 3456 | "Invalid card number" |
| Expired Card | 4242 4242 4242 4242, Exp: 01/20 | "Card has expired" |
| Failed CVV | Any valid card, CVV: 000 | "Invalid security code" |
| Declined Card | Use test decline card | "Your card was declined" |
| Insufficient Funds | Use test card | "Insufficient funds" |

**Expected Results:**

- Payment fails gracefully
- User-friendly error message
- Booking NOT created in database
- Inventory locks maintained
- User can retry with different payment method
- No duplicate charges

**Database Check:**

```sql
-- Verify no booking created on failed payment
SELECT
  "confirmationNumber",
  status,
  total,
  "createdAt"
FROM "Booking"
WHERE
  email = '[TEST_EMAIL]'
  AND "createdAt" > NOW() - INTERVAL '5 minutes'
ORDER BY "createdAt" DESC;

-- Should only see CONFIRMED bookings, no PENDING/FAILED
```

### 10.7 Network Interruption

**Test:**

1. Begin checkout process
2. Disconnect network during payment submission
3. Reconnect network

**Expected Results:**

- Loading state continues during network interruption
- Timeout error after reasonable wait (e.g., 30 seconds)
- Error message: "Network error. Please check your connection."
- Retry button available
- No duplicate bookings created

### 10.8 Browser Back Button During Checkout

**Test:**

1. Proceed through checkout steps
2. Use browser back button at various stages
3. Verify data persistence

**Expected Results:**

- Clicking back returns to previous step
- Form data is preserved
- Progress indicator updates correctly
- Cart remains intact
- Can proceed forward again
- No data loss

### 10.9 Duplicate Email Submission

**Test:**

1. Submit booking form
2. During processing, click submit again
3. Or refresh page and resubmit

**Expected Results:**

- Submit button disabled after first click
- Cannot double-submit
- If duplicate detected, show error or redirect to existing booking
- Only one booking created with unique confirmation number

**Database Check:**

```sql
-- Check for duplicate bookings (same email, event, time)
SELECT
  email,
  "eventId",
  COUNT(*) as booking_count,
  STRING_AGG("confirmationNumber", ', ') as confirmation_numbers
FROM "Booking"
WHERE
  email = '[EMAIL]'
  AND "eventId" = '[EVENT_ID]'
  AND "createdAt" > NOW() - INTERVAL '1 hour'
GROUP BY email, "eventId"
HAVING COUNT(*) > 1;

-- Should return 0 rows (no duplicates)
```

### 10.10 XSS / Injection Attempts

**Security Tests:**

| Field | Malicious Input | Expected Behavior |
|-------|-----------------|-------------------|
| Name | `<script>alert('XSS')</script>` | Sanitized, stored as plain text |
| Email | `test@test.com'; DROP TABLE User;--` | Rejected or escaped |
| Description | `<img src=x onerror=alert('XSS')>` | HTML tags stripped |

**Expected Results:**

- All user input sanitized
- HTML entities encoded
- SQL injection prevented by parameterized queries
- No script execution
- Validation errors for clearly invalid input

---

## 11. Database Verification

### 11.1 Event Data Integrity

**Query:**

```sql
-- Comprehensive event data validation
SELECT
  e.id,
  e.name,
  e.slug,
  e.date,
  e."endDate",
  e.capacity,
  e.status,
  COUNT(DISTINCT tt.id) as ticket_type_count,
  SUM(tt."quantityTotal") as total_capacity,
  SUM(tt."quantitySold") as total_sold,
  SUM(tt."quantityAvailable") as total_available,
  COUNT(DISTINCT b.id) as confirmed_bookings,
  -- Data integrity checks
  CASE
    WHEN e.date > e."endDate" THEN 'ERROR: Start date after end date'
    WHEN e.date < NOW() AND e.status = 'PUBLISHED' THEN 'WARNING: Past event still published'
    WHEN SUM(tt."quantitySold") > e.capacity THEN 'ERROR: Oversold'
    WHEN SUM(tt."quantitySold") + SUM(tt."quantityAvailable") != SUM(tt."quantityTotal") THEN 'ERROR: Inventory mismatch'
    ELSE 'OK'
  END as integrity_check
FROM "Event" e
LEFT JOIN "TicketType" tt ON e.id = tt."eventId"
LEFT JOIN "Booking" b ON e.id = b."eventId" AND b.status = 'CONFIRMED'
GROUP BY e.id
ORDER BY e.date DESC;
```

**Expected:** All rows should show `integrity_check = 'OK'`

### 11.2 Ticket Type Inventory Calculations

**Query:**

```sql
-- Verify ticket inventory math
SELECT
  tt.id,
  tt.name,
  tt."quantityTotal",
  tt."quantityAvailable",
  tt."quantitySold",
  -- Count actual sold tickets
  COUNT(t.id) FILTER (WHERE b.status = 'CONFIRMED') as actual_confirmed_tickets,
  -- Integrity checks
  CASE
    WHEN tt."quantityAvailable" < 0 THEN 'ERROR: Negative available'
    WHEN tt."quantitySold" > tt."quantityTotal" THEN 'ERROR: Oversold'
    WHEN tt."quantityAvailable" + tt."quantitySold" != tt."quantityTotal" THEN
      'ERROR: Math mismatch (' || (tt."quantityAvailable" + tt."quantitySold")::text || ' != ' || tt."quantityTotal"::text || ')'
    WHEN COUNT(t.id) FILTER (WHERE b.status = 'CONFIRMED') != tt."quantitySold" THEN
      'ERROR: Sold count mismatch'
    ELSE 'OK'
  END as inventory_status
FROM "TicketType" tt
LEFT JOIN "Ticket" t ON tt.id = t."ticketTypeId"
LEFT JOIN "Booking" b ON t."bookingId" = b.id
GROUP BY tt.id
ORDER BY tt."eventId", tt."sortOrder";
```

**Expected:** All `inventory_status = 'OK'`

**Formula to verify:**

```
quantityAvailable + quantitySold = quantityTotal
```

### 11.3 Booking Confirmation Numbers Unique

**Query:**

```sql
-- Check for duplicate confirmation numbers (should be impossible)
SELECT
  "confirmationNumber",
  COUNT(*) as occurrences
FROM "Booking"
GROUP BY "confirmationNumber"
HAVING COUNT(*) > 1;
```

**Expected:** 0 rows (all confirmation numbers are unique)

### 11.4 EmailLog Records for Each Booking

**Query:**

```sql
-- Verify every confirmed booking has a confirmation email
SELECT
  b."confirmationNumber",
  b.email,
  b.status,
  b."createdAt" as booking_created,
  el."templateType",
  el.status as email_status,
  el."sentAt",
  CASE
    WHEN el.id IS NULL THEN 'ERROR: No email log entry'
    WHEN el.status = 'FAILED' THEN 'WARNING: Email failed to send'
    WHEN el.status = 'PENDING' AND b."createdAt" < NOW() - INTERVAL '1 hour' THEN 'WARNING: Email pending > 1 hour'
    WHEN el.status = 'SENT' THEN 'OK'
    ELSE 'CHECK'
  END as email_check
FROM "Booking" b
LEFT JOIN "EmailLog" el ON
  b.id = el."bookingId"
  AND el."templateType" = 'BOOKING_CONFIRMATION'
WHERE b.status = 'CONFIRMED'
ORDER BY b."createdAt" DESC
LIMIT 100;
```

**Expected:** Every confirmed booking should have at least one email log entry with status 'SENT'

### 11.5 Promo Code Usage Accuracy

**Query:**

```sql
-- Verify promo code usage counts are accurate
SELECT
  pc.code,
  pc."usedCount" as stored_count,
  COUNT(b.id) as actual_bookings,
  CASE
    WHEN pc."usedCount" != COUNT(b.id) THEN
      'ERROR: Count mismatch (stored: ' || pc."usedCount"::text || ', actual: ' || COUNT(b.id)::text || ')'
    ELSE 'OK'
  END as usage_check,
  pc."maxUses",
  CASE
    WHEN pc."maxUses" IS NOT NULL AND pc."usedCount" >= pc."maxUses" THEN 'Maxed Out'
    WHEN pc."expiresAt" IS NOT NULL AND pc."expiresAt" < NOW() THEN 'Expired'
    ELSE 'Active'
  END as current_status
FROM "PromoCode" pc
LEFT JOIN "Booking" b ON
  pc.id = b."promoCodeId"
  AND b.status IN ('CONFIRMED', 'PENDING')  -- Don't count cancelled bookings
GROUP BY pc.id
ORDER BY pc."createdAt" DESC;
```

**Expected:** All `usage_check = 'OK'`

### 11.6 User Roles Correctly Assigned

**Query:**

```sql
-- Verify user roles distribution and validity
SELECT
  role,
  COUNT(*) as user_count,
  MIN("createdAt") as oldest_user,
  MAX("createdAt") as newest_user
FROM "User"
GROUP BY role
ORDER BY
  CASE role
    WHEN 'SUPER_ADMIN' THEN 1
    WHEN 'ADMIN' THEN 2
    WHEN 'USER' THEN 3
  END;

-- Check for users with invalid roles (should be none)
SELECT
  id,
  email,
  role,
  "createdAt"
FROM "User"
WHERE role NOT IN ('USER', 'ADMIN', 'SUPER_ADMIN');
```

**Expected:**

- Standard distribution: Mostly 'USER', few 'ADMIN', 1-2 'SUPER_ADMIN'
- No invalid roles

### 11.7 Orphaned Records Check

**Query:**

```sql
-- Check for orphaned tickets (booking doesn't exist)
SELECT
  t.id as ticket_id,
  t."bookingId",
  'Orphaned ticket - booking not found' as issue
FROM "Ticket" t
LEFT JOIN "Booking" b ON t."bookingId" = b.id
WHERE b.id IS NULL;

-- Check for orphaned booking guests
SELECT
  bg.id as guest_id,
  bg."bookingId",
  'Orphaned guest - booking not found' as issue
FROM "BookingGuest" bg
LEFT JOIN "Booking" b ON bg."bookingId" = b.id
WHERE b.id IS NULL;

-- Check for orphaned email logs
SELECT
  el.id as email_id,
  el."bookingId",
  'Orphaned email - booking not found' as issue
FROM "EmailLog" el
LEFT JOIN "Booking" b ON el."bookingId" = b.id
WHERE
  el."bookingId" IS NOT NULL
  AND b.id IS NULL;
```

**Expected:** All queries return 0 rows

### 11.8 Financial Totals Accuracy

**Query:**

```sql
-- Verify booking financial calculations
SELECT
  "confirmationNumber",
  subtotal,
  discount,
  "serviceFee",
  total,
  -- Recalculate total
  (subtotal - discount + "serviceFee") as calculated_total,
  -- Check if match
  CASE
    WHEN ABS(total - (subtotal - discount + "serviceFee")) > 0.01 THEN
      'ERROR: Total mismatch'
    ELSE 'OK'
  END as financial_check
FROM "Booking"
WHERE status = 'CONFIRMED'
ORDER BY "createdAt" DESC
LIMIT 100;
```

**Expected:** All `financial_check = 'OK'`

**Formula:**

```
total = subtotal - discount + serviceFee
```

### 11.9 Data Consistency Across Related Tables

**Query:**

```sql
-- Comprehensive relationship integrity check
WITH booking_summary AS (
  SELECT
    b.id as booking_id,
    b."confirmationNumber",
    b."eventId",
    b.total,
    COUNT(DISTINCT t.id) as ticket_count,
    SUM(t.price) as sum_ticket_prices
  FROM "Booking" b
  LEFT JOIN "Ticket" t ON b.id = t."bookingId"
  WHERE b.status = 'CONFIRMED'
  GROUP BY b.id
)
SELECT
  bs."confirmationNumber",
  bs.ticket_count,
  bs.sum_ticket_prices,
  bs.total as booking_total,
  CASE
    WHEN bs.ticket_count = 0 THEN 'ERROR: No tickets for confirmed booking'
    WHEN bs.sum_ticket_prices IS NULL THEN 'ERROR: Ticket prices null'
    -- Allow small rounding difference
    WHEN ABS(bs.sum_ticket_prices - bs.total) > 0.02 THEN
      'WARNING: Ticket prices don\'t match total (diff: $' || ABS(bs.sum_ticket_prices - bs.total)::text || ')'
    ELSE 'OK'
  END as consistency_check
FROM booking_summary bs
ORDER BY bs.booking_id DESC
LIMIT 100;
```

---

## 12. Performance Checks

### 12.1 Admin Dashboard Load Time

**Test:**

1. Open browser DevTools (Network tab)
2. Navigate to `/admin` dashboard
3. Record page load metrics

**Expected Performance:**

| Metric | Target | Acceptable | Unacceptable |
|--------|--------|------------|--------------|
| Initial HTML | < 300ms | < 500ms | > 1s |
| Full Page Load | < 1.5s | < 2s | > 3s |
| Time to Interactive | < 2s | < 3s | > 5s |
| First Contentful Paint | < 1s | < 1.5s | > 2s |

**What to Measure:**

- Server response time (TTFB)
- Total page weight
- Number of HTTP requests
- JavaScript bundle size
- Database query count

**Database Query Optimization:**

```sql
-- Check for slow queries (enable query logging in PostgreSQL)
-- Query should complete in < 100ms for dashboard stats

EXPLAIN ANALYZE
SELECT
  COUNT(*) as total_bookings,
  SUM(total) as total_revenue
FROM "Booking"
WHERE status = 'CONFIRMED';

-- Expected: Execution time < 100ms
-- Should use index on status column
```

### 12.2 Event List Filter Performance

**Test:**

1. Navigate to Events page with 100+ events
2. Apply status filter
3. Search by event name
4. Measure response time

**Expected:**

- Filter applies in < 500ms
- Search results update in < 300ms
- No visible lag when typing (debounced)
- Pagination loads quickly

**Database Index Check:**

```sql
-- Verify indexes exist for filtering
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE
  schemaname = 'public'
  AND tablename = 'Event';

-- Expected indexes:
-- - slug (unique)
-- - status
-- - date
```

### 12.3 Search by Email Responsiveness

**Test:**

1. Navigate to Bookings page
2. Search for booking by email
3. Measure response time with varying result counts

**Test Cases:**

| Result Count | Expected Response Time |
|--------------|------------------------|
| 1 result | < 200ms |
| 10 results | < 300ms |
| 100 results | < 500ms |
| 1000 results | < 1s |

**Database Performance:**

```sql
-- Search query should be optimized
EXPLAIN ANALYZE
SELECT
  b.*,
  e.name as event_name
FROM "Booking" b
JOIN "Event" e ON b."eventId" = e.id
WHERE
  LOWER(b.email) LIKE LOWER('%test%')
LIMIT 50;

-- Should use index on email column
-- Execution time < 100ms for typical searches
```

### 12.4 Booking Details Page Load

**Test:**

1. Open booking details page
2. Measure page load time
3. Check for N+1 query issues

**Expected:**

- Page loads in < 1s
- All related data loads in single query or efficiently batched
- No sequential database queries (use JOIN or includes)

**Database Optimization:**

```sql
-- Efficient query for booking details (single query with JOINs)
EXPLAIN ANALYZE
SELECT
  b.*,
  e.name as event_name,
  e.date as event_date,
  u.email as user_email,
  pc.code as promo_code,
  json_agg(
    json_build_object(
      'id', t.id,
      'ticketType', tt.name,
      'price', t.price,
      'attendeeName', t."attendeeName"
    )
  ) as tickets
FROM "Booking" b
JOIN "Event" e ON b."eventId" = e.id
LEFT JOIN "User" u ON b."userId" = u.id
LEFT JOIN "PromoCode" pc ON b."promoCodeId" = pc.id
LEFT JOIN "Ticket" t ON b.id = t."bookingId"
LEFT JOIN "TicketType" tt ON t."ticketTypeId" = tt.id
WHERE b.id = '[BOOKING_ID]'
GROUP BY b.id, e.id, u.id, pc.id;

-- Should execute in < 50ms
```

### 12.5 Large Dataset Handling

**Test:**

Create test data:

- 1000 events
- 10,000 bookings
- 50,000 tickets

Measure:

1. Events list pagination (page load time)
2. Bookings search (response time)
3. Dashboard stats calculation

**Expected:**

- All operations complete in < 2s
- Pagination prevents loading all records
- Indexes prevent full table scans
- Database queries remain efficient

---

## 13. Mobile Responsiveness

### 13.1 Admin Dashboard on Mobile

**Test Devices:**

- iPhone SE (375px width)
- iPhone 12/13 (390px width)
- iPad (768px width)
- Android Phone (360px - 414px width)

**Test:**

1. Open dashboard on mobile device
2. Check layout adapts correctly
3. Test all interactive elements

**Expected Mobile Layout:**

- Side navigation collapses to hamburger menu
- Stat cards stack vertically (1 column)
- Tables become horizontally scrollable
- Buttons are large enough to tap (min 44px)
- Text remains readable (min 16px)
- No horizontal overflow
- Touch targets don't overlap

**CSS Breakpoints to Test:**

```css
/* Mobile */
@media (max-width: 640px) {
  /* Single column layout */
}

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) {
  /* 2 column layout */
}

/* Desktop */
@media (min-width: 1025px) {
  /* Full layout */
}
```

### 13.2 Event Form on Mobile

**Test:**

1. Create/edit event on mobile device
2. Fill out all form fields
3. Test date/time pickers
4. Submit form

**Expected:**

- Form fields are full-width on mobile
- Labels above inputs (not side-by-side)
- Native date/time pickers on mobile
- Dropdown menus work correctly
- File upload works
- Form validation messages visible
- Submit button fixed to bottom or easily accessible
- Keyboard doesn't obscure active field

### 13.3 Bookings Table Responsiveness

**Test:**

1. View bookings table on mobile
2. Scroll horizontally if needed
3. Test filters and search
4. Click on booking to view details

**Expected Mobile Behavior:**

**Option 1: Scrollable Table**

- Table scrolls horizontally
- Most important columns visible first
- Scroll indicator visible

**Option 2: Card View**

- Table converts to card-based layout
- Each booking is a tappable card
- Key info visible in card (confirmation #, event, total)

**Expected:**

- All data accessible
- No text cutoff
- Action buttons remain accessible
- Search and filters work correctly

### 13.4 Touch Target Sizes

**Test:**

Measure all interactive elements:

- Buttons
- Links
- Form inputs
- Checkboxes
- Radio buttons
- Dropdown toggles

**Expected:**

- Minimum touch target: 44px × 44px (Apple guideline)
- Recommended: 48px × 48px (Material Design)
- Adequate spacing between targets (8px minimum)
- No overlapping clickable areas

**Common Issues to Check:**

- Small "X" close buttons
- Tiny action icons
- Compact table rows
- Closely-spaced filter chips

### 13.5 Viewport and Zoom

**Test:**

1. Open admin panel on mobile
2. Pinch to zoom
3. Verify layout doesn't break
4. Check viewport meta tag

**Expected:**

- Viewport meta tag set correctly:
  ```html
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ```
- Zoom is allowed (don't disable)
- Layout adapts to zoom
- Text remains readable when zoomed
- No horizontal scrolling at default zoom

### 13.6 Mobile Browser Testing

**Browsers to Test:**

- Safari (iOS)
- Chrome (Android)
- Firefox (Android)
- Samsung Internet
- Chrome (iOS)

**Features to Verify:**

- CSS compatibility
- JavaScript functionality
- Form inputs work correctly
- Date pickers display properly
- Payment forms work
- Camera upload (for ticket uploads)

---

## 14. Test Results Summary

### Results Tracking Table

Use this table to track your testing progress and results:

| Test ID | Test Name | Priority | Status | Result | Notes | Tester | Date |
|---------|-----------|----------|--------|--------|-------|--------|------|
| 2.1 | Admin Login | High | ☐ | | | | |
| 2.2 | Dashboard Display | High | ☐ | | | | |
| 2.3 | Navigation | Medium | ☐ | | | | |
| 3.1 | View Events List | High | ☐ | | | | |
| 3.2 | Create Event | High | ☐ | | | | |
| 3.3 | Edit Event | High | ☐ | | | | |
| 3.4 | Publish Event | High | ☐ | | | | |
| 3.5 | Event Details | Medium | ☐ | | | | |
| 4.1 | Create Ticket Types | High | ☐ | | | | |
| 4.2 | Edit Ticket Pricing | High | ☐ | | | | |
| 4.3 | Inventory Verification | High | ☐ | | | | |
| 4.4 | Availability Windows | Medium | ☐ | | | | |
| 5.1 | Browse Bookings | High | ☐ | | | | |
| 5.2 | Search Bookings | High | ☐ | | | | |
| 5.3 | Filter Bookings | Medium | ☐ | | | | |
| 5.4 | Booking Details | High | ☐ | | | | |
| 5.5.1 | Resend Email | Medium | ☐ | | | | |
| 5.5.2 | Cancel Booking | High | ☐ | | | | |
| 6.1 | View Promo Codes | Medium | ☐ | | | | |
| 6.2 | Create Promo Code | Medium | ☐ | | | | |
| 6.3 | Discount Calculations | High | ☐ | | | | |
| 6.4 | Usage Tracking | Medium | ☐ | | | | |
| 6.5 | Code Expiry | Medium | ☐ | | | | |
| 7.1 | List Users | Medium | ☐ | | | | |
| 7.2 | User Details | Medium | ☐ | | | | |
| 7.3 | Role Assignments | High | ☐ | | | | |
| 7.4 | User Booking History | Medium | ☐ | | | | |
| 8.1-8.10 | Guest Booking Flow | Critical | ☐ | | | | |
| 9.1-9.6 | Authenticated Booking | High | ☐ | | | | |
| 10.1 | Sold-Out Event | High | ☐ | | | | |
| 10.2 | Expired Promo | Medium | ☐ | | | | |
| 10.3 | Min Purchase | Medium | ☐ | | | | |
| 10.4 | Concurrent Bookings | Critical | ☐ | | | | |
| 10.5 | Session Timeout | Medium | ☐ | | | | |
| 10.6 | Invalid Payment | High | ☐ | | | | |
| 10.7 | Network Error | Medium | ☐ | | | | |
| 10.8 | Browser Back | Low | ☐ | | | | |
| 10.9 | Duplicate Submit | Medium | ☐ | | | | |
| 10.10 | XSS/Injection | Critical | ☐ | | | | |
| 11.1-11.9 | Database Integrity | Critical | ☐ | | | | |
| 12.1 | Dashboard Performance | Medium | ☐ | | | | |
| 12.2 | Filter Performance | Medium | ☐ | | | | |
| 12.3 | Search Performance | Medium | ☐ | | | | |
| 12.4 | Details Load Time | Low | ☐ | | | | |
| 12.5 | Large Dataset | Low | ☐ | | | | |
| 13.1 | Mobile Dashboard | Medium | ☐ | | | | |
| 13.2 | Mobile Forms | Medium | ☐ | | | | |
| 13.3 | Mobile Tables | Medium | ☐ | | | | |
| 13.4 | Touch Targets | Medium | ☐ | | | | |
| 13.5 | Viewport/Zoom | Low | ☐ | | | | |
| 13.6 | Browser Compat | Medium | ☐ | | | | |

### Status Legend

- ☐ Not Started
- 🔄 In Progress
- ✅ Pass
- ❌ Fail
- ⚠️ Partial Pass / Needs Review
- ⏸️ Blocked

### Priority Levels

- **Critical**: Must fix before release (security, data integrity)
- **High**: Core functionality, fix before release
- **Medium**: Important but not blocking
- **Low**: Nice to have, can be addressed later

### Summary Statistics Template

```
Total Tests: 50+
Completed: __
Passed: __
Failed: __
Blocked: __
Pass Rate: __%

Critical Issues: __
High Priority Issues: __
Medium Priority Issues: __
Low Priority Issues: __

Tested By: ________________
Date Range: ________________
Environment: ________________
```

---

## Appendix A: Database Connection

### PostgreSQL Connection

```bash
# Connect to database
psql $DATABASE_URL

# Or with individual params
psql -h localhost -p 5432 -U postgres -d festivalights
```

### Useful Database Commands

```sql
-- List all tables
\dt

-- Describe table structure
\d "Booking"

-- Show table sizes
SELECT
  relname as table_name,
  pg_size_pretty(pg_total_relation_size(relid)) as total_size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;

-- Show index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Check for missing indexes
SELECT
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY abs(correlation) DESC;
```

---

## Appendix B: Common Issues and Solutions

### Issue: Dashboard stats show incorrect numbers

**Debugging:**

1. Run database verification queries
2. Check for cancelled bookings being counted
3. Verify date ranges in queries
4. Check for duplicate records

**Solution:**

```sql
-- Correct query for total revenue
SELECT SUM(total)
FROM "Booking"
WHERE status = 'CONFIRMED';  -- Don't include CANCELLED or REFUNDED
```

### Issue: Inventory oversold

**Debugging:**

1. Check inventory lock mechanism
2. Verify lock expiration cleanup runs
3. Check for race conditions in concurrent bookings

**Solution:**

- Ensure inventory locks are created atomically
- Implement cleanup job for expired locks
- Use database transactions for inventory updates

### Issue: Emails not sending

**Debugging:**

1. Check EmailLog table for errors
2. Verify SMTP credentials in environment variables
3. Check email queue worker is running
4. Test email service independently

**Solution:**

```sql
-- Check recent email failures
SELECT
  "recipientEmail",
  "templateType",
  status,
  error,
  attempts,
  "createdAt"
FROM "EmailLog"
WHERE status = 'FAILED'
ORDER BY "createdAt" DESC
LIMIT 20;
```

### Issue: Promo code not applying

**Debugging:**

1. Verify code exists and is spelled correctly
2. Check expiration date
3. Verify minimum purchase requirement
4. Check usage limit

**Solution:**

```sql
-- Debug promo code
SELECT
  code,
  "discountType",
  "discountValue",
  "expiresAt",
  "minPurchaseAmount",
  "maxUses",
  "usedCount",
  CASE
    WHEN "expiresAt" < NOW() THEN 'Expired'
    WHEN "maxUses" IS NOT NULL AND "usedCount" >= "maxUses" THEN 'Max uses reached'
    ELSE 'Should work'
  END as status
FROM "PromoCode"
WHERE code = 'YOUR_CODE';
```

---

## Appendix C: Testing Best Practices

### Before Testing

1. Reset database to known state
2. Create test data
3. Clear browser cache and cookies
4. Use incognito/private browsing for guest tests
5. Have database client open for verification

### During Testing

1. Document each step taken
2. Take screenshots of errors
3. Note timestamps for performance tests
4. Save database query results
5. Record browser console errors

### After Testing

1. Run database integrity checks
2. Review all failed tests
3. Categorize issues by priority
4. Create bug reports with reproduction steps
5. Update test status in tracking table

### Bug Report Template

```markdown
## Bug Report

**Test ID**: [e.g., 5.2]
**Test Name**: [e.g., Search Bookings by Email]
**Priority**: [Critical/High/Medium/Low]
**Status**: [New/In Progress/Fixed/Closed]

### Environment
- Browser: [e.g., Chrome 120]
- Device: [e.g., Desktop, iPhone 12]
- OS: [e.g., macOS 14.0]
- URL: [Page where bug occurred]

### Steps to Reproduce
1.
2.
3.

### Expected Result
[What should happen]

### Actual Result
[What actually happened]

### Screenshots
[Attach screenshots]

### Database State
[Relevant database query results]

### Console Errors
[Browser console errors if any]

### Notes
[Additional context]
```

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-09 | QA Team | Initial creation |

---

**End of Manual Testing Checklist**

For questions or issues with this documentation, contact the development team.
