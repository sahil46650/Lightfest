# PayVia Embedded Checkout Integration Guide

This document provides a complete end-to-end guide for integrating the PayVia embedded checkout iframe into your application.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Environment Configuration](#environment-configuration)
3. [Step 1: Embedding the Iframe](#step-1-embedding-the-iframe)
4. [Step 2: PostMessage Communication](#step-2-postmessage-communication)
5. [Step 3: Token Creation Flow](#step-3-token-creation-flow)
6. [Step 4: Backend Authentication](#step-4-backend-authentication)
7. [Step 5: Payment Processing](#step-5-payment-processing)
8. [Complete Data Structures](#complete-data-structures)
9. [Error Handling](#error-handling)
10. [Security Considerations](#security-considerations)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        YOUR APPLICATION                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  Frontend (Browser)                                                  ││
│  │  ┌──────────────────┐    postMessage    ┌──────────────────────────┐││
│  │  │                  │ ─────────────────►│                          │││
│  │  │   Your React/    │                   │  PayVia Checkout Iframe  │││
│  │  │   Vue/Angular    │ ◄─────────────────│  (checkout.digitzs.com)  │││
│  │  │   Component      │  token-created    │                          │││
│  │  │                  │                   │  - Card form             │││
│  │  │                  │                   │  - TokenEx integration   │││
│  │  └────────┬─────────┘                   └──────────────────────────┘││
│  │           │                                                          ││
│  │           │ fetch('/api/payment')                                    ││
│  │           ▼                                                          ││
│  └─────────────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  Backend (Your Server)                                               ││
│  │  ┌──────────────────┐         ┌──────────────────────────────────┐  ││
│  │  │  /api/payment    │────────►│  PayVia API                      │  ││
│  │  │                  │         │  (api.payvia.ondeets.ai)         │  ││
│  │  │  1. Auth token   │         │                                  │  ││
│  │  │  2. Process pay  │◄────────│  - POST /v4/auth/token           │  ││
│  │  └──────────────────┘         │  - POST /v4/payments             │  ││
│  │                               └──────────────────────────────────┘  ││
│  └─────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
```

**Flow Summary:**
1. Your app embeds the PayVia checkout iframe
2. Iframe loads and sends `digitzs:ready` message
3. Your app sends checkout configuration via `postMessage`
4. User enters card details in the secure iframe (PCI compliant)
5. Iframe tokenizes card via TokenEx and sends `digitzs:token-created` message
6. Your app receives token and sends to your backend
7. Your backend authenticates with PayVia and processes payment
8. Payment result returned to frontend

---

## Environment Configuration

### Available Environments

| Environment | Checkout URL | API URL |
|-------------|--------------|---------|
| **Staging** | `https://checkout.staging.digitzs.com` | `https://api.payvia.staging.ondeets.ai` |
| **Production** | `https://checkout.digitzs.com` | `https://api.payvia.ondeets.ai` |

### Required Credentials

You will need the following credentials from PayVia:

| Credential | Description | Where Used |
|------------|-------------|------------|
| `merchantId` | Your merchant identifier | Frontend config, Payment request |
| `apiKey` | API authentication key | Backend API calls (x-api-key header) |
| `appKey` | Application key for auth | Backend authentication request |

---

## Step 1: Embedding the Iframe

### Basic HTML Structure

```html
<iframe
  id="payvia-checkout"
  src="https://checkout.staging.digitzs.com"
  style="width: 100%; height: 500px; border: none;"
  title="PayVia Checkout"
  allow="payment"
></iframe>
```

### React/TypeScript Implementation

```typescript
import { useRef, useState, useEffect } from 'react';

interface EmbeddedCheckoutProps {
  environment: 'staging' | 'production';
  onPaymentStart: () => void;
  onPaymentSuccess: (transactionId: string) => void;
  onPaymentError: (error: string) => void;
}

const CHECKOUT_URLS = {
  staging: 'https://checkout.staging.digitzs.com',
  production: 'https://checkout.digitzs.com',
};

export function EmbeddedCheckout({
  environment,
  onPaymentStart,
  onPaymentSuccess,
  onPaymentError,
}: EmbeddedCheckoutProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isIframeReady, setIsIframeReady] = useState(false);
  const [iframeHeight, setIframeHeight] = useState(500);

  const checkoutUrl = CHECKOUT_URLS[environment];

  return (
    <div className="checkout-container">
      <iframe
        ref={iframeRef}
        src={checkoutUrl}
        style={{
          width: '100%',
          height: `${iframeHeight}px`,
          border: 'none',
        }}
        title="PayVia Checkout"
        allow="payment"
      />
    </div>
  );
}
```

---

## Step 2: PostMessage Communication

### Message Types Overview

| Message Type | Direction | Description |
|--------------|-----------|-------------|
| `digitzs:ready` | Iframe → Parent | Iframe is loaded and ready |
| `digitzs:init-checkout` | Parent → Iframe | Send checkout configuration |
| `digitzs:token-created` | Iframe → Parent | Card tokenized successfully |
| `digitzs:error` | Iframe → Parent | Error occurred |
| `digitzs:resize` | Iframe → Parent | Iframe requests height change |
| `digitzs:validation-error` | Iframe → Parent | Form validation failed |

### Setting Up Message Listener

```typescript
useEffect(() => {
  const handleMessage = async (event: MessageEvent) => {
    // IMPORTANT: Validate origin for security
    const allowedOrigins = [
      'https://checkout.staging.digitzs.com',
      'https://checkout.digitzs.com',
    ];

    if (!allowedOrigins.includes(event.origin)) {
      console.warn('Rejected message from untrusted origin:', event.origin);
      return;
    }

    switch (event.data.type) {
      case 'digitzs:ready':
        console.log('Iframe is ready');
        setIsIframeReady(true);
        sendCheckoutConfig(); // Send initial configuration
        break;

      case 'digitzs:token-created':
        console.log('Token created:', event.data.data);
        await handleTokenCreated(event.data.data);
        break;

      case 'digitzs:error':
        console.error('Error from iframe:', event.data.error);
        onPaymentError(event.data.error?.message || 'Unknown error');
        break;

      case 'digitzs:resize':
        if (event.data.height) {
          setIframeHeight(event.data.height);
        }
        break;

      case 'digitzs:validation-error':
        console.log('Form validation error');
        break;
    }
  };

  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, []);
```

### Sending Checkout Configuration

When the iframe sends `digitzs:ready`, respond with the checkout configuration:

```typescript
interface CheckoutConfig {
  amount: number;              // Amount in dollars (e.g., 10.00)
  merchantId: string;          // Your PayVia merchant ID
  email: string;               // Customer email (pre-filled)
  zipCode?: string;            // Customer ZIP code (pre-filled)
  cardHolderName: string;      // Cardholder name (pre-filled)
  invoice: string;             // Your order/invoice ID
  isZipCodeEnabled: boolean;   // Show ZIP code field
  isEmailEnabled: boolean;     // Show email field
  defaultPaymentMethod: string; // 'card' for credit card
  styles?: {                   // Optional styling
    backgroundColor?: string;
    buttonColor?: string;
    buttonTextColor?: string;
    inputBorderColor?: string;
    borderRadius?: string;
    fontSize?: string;
  };
  orderPayload?: {             // Optional order details
    orderItems: Array<{
      type: string;
      description: string;
      quantity: number;
      price: number;
      sku: string;
    }>;
  };
}

function sendCheckoutConfig() {
  if (!iframeRef.current || !isIframeReady) return;

  const config: CheckoutConfig = {
    amount: 25.00,
    merchantId: 'your-merchant-id',
    email: 'customer@example.com',
    cardHolderName: 'John Doe',
    invoice: `ORD-${Date.now()}`,
    isZipCodeEnabled: true,
    isEmailEnabled: true,
    defaultPaymentMethod: 'card',
    styles: {
      backgroundColor: '#ffffff',
      buttonColor: '#3b82f6',
      buttonTextColor: '#ffffff',
      inputBorderColor: '#ced4da',
      borderRadius: '8px',
      fontSize: '16px',
    },
    orderPayload: {
      orderItems: [
        {
          type: 'Product',
          description: 'Premium Widget',
          quantity: 1,
          price: 25.00,
          sku: 'WIDGET-001',
        },
      ],
    },
  };

  iframeRef.current.contentWindow?.postMessage(
    {
      type: 'digitzs:init-checkout',
      config: config,
    },
    checkoutUrl // Target origin for security
  );
}
```

---

## Step 3: Token Creation Flow

When the user submits the payment form, the iframe tokenizes the card via TokenEx and sends back token data.

### Token Created Data Structure

```typescript
interface TokenCreatedData {
  token: string;           // The tokenized card (use this for payment)
  amount: number;          // Transaction amount
  invoice: string;         // Your order ID
  merchantId: string;      // Merchant ID
  tokenData?: {
    firstSix: string;      // First 6 digits of card
    lastFour: string;      // Last 4 digits of card
    token: string;         // TokenEx token
    referenceNumber: string;
    tokenHMAC: string;
    cvvIncluded: boolean;
    cardType: string;      // 'visa', 'mastercard', etc.
  };
  paymentMethod?: string;
  form: {
    firstName?: string;
    lastName?: string;
    email?: string;
    cardHolderName?: string;  // Note: capital 'H'
    expiry?: string;          // Format: "MM/YY"
    zipCode?: string;
  };
}
```

### Handling Token Created Event

```typescript
async function handleTokenCreated(data: TokenCreatedData) {
  onPaymentStart();

  try {
    // Parse expiration date from "MM/YY" format
    const expiry = data.form?.expiry || '';
    const cleanDate = expiry.replace('/', '');
    const expirationMonth = cleanDate.substring(0, 2) || '01';
    const expirationYear = `20${cleanDate.substring(2, 4)}` || '2027';

    // Parse customer name
    const fullName = data.form?.cardHolderName || 'Unknown Customer';
    const [firstName, ...lastNameParts] = fullName.split(' ');
    const lastName = lastNameParts.join(' ') || 'Customer';

    // Build payment request for your backend
    const paymentPayload = {
      environment: 'staging', // or 'production'
      apiKey: 'YOUR_API_KEY',
      appKey: 'YOUR_APP_KEY',
      data: {
        type: 'payments',
        attributes: {
          merchantId: data.merchantId,
          amount: data.amount,
          currency: 'USD',
          orderId: data.invoice,
          customerInfo: {
            firstName: data.form?.firstName || firstName,
            lastName: data.form?.lastName || lastName,
            email: data.form?.email || 'customer@example.com',
            billingAddress: {
              address1: '123 Main St',
              address2: '',
              city: 'Los Angeles',
              state: 'CA',
              zip: data.form?.zipCode || '90210',
              country: 'US',
            },
          },
          paymentMethodData: {
            type: 'card',
            token: data.token,  // THE TOKENIZED CARD
            expirationMonth,
            expirationYear,
            cardholderName: fullName,
          },
        },
      },
    };

    // Send to your backend
    const response = await fetch('/api/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentPayload),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Payment failed');
    }

    onPaymentSuccess(result.data.id);
  } catch (error) {
    onPaymentError(error instanceof Error ? error.message : 'Payment failed');
  }
}
```

---

## Step 4: Backend Authentication

Before processing a payment, your backend must obtain an authentication token from PayVia.

### Authentication Request

**Endpoint:** `POST /v4/auth/token`

**Headers:**
```
x-api-key: YOUR_API_KEY
Content-Type: application/json
```

**Request Body:**
```json
{
  "data": {
    "type": "auth",
    "attributes": {
      "appKey": "YOUR_APP_KEY"
    }
  }
}
```

**Response:**
```json
{
  "data": {
    "type": "auth",
    "attributes": {
      "app_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

### Node.js Implementation

```typescript
import { NextRequest, NextResponse } from 'next/server';

const API_URLS = {
  staging: 'https://api.payvia.staging.ondeets.ai',
  production: 'https://api.payvia.ondeets.ai',
};

// Token cache (recommended for production)
const tokenCache = new Map<string, { token: string; expiresAt: number }>();

async function getAuthToken(
  environment: 'staging' | 'production',
  apiKey: string,
  appKey: string
): Promise<string> {
  const cacheKey = `${environment}-${apiKey}-${appKey}`;
  const cached = tokenCache.get(cacheKey);

  // Return cached token if valid
  if (cached && cached.expiresAt > Date.now()) {
    return cached.token;
  }

  const apiUrl = API_URLS[environment];
  const authUrl = `${apiUrl}/v4/auth/token`;

  const response = await fetch(authUrl, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: {
        type: 'auth',
        attributes: {
          appKey,
        },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Auth failed: ${error}`);
  }

  const result = await response.json();
  const token = result.data.attributes.app_token;

  // Cache token for 55 minutes (expires in 60)
  tokenCache.set(cacheKey, {
    token,
    expiresAt: Date.now() + 55 * 60 * 1000,
  });

  return token;
}
```

---

## Step 5: Payment Processing

After obtaining the auth token, process the payment.

### Payment Request

**Endpoint:** `POST /v4/payments`

**Headers:**
```
x-api-key: YOUR_API_KEY
Authorization: Bearer YOUR_AUTH_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "data": {
    "type": "payments",
    "attributes": {
      "merchantId": "your-merchant-id",
      "amount": 25.00,
      "currency": "USD",
      "orderId": "ORD-1234567890",
      "customerInfo": {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "billingAddress": {
          "address1": "123 Main St",
          "address2": "",
          "city": "Los Angeles",
          "state": "CA",
          "zip": "90210",
          "country": "US"
        }
      },
      "paymentMethodData": {
        "type": "card",
        "token": "TOKENIZED_CARD_FROM_IFRAME",
        "expirationMonth": "12",
        "expirationYear": "2027",
        "cardholderName": "John Doe"
      }
    }
  }
}
```

### Backend Payment Handler

```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { environment, apiKey, appKey, data } = body;

    // Validate required fields
    if (!apiKey || !appKey) {
      return NextResponse.json(
        { error: 'Missing required credentials' },
        { status: 400 }
      );
    }

    // Get auth token
    const authToken = await getAuthToken(environment, apiKey, appKey);

    // Process payment
    const apiUrl = API_URLS[environment];
    const paymentUrl = `${apiUrl}/v4/payments`;

    const paymentResponse = await fetch(paymentUrl, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data }),
    });

    const paymentResult = await paymentResponse.json();

    if (!paymentResponse.ok) {
      // Extract error message
      let errorMessage = 'Payment processing failed';
      if (paymentResult.errors?.length > 0) {
        errorMessage = paymentResult.errors[0].detail ||
                       paymentResult.errors[0].title ||
                       errorMessage;
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: paymentResponse.status }
      );
    }

    // Success - return transaction ID
    return NextResponse.json(paymentResult);
  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
```

### Successful Payment Response

```json
{
  "data": {
    "id": "pay_1234567890abcdef",
    "type": "payments",
    "attributes": {
      "status": "approved",
      "amount": 25.00,
      "currency": "USD",
      "orderId": "ORD-1234567890",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

---

## Complete Data Structures

### Payment Request Interface (TypeScript)

```typescript
interface PaymentRequest {
  data: {
    type: 'payments';
    attributes: {
      merchantId: string;
      amount: number;        // In dollars (e.g., 25.00)
      currency: 'USD';
      orderId: string;
      customerInfo: {
        firstName: string;
        lastName: string;
        email: string;
        billingAddress: {
          address1: string;
          address2?: string;
          city: string;
          state: string;
          zip: string;
          country: string;
        };
      };
      paymentMethodData: {
        type: 'card';
        token: string;
        expirationMonth: string;  // "01" - "12"
        expirationYear: string;   // "2027"
        cardholderName: string;
      };
    };
  };
}
```

---

## Error Handling

### Common Error Codes

| Error | Description | Solution |
|-------|-------------|----------|
| `401 Unauthorized` | Invalid or expired auth token | Re-authenticate |
| `400 Bad Request` | Invalid request format | Check payload structure |
| `422 Unprocessable Entity` | Validation error | Check field values |
| `402 Payment Required` | Card declined | Prompt user to try another card |
| `500 Internal Server Error` | Server issue | Retry or contact support |

### Error Response Format

```json
{
  "errors": [
    {
      "status": "422",
      "code": "invalid_card",
      "title": "Invalid Card",
      "detail": "The card number is invalid",
      "meta": {
        "field": "paymentMethodData.token"
      }
    }
  ]
}
```

---

## Security Considerations

### Origin Validation (Critical)

**Always validate the origin** of postMessage events:

```typescript
const allowedOrigins = [
  'https://checkout.staging.digitzs.com',
  'https://checkout.digitzs.com',
];

if (!allowedOrigins.includes(event.origin)) {
  return; // Reject untrusted messages
}
```

### Credential Storage

| Credential | Storage Location | Notes |
|------------|------------------|-------|
| `merchantId` | Frontend config | Safe to expose |
| `apiKey` | Backend only (.env) | Never expose to frontend |
| `appKey` | Backend only (.env) | Never expose to frontend |

### PCI Compliance

The iframe approach ensures PCI compliance:
- Card data is entered directly in PayVia's iframe
- Your application never handles raw card numbers
- Only tokenized data crosses the iframe boundary
- TokenEx handles secure card tokenization

---

## Quick Start Checklist

- [ ] Obtain credentials from PayVia (merchantId, apiKey, appKey)
- [ ] Set up environment variables on your backend
- [ ] Embed the iframe with correct checkout URL
- [ ] Implement postMessage listener with origin validation
- [ ] Handle `digitzs:ready` → send configuration
- [ ] Handle `digitzs:token-created` → process payment
- [ ] Create backend endpoint for payment processing
- [ ] Implement auth token caching
- [ ] Test in staging environment
- [ ] Switch to production URLs for go-live

---

## Support

For integration support, contact the PayVia team or refer to:
- Staging Dashboard: https://dashboard.staging.digitzs.com
- Production Dashboard: https://dashboard.digitzs.com
