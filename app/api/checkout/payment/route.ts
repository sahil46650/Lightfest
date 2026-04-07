import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getTSCheckoutClient, type CreateOrderTicket } from '@/lib/tscheckout';
import {
  getPayViaClient,
  buildPaymentMethodData,
  parseCardholderName,
  PayViaApiError,
  type TokenCreatedData,
} from '@/lib/payvia';
import { handleApiError, successResponse, Errors } from '@/lib/api/errors';

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Schema for PayVia token data received from the checkout iframe
 */
const tokenDataSchema = z.object({
  token: z.string(),
  amount: z.number(),
  invoice: z.string(),
  merchantId: z.string(),
  tokenData: z.object({
    firstSix: z.string(),
    lastFour: z.string(),
    token: z.string(),
    referenceNumber: z.string(),
    tokenHMAC: z.string(),
    cvvIncluded: z.boolean(),
    cardType: z.string(),
  }).optional(),
  paymentMethod: z.string().optional(),
  form: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().optional(),
    cardHolderName: z.string().optional(),
    expiry: z.string().optional(),
    zipCode: z.string().optional(),
  }),
});

const personalInfoSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
});

const attendeeSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
});

/**
 * Cart item from client-side cart state
 * v1 API: Cart is managed client-side using Zustand store
 */
const cartItemSchema = z.object({
  ticketTypeId: z.number(),
  quantity: z.number().min(1),
  waveTimeId: z.number().optional(),
});

const paymentSchema = z.object({
  /** Cart items from client-side state (managed by Zustand store) */
  cartItems: z.array(cartItemSchema).min(1, 'Cart cannot be empty'),
  /** Customer personal information */
  personalInfo: personalInfoSchema,
  /** Attendee information keyed by "ticketTypeId-index" */
  attendees: z.record(z.string(), attendeeSchema).optional(),
  /** Promo code to apply (optional) */
  promoCode: z.string().optional(),
  /** PayVia token data from the embedded checkout iframe */
  tokenData: tokenDataSchema,
});

type PaymentRequest = z.infer<typeof paymentSchema>;

// ============================================================================
// POST /api/checkout/payment
// ============================================================================

/**
 * Generate a unique invoice number for PayVia payment tracking
 */
function generateInvoiceNumber(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `INV-${timestamp}-${random}`;
}

/**
 * Process payment for checkout
 *
 * v1 API Flow:
 * 1. Receive cart items from client (cart state managed by Zustand)
 * 2. Call describeOrder() to get pricing/fees calculation
 * 3. Process payment via PayVia
 * 4. Create order in TSCheckout after payment succeeds
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = paymentSchema.parse(body);

    const { cartItems, personalInfo, attendees = {}, promoCode, tokenData } = data;

    // 1. Get TSCheckout client
    const tsCheckoutClient = getTSCheckoutClient();

    // 2. Build tickets for TSCheckout order from client-side cart items
    // v1 API uses ticketTypeId and partyMember* fields
    const tickets: CreateOrderTicket[] = [];
    for (const item of cartItems) {
      for (let i = 0; i < item.quantity; i++) {
        const ticketKey = `${item.ticketTypeId}-${i}`;
        const attendee = attendees[ticketKey];

        tickets.push({
          ticketTypeId: item.ticketTypeId,
          partyMember: attendee?.firstName || personalInfo.firstName,
          partyMemberLastName: attendee?.lastName || personalInfo.lastName,
          partyMemberEmail: attendee?.email || personalInfo.email,
        });
      }
    }

    // 3. Call describeOrder to get pricing (no order created yet)
    const describeResponse = await tsCheckoutClient.describeOrder({
      paymentMethod: 'credit',
      includeFees: 1,
      basicInfo: {
        firstName: personalInfo.firstName,
        lastName: personalInfo.lastName,
        emailAddress: personalInfo.email,
      },
      tickets,
      promoCodes: promoCode ? [{ code: promoCode }] : undefined,
    });

    // Get the total from the pricing response, excluding processingFee
    // processingFee is added by PayVia, so we shouldn't include it in the amount we send
    const orderTotal = describeResponse.data?.orderTotal || 0;
    const processingFee = describeResponse.data?.processingFee || 0;
    const total = orderTotal - processingFee;
    const invoiceNumber = generateInvoiceNumber();

    console.log('[Payment] Order pricing calculated:', { orderTotal, processingFee, chargeAmount: total, invoiceNumber });

    // 4. Process payment via PayVia
    const payViaClient = getPayViaClient();
    const tokenPayload: TokenCreatedData = tokenData;

    // Build payment method data from token
    const paymentMethodData = buildPaymentMethodData(
      tokenPayload.token,
      tokenPayload.form.expiry || '12/99',
      tokenPayload.form.cardHolderName || `${personalInfo.firstName} ${personalInfo.lastName}`
    );

    // Parse cardholder name for billing info
    const cardholderName = tokenPayload.form.cardHolderName ||
      `${personalInfo.firstName} ${personalInfo.lastName}`;
    const { firstName: billingFirstName, lastName: billingLastName } =
      parseCardholderName(cardholderName);

    let paymentResponse;
    try {
      paymentResponse = await payViaClient.processPayment({
        amount: total,
        orderId: invoiceNumber, // Use generated invoice number for tracking
        customerInfo: {
          firstName: billingFirstName,
          lastName: billingLastName,
          email: personalInfo.email,
          billingAddress: {
            address1: 'Not Provided', // Not collected in checkout
            city: 'Not Provided',
            state: 'NY', // Default to NY - PayVia requires valid 2-letter state code
            zip: tokenPayload.form.zipCode || '00000',
            country: 'US',
          },
        },
        paymentMethodData,
      });
    } catch (error) {
      // If PayVia fails, log the error but still throw
      if (error instanceof PayViaApiError) {
        console.error('[Payment] PayVia error:', error.message, error.errors);
        throw Errors.transactionFailed(`Payment declined: ${error.message}`);
      }
      throw error;
    }

    // Log PayVia response for debugging
    console.log('[Payment] PayVia response:', JSON.stringify(paymentResponse, null, 2));

    // Check payment success per PayVia documentation:
    // 1. Check for errors array - if present with items = failure
    // 2. Check for data object with type === 'payments' = success
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const responseAny = paymentResponse as any;
    
    if (responseAny.errors && responseAny.errors.length > 0) {
      const error = responseAny.errors[0];
      const errorMessage = error.detail || error.title || 'Payment failed';
      console.error('[Payment] Payment failed:', { code: error.code, message: errorMessage });
      throw Errors.transactionFailed(errorMessage);
    }

    if (!paymentResponse.data || paymentResponse.data.type !== 'payments') {
      console.error('[Payment] Invalid response - missing payment data');
      throw Errors.transactionFailed('Payment processing error');
    }

    const paymentId = paymentResponse.data.id;
    console.log('[Payment] PayVia payment successful:', paymentId);

    // 5. Create order in TSCheckout after payment is verified
    // v1 API: POST /api/v1/orders with detachPaymentMethod: true (payment already processed)
    const orderResponse = await tsCheckoutClient.createOrder({
      paymentMethod: 'cash',
      detachPaymentMethod: true, // Payment already processed via PayVia
      emailReceipt: '1',
      includeFees: 1,
      basicInfo: {
        firstName: personalInfo.firstName,
        lastName: personalInfo.lastName,
        emailAddress: personalInfo.email,
      },
      tickets,
      promoCodes: promoCode ? [{ code: promoCode }] : undefined,
    });

    console.log('[Payment] TSCheckout order response:', orderResponse);

    // Extract order ID from response
    const tsOrderId = 'data' in orderResponse && orderResponse.data?.id
      ? orderResponse.data.id
      : invoiceNumber;

    console.log('[Payment] Order created:', tsOrderId);

    // 6. Return success response with order info
    return successResponse({
      orderId: tsOrderId,
      confirmationNumber: tsOrderId,
      email: personalInfo.email,
      total, // Return adjusted total (without processing fee)
      status: 'confirmed',
      paymentId,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
