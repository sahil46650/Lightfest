# TicketSocket API v2 Reference

This document serves as a comprehensive reference for migrating from TicketSocket API v1 to v2. The v2 API provides improved consistency, better error handling, and additional features.

## Table of Contents

1. [API Overview](#api-overview)
2. [Key Changes from v1](#key-changes-from-v1)
3. [Authentication](#authentication)
4. [Events](#events)
5. [Ticket Types](#ticket-types)
6. [Cart Operations](#cart-operations)
7. [Orders](#orders)
8. [Payment Processing](#payment-processing)
9. [Promo Codes](#promo-codes)
10. [Data Schemas](#data-schemas)
11. [Migration Guide](#migration-guide)

---

## API Overview

**Base URL:** `https://{instance}.tscheckout.com/api/v2`

All endpoints follow the pattern `/api/v2/{resource}`.

### Response Format

All responses follow a consistent structure:

```typescript
// List Response
interface ListResponse<T> {
  totalCount: number;
  count: number;
  limit: number;
  offset: number;
  data: T[];
}

// Single Response
interface SingleResponse<T> {
  count: number;
  data: T;
}

// Error Response
interface ErrorResponse {
  data: {
    field?: string;
    message: string;
  };
  count: number;
}
```

### Common Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `_limit` | integer | Max number of results to return |
| `_offset` | integer | Number of results to skip |
| `_search` | string | Text search across relevant fields |
| `_select` | string | Comma-separated list of fields to return |
| `_include` | string | Additional related data to include |
| `_orderBy` | string | Sort order (prefix with `-` for descending) |

---

## Key Changes from v1

| Feature | v1 | v2 |
|---------|----|----|
| Base path | `/api/v1` | `/api/v2` |
| Auth endpoint | `/tokens` | `/auth-token` or `/administrator/login` |
| Auth body | `userName`, `publicKey`, `publicKeySlug` | `login`, `password` |
| Event ticket types | `/events/{id}/ticket-types` | `/event/{id}/ticket-type` |
| Order describe | N/A | `/order/describe` |
| Order complete | N/A | `/order/complete` |
| Promo code validation | N/A | `/promo-code/{id}/applies-to-ticket-type` |
| Promo code discount calc | N/A | `/promo-code/{id}/calculate-discount` |

---

## Authentication

### Administrator Login

**POST** `/api/v2/administrator/login`

Authenticate an administrator and receive a JWT token.

```typescript
// Request
interface LoginRequest {
  login: string;      // Username/email
  password: string;   // Password
}

// Optional query params
// _include: "user,perms" - Include user info and permissions

// Response
interface LoginResponse {
  token: string;      // JWT bearer token
  admin?: {
    email: string;
  };
  perms?: object;     // Permissions object
}
```

**Example:**

```bash
curl -X POST https://instance.tscheckout.com/api/v2/administrator/login \
  -H "Content-Type: application/json" \
  -d '{"login": "user@example.com", "password": "secret"}'
```

### Token Authentication

**POST** `/api/v2/auth-token`

Generate a JWT token from username and password.

```typescript
interface AuthTokenRequest {
  login: string;
  password: string;
}
```

### Check Token Validity

**GET** `/api/v2/auth-token/check`

Verify if the current token is valid.

**Headers:**
```
Authorization: Bearer <token>
```

---

## Events

### List Events

**GET** `/api/v2/event`

Retrieve a list of events with filtering options.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `title` | string | Exact title match (use `%` for wildcard) |
| `search` | string | Search in title, description, venue, address |
| `fromStart` | unix timestamp | Events starting on/after this date |
| `toStart` | unix timestamp | Events starting before this date |
| `fromEnd` | unix timestamp | Events ending on/after this date |
| `toEnd` | unix timestamp | Events ending before this date |
| `status` | string | Filter by availability status (see below) |
| `onsale` | string | Filter by on-sale status |
| `published` | string | Filter by published status |
| `updatedSince` | unix timestamp | Events modified since this date |
| `_include` | string | `tags`, `waveTimes`, `sold` |
| `_orderBy` | string | `ordering`, `title`, `start`, `id` |

**Status Values:**

| Value | Description |
|-------|-------------|
| `all` | All events |
| `availableonline` | Currently available for online purchase |
| `upcomingonline` | Scheduled for online sale in future |
| `availableupcomingonline` | Available or upcoming online |
| `availableboxoffice` | Available at box office |
| `upcomingboxoffice` | Upcoming box office |
| `availableupcomingboxoffice` | Available or upcoming box office |
| `upcoming` | Start date in the future |
| `ongoing` | Started but not ended |
| `elapsed` | End date in the past |

**Response:**

```typescript
interface Event {
  id: string;
  title: string;
  start: string;              // Unix timestamp
  end?: string;               // Unix timestamp
  venue?: Venue;
  cutOff?: string;            // Sales cutoff timestamp
  onSaleDate?: string;        // On-sale start timestamp
  publishedDate?: string;     // Publish timestamp
  published?: number;         // 0 or 1
  hideDate?: number;          // 0 or 1
  hideTime?: number;          // 0 or 1
  smallPic?: string;          // URL
  largePic?: string;          // URL
  shortDescription?: string;
  category?: string;
  ordering?: number;
  location?: string;
  sefUrl?: string;            // SEO-friendly URL slug
  timezone?: string;          // IANA timezone
  inventory?: {
    sold: number;
    total: number | null;
  };
}

interface Venue {
  name?: string;
  address?: Address;
}

interface Address {
  street?: string;
  street2?: string;
  city?: string;
  zip?: string;
  phone?: string;
  country?: string;
  internationalAddress?: string;
}
```

### Get Single Event

**GET** `/api/v2/event/{id}`

Retrieve a single event by ID.

### Get Event Ticket Types

**GET** `/api/v2/event/{id}/ticket-type`

Get ticket types for a specific event.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `_limit` | integer | Max results |
| `_offset` | integer | Offset |
| `_select` | string | Specific columns |

### Get Event Wave Times

**GET** `/api/v2/event/{id}/wave-times`

Get wave/start times for an event.

---

## Ticket Types

### List Ticket Types

**GET** `/api/v2/ticket-type/`

Query ticket types across all events.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Name filter (use `%` for wildcard) |
| `eventId` | integer | Filter by event ID(s) (comma-separated) |
| `waveTime` | integer | Filter by wave time ID(s) |
| `key` | string | Key filter (use `%` for wildcard) |
| `groupKey` | string | Group key filter |
| `updatedSince` | unix timestamp | Modified since date |
| `_include` | string | `tags`, `sold`, `waveTimes`, `shipping`, `bulkDiscount` |
| `_orderBy` | string | `ordering`, `name`, `id` |

### Get Single Ticket Type

**GET** `/api/v2/ticket-type/{id}`

### Get Ticket Type Name

**GET** `/api/v2/ticket-type/get-name?id={id}`

---

## Cart Operations

### Build Cart Items

**POST** `/api/v2/cart/build-cart-items`

Build line items from ticket selections with pricing calculations.

**Request Body:**

```typescript
interface BuildCartItemsRequest {
  // Cart options
  includeFees?: number;       // 1 to include fees as line items

  // Customer info
  basicInfo?: {
    firstName: string;
    lastName: string;
    emailAddress: string;
  };

  // Tickets
  tickets?: CreateOrderTicket[];

  // Discounts
  promoCodes?: Array<{ code: string }>;

  // Order-level questions
  orderAnswers?: CreateOrderAnswer[];

  // Shipping
  shippingOptions?: Array<{
    typeId: number;
    shippingOptionId: number;
  }>;

  // Insurance
  insuranceInfo?: {
    optedIn?: number;
    price?: number;
    quote?: string;
    protectionProduct?: string;
    vendor?: string;
  };
}

interface CreateOrderTicket {
  typeId: number;
  attendeeFirstName?: string;
  attendeeLastName?: string;
  attendeeEmailAddress?: string;
  attendeeBirthMonth?: number;    // 1-12
  attendeeBirthDay?: number;      // 1-31
  attendeeBirthYear?: number;     // YYYY
  attendeeGender?: string;        // M/F
  attendeeTitle?: string;
  attendeeCompany?: string;
  attendeePhone?: string;
  notForPurchaser?: number;       // 0 or 1
  externalCustomerId?: string;
  attendeeAddress?: {
    address?: string;
    address2?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  ticketAnswers?: CreateOrderAnswer[];
  claimInfo?: {
    isClaim?: number;
    claimantEmailAddress?: string;
  };
}

interface CreateOrderAnswer {
  questionId: number;
  answerId?: number;
  answerText?: string;
  quantity?: number;
  displayText?: string;
}
```

### Process Cart (Describe Order)

**POST** `/api/v2/cart`

Process cart data to calculate what order would be created.

**Request Body:**

Same as `build-cart-items` plus:

```typescript
interface ProcessCartRequest extends BuildCartItemsRequest {
  paymentMethod?: 'credit' | 'cash' | 'sezzle';
}
```

### Describe Order

**POST** `/api/v2/order/describe`

Alternative endpoint for cart processing (same request/response as `/cart`).

### Rebuild Cart from Order

**GET** `/api/v2/cart/build-cart-items-from-order-id?orderId={id}`

Rebuild cart items from an existing order.

---

## Orders

### List Orders

**GET** `/api/v2/order`

Query orders with extensive filtering options.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Search name, email, barcode, order # |
| `emailAddress` | string | Purchaser email |
| `event` | integer | Event ID (comma-separated for multiple) |
| `ticketType` | integer | Ticket type ID |
| `purchaseLocation` | string | Purchase location filter |
| `creditCardNumber` | string | Last 4 digits of card |
| `paymentMethod` | string | Payment method filter |
| `promoCode` | integer | Promo code ID |
| `promoCodeGroup` | string | Promo code group name |
| `orderStatus` | string | `active`, `cancelled`, `refunded`, `partialCancelled`, `partialRefunded` |
| `ticketStatus` | string | `purchased`, `checkedIn`, `cancelled`, `refunded` |
| `changeStatus` | string | `transferred`, `upgraded`, `claimed`, `unclaimed`, `withdrawn`, `eventChange` |
| `fromPurchaseDate` | string | Start date filter |
| `toPurchaseDate` | string | End date filter |
| `fromLastUpdate` | string | Modified start date |
| `toLastUpdate` | string | Modified end date |
| `fromTicketPrice` | number | Min ticket price |
| `toTicketPrice` | number | Max ticket price |
| `_include` | string | See below |

**Include Options:**

- `answers` - Include question answers
- `tickets` - Include ticket details
- `promoCodes` - Include applied promo codes
- `hash` - Include order hash
- `costs` - Include cost breakdown
- `purchaseProtected` - Include protection info
- `ticketCount` - Include ticket count
- `change` - Include related order IDs
- `promoter` - Include promoter info
- `waveTime` - Include wave time
- `waivers` - Include signed waivers
- `user` - Include user info

### Get Single Order

**GET** `/api/v2/order/{id}`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `includeTickets` | boolean | Include ticket details |
| `includeAnswers` | boolean | Include question answers |
| `includeCosts` | boolean | Include cost breakdown |

**Response:**

```typescript
interface Order {
  id: string;
  created: string;
  purchasedDate: string;
  status: OrderStatus;
  emailAddress: string;
  total: number;
  purchaser?: Person;
  affiliate?: string;
  paymentMethod?: string;
  lastFour?: string;
  tickets?: Ticket[];
  transactions?: Transaction[];
  answers?: Answer[];
}

type OrderStatus =
  | 'active'
  | 'cancelled'
  | 'partially cancelled'
  | 'refunded'
  | 'refunded cancelled'
  | 'partial refund';
```

### Create Order

**POST** `/api/v2/order`

Create an order after payment has been verified.

**Request Body:**

```typescript
interface CreateOrderRequest {
  order: string;  // Cart token/reference from shopping cart
}
```

**Response Codes:**

| Code | Description |
|------|-------------|
| 200 | Order created successfully |
| 202 | Payment still processing (returns status and token) |
| 204 | Order created (when result=none) |
| 400 | Error occurred |
| 401 | Auth token expired |
| 409 | Payment process hasn't started |
| 410 | Cart timer expired |

### Complete Order

**POST** `/api/v2/order/complete`

Complete a staged order and run post-order processes.

**Request Body:**

```typescript
interface CompleteOrderRequest {
  orderId?: number;
  orderGuid?: string;
}
```

---

## Payment Processing

### Process Payment

**POST** `/api/v2/payment/process`

Process a payment method.

**Request Body:**

```typescript
interface PaymentData {
  totalAmount: number;
  splitAmount?: number;  // Amount to split to application
}
```

### Stripe SDK Token

**GET** `/api/v2/payment-processor/stripe/sdk`

Get Stripe SDK authorization token.

### Stripe Terminals

**GET** `/api/v2/payment-processor/stripe/terminal`

List available Stripe terminals.

---

## Promo Codes

### List Promo Codes

**GET** `/api/v2/promo-code/`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `_search` | string | Search codes |
| `code` | string | Exact code match |
| `expired` | boolean | Filter by expiration |

### Get Promo Code

**GET** `/api/v2/promo-code/{id}`

### Create Promo Code

**POST** `/api/v2/promo-code`

**Request Body:**

```typescript
interface PromoCodeData {
  code: string;
  type: 'flat' | 'percentage' | 'specific' | 'specificTag';
  discount: number;
  active: boolean;
  activeFrom?: number;      // Unix timestamp
  activeTo?: number;        // Unix timestamp
  description?: string;
  promoter?: number;
  usesLimit?: number;
  userUsesLimit?: number;
  codeGroup?: string;
  minQuantity?: number;
  discountAddOns?: boolean;
  discountShipping?: boolean;
  passId?: number;
  transferTicketId?: number;
  promoCodeTagPricePair?: Array<{
    tag: string;
    price: number;
  }>;
}
```

### Check Promo Code Applicability

**GET** `/api/v2/promo-code/{id}/applies-to-ticket-type?typeId={typeId}`

Check if a promo code can be applied to a specific ticket type.

### Calculate Discount

**GET** `/api/v2/promo-code/{id}/calculate-discount`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `typeId` | integer | Ticket type to apply discount to |
| `price` | float | Original price |
| `appliedAmount` | float | Amount already applied (for stored value codes) |

---

## Data Schemas

### Ticket

```typescript
interface Ticket {
  id: string;
  status: 'active' | 'checked in' | 'cancelled' | 'other';
  price: number;
  attendee?: string;
  name: string;
  attendeeAddress?: Person;
  answers?: Answer[];
}
```

### Fees

```typescript
interface Fees {
  serviceFee: number;
  processingFee: number;
  otherFee: number;
}

interface Charges {
  tickets: number;
  tax: number;
  gratuity: number;
  shipping: number;
  fees: Fees;
}
```

### Billing Info

```typescript
interface BillingInfo {
  firstName: string;
  lastName: string;
  address: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
}
```

### Payment Info

```typescript
interface PaymentInfo {
  card?: {
    number: string;
    expMonth: string;
    expYear: string;
    code: string;
  };
  stripe?: {
    paymentIntentId?: string;
    token?: string;
  };
  square?: {
    token: string;
  };
  digitzs?: {
    tokenId: string;
    customerId?: string;
  };
  globalPay?: {
    token: string;
  };
}
```

---

## Migration Guide

### Step 1: Update Base URL

```typescript
// Before (v1)
const baseUrl = 'https://instance.tscheckout.com/api/v1';

// After (v2)
const baseUrl = 'https://instance.tscheckout.com/api/v2';
```

### Step 2: Update Authentication

```typescript
// Before (v1) - /tokens endpoint
const loginRequest = {
  userName: 'user@example.com',
  password: 'secret',
  publicKey: 'key',
  publicKeySlug: 'slug',
};
const response = await fetch(`${baseUrl}/tokens`, {
  method: 'POST',
  body: JSON.stringify(loginRequest),
});

// After (v2) - /administrator/login or /auth-token
const loginRequest = {
  login: 'user@example.com',
  password: 'secret',
};
const response = await fetch(`${baseUrl}/administrator/login`, {
  method: 'POST',
  body: JSON.stringify(loginRequest),
});
```

### Step 3: Update Endpoint Paths

| v1 Endpoint | v2 Endpoint |
|-------------|-------------|
| `/events` | `/event` |
| `/events/{id}` | `/event/{id}` |
| `/events/{id}/ticket-types` | `/event/{id}/ticket-type` |
| `/orders` | `/order` |
| `/orders/{id}` | `/order/{id}` |
| `/promo-codes` | `/promo-code` |
| `/ticket-types` | `/ticket-type/` |

### Step 4: Update Cart Operations

The cart operations remain similar but use the v2 base path:

```typescript
// v2 Cart endpoints
POST /api/v2/cart/build-cart-items
POST /api/v2/cart
GET  /api/v2/cart/build-cart-items-from-order-id?orderId={id}

// New in v2
POST /api/v2/order/describe  // Alternative to POST /cart
POST /api/v2/order/complete  // Complete staged order
```

### Step 5: Handle New Order Flow

v2 introduces a staged order completion flow:

```typescript
// 1. Build cart items
const cartItems = await client.buildCartItems(request);

// 2. Process cart (describe order)
const orderDescription = await client.processCart(request);

// 3. Process payment externally (e.g., via PayVia iframe)

// 4. Create order after payment verification
const order = await client.createOrder({ order: cartToken });

// 5. Complete staged order (if using staged flow)
await client.completeOrder({ orderId: order.id });
```

### Step 6: Update Type Definitions

Update your TypeScript types to match v2 schemas. Key changes:

1. Event `id` remains string
2. Order status values updated
3. New payment processor options (digitzs, globalPay)
4. Insurance info structure updated

### Client Implementation Changes

```typescript
// lib/tscheckout/client.ts changes needed:

// 1. Update DEFAULT_CONFIG
const DEFAULT_CONFIG = {
  baseUrl: 'https://clevergroup.tscheckout.com/api/v2', // Changed from v1
  // ...
};

// 2. Update login endpoint
async login(credentials?: LoginRequest): Promise<LoginResponse> {
  const response = await this.request<{ token: string }>(
    '/administrator/login',  // Changed from /tokens
    {
      method: 'POST',
      body: JSON.stringify({
        login: credentials.userName,      // Changed from userName
        password: credentials.password,
      }),
    }
  );
  // ...
}

// 3. Update endpoint paths
async listEvents() {
  return this.request<ListResponse<TSEvent>>('/event');  // Changed from /events
}

async getEvent(id: string) {
  return this.request<SingleResponse<TSEvent>>(`/event/${id}`);  // Changed
}

async getTicketTypes(eventId: string) {
  return this.request<ListResponse<TicketType>>(
    `/event/${eventId}/ticket-type`  // Changed from /ticket-types
  );
}
```

---

## Additional Resources

- **API Documentation**: `/api/v2/docs.json` or `/api/v2/docs.yaml`
- **Check-In Endpoints**: `/api/v2/check-in/*`
- **Validator**: `/api/v2/validator/*`
- **Webhooks**: `/api/v2/webhooks/*`

---

## Error Handling

All errors follow a consistent format:

```typescript
{
  "data": {
    "field": "fieldName",    // Optional, indicates which field caused the error
    "message": "Error description"
  },
  "count": 1
}
```

**HTTP Status Codes:**

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad request / Validation error |
| 401 | Authentication required / Token expired |
| 403 | Forbidden / Insufficient permissions |
| 404 | Resource not found |
| 409 | Conflict (e.g., payment not started) |
| 410 | Gone (e.g., cart timer expired) |
