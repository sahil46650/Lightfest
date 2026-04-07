/**
 * TSCheckout Cart Builder
 *
 * A fluent builder pattern for constructing cart requests.
 * Makes it easier to build complex cart payloads.
 */

import type {
  BasicInfo,
  CreateOrderTicket,
  CreateOrderAnswer,
  CartPromoCode,
  ShippingOption,
  InsuranceInfo,
  BuildCartItemsRequest,
  ProcessCartRequest,
  PaymentMethod,
  AttendeeAddress,
} from './types';

// ============================================================================
// Ticket Builder
// ============================================================================

/**
 * TicketBuilder - Fluent builder for v1 API ticket structure
 * Uses ticketTypeId and partyMember* fields
 */
export class TicketBuilder {
  private ticket: CreateOrderTicket;

  constructor(ticketTypeId: number) {
    this.ticket = { ticketTypeId };
  }

  /**
   * Set attendee name (partyMember and partyMemberLastName in v1 API).
   */
  attendee(firstName: string, lastName: string): this {
    this.ticket.partyMember = firstName;
    this.ticket.partyMemberLastName = lastName;
    return this;
  }

  /**
   * Set attendee email (partyMemberEmail in v1 API).
   */
  email(email: string): this {
    this.ticket.partyMemberEmail = email;
    return this;
  }

  /**
   * Set attendee date of birth (v1 API fields).
   */
  dateOfBirth(month: number, day: number, year: number): this {
    this.ticket.partyMemberBirthMonth = month;
    this.ticket.partyMemberBirthDay = day;
    this.ticket.partyMemberBirthYear = year;
    return this;
  }

  /**
   * Set attendee gender (v1 API field).
   */
  gender(gender: 'M' | 'F' | string): this {
    this.ticket.partyMemberGender = gender;
    return this;
  }

  /**
   * Set attendee address.
   */
  address(address: AttendeeAddress): this {
    this.ticket.attendeeAddress = address;
    return this;
  }

  /**
   * Mark ticket as not for the purchaser.
   */
  notForPurchaser(): this {
    this.ticket.notForPurchaser = 1;
    return this;
  }

  /**
   * Set external membership ID (v1 API field).
   */
  externalMembershipId(id: string): this {
    this.ticket.externalMembershipId = id;
    return this;
  }

  /**
   * Build the ticket object.
   */
  build(): CreateOrderTicket {
    return { ...this.ticket };
  }
}

// ============================================================================
// Cart Builder
// ============================================================================

export class CartBuilder {
  private basicInfo?: BasicInfo;
  private tickets: CreateOrderTicket[] = [];
  private _promoCodes: CartPromoCode[] = [];
  private orderAnswers: CreateOrderAnswer[] = [];
  private shippingOptions: ShippingOption[] = [];
  private insuranceInfo?: InsuranceInfo;
  private includeFees: number = 1;
  private paymentMethod?: PaymentMethod;

  /**
   * Set customer basic information.
   */
  customer(firstName: string, lastName: string, email: string): this {
    this.basicInfo = { firstName, lastName, emailAddress: email };
    return this;
  }

  /**
   * Set customer info from an object.
   */
  customerInfo(info: BasicInfo): this {
    this.basicInfo = info;
    return this;
  }

  /**
   * Add a ticket to the cart.
   */
  addTicket(ticket: CreateOrderTicket | TicketBuilder): this {
    const ticketData = ticket instanceof TicketBuilder ? ticket.build() : ticket;
    this.tickets.push(ticketData);
    return this;
  }

  /**
   * Add multiple tickets of the same type (v1 API uses ticketTypeId).
   */
  addTickets(
    ticketTypeId: number,
    quantity: number,
    attendeeFactory?: (index: number) => Partial<CreateOrderTicket>
  ): this {
    for (let i = 0; i < quantity; i++) {
      const additionalData = attendeeFactory?.(i) || {};
      this.tickets.push({ ticketTypeId, ...additionalData });
    }
    return this;
  }

  /**
   * Create and add a ticket using the builder (v1 API uses ticketTypeId).
   */
  ticket(ticketTypeId: number): TicketBuilder {
    const builder = new TicketBuilder(ticketTypeId);
    // Store reference to add when build() is called
    const originalBuild = builder.build.bind(builder);
    builder.build = () => {
      const ticket = originalBuild();
      this.tickets.push(ticket);
      return ticket;
    };
    return builder;
  }

  /**
   * Apply a promo code.
   */
  promoCode(code: string): this {
    this._promoCodes.push({ code });
    return this;
  }

  /**
   * Apply multiple promo codes.
   */
  addPromoCodes(codes: string[]): this {
    codes.forEach((code) => this._promoCodes.push({ code }));
    return this;
  }

  /**
   * Add an order-level answer.
   */
  orderAnswer(
    questionId: number,
    options: Partial<Omit<CreateOrderAnswer, 'questionId'>> = {}
  ): this {
    this.orderAnswers.push({ questionId, ...options });
    return this;
  }

  /**
   * Set shipping option for a ticket type (v1 API uses ticketTypeId).
   */
  shipping(ticketTypeId: number, shippingOptionId: number): this {
    this.shippingOptions.push({ ticketTypeId, shippingOptionId });
    return this;
  }

  /**
   * Add insurance to the order.
   */
  insurance(info: InsuranceInfo): this {
    this.insuranceInfo = { ...info, optedIn: 1 };
    return this;
  }

  /**
   * Opt into insurance with basic info.
   */
  addInsurance(price: number, quote?: string, vendor?: string): this {
    this.insuranceInfo = {
      optedIn: 1,
      price,
      quote,
      vendor,
    };
    return this;
  }

  /**
   * Whether to include fees in line items.
   */
  withFees(include: boolean = true): this {
    this.includeFees = include ? 1 : 0;
    return this;
  }

  /**
   * Set payment method (for processCart).
   */
  payment(method: PaymentMethod): this {
    this.paymentMethod = method;
    return this;
  }

  /**
   * Build the request for buildCartItems endpoint.
   */
  buildRequest(): BuildCartItemsRequest {
    return {
      includeFees: this.includeFees,
      ...(this.basicInfo && { basicInfo: this.basicInfo }),
      ...(this.tickets.length > 0 && { tickets: this.tickets }),
      ...(this._promoCodes.length > 0 && { promoCodes: this._promoCodes }),
      ...(this.orderAnswers.length > 0 && { orderAnswers: this.orderAnswers }),
      ...(this.shippingOptions.length > 0 && { shippingOptions: this.shippingOptions }),
      ...(this.insuranceInfo && { insuranceInfo: this.insuranceInfo }),
    };
  }

  /**
   * Build the request for processCart endpoint.
   */
  buildProcessRequest(): ProcessCartRequest {
    return {
      ...this.buildRequest(),
      ...(this.paymentMethod && { paymentMethod: this.paymentMethod }),
    };
  }

  /**
   * Get the current ticket count.
   */
  getTicketCount(): number {
    return this.tickets.length;
  }

  /**
   * Get tickets by type ID (v1 API uses ticketTypeId).
   */
  getTicketsByType(ticketTypeId: number): CreateOrderTicket[] {
    return this.tickets.filter((t) => t.ticketTypeId === ticketTypeId);
  }

  /**
   * Remove all tickets of a specific type (v1 API uses ticketTypeId).
   */
  removeTicketType(ticketTypeId: number): this {
    this.tickets = this.tickets.filter((t) => t.ticketTypeId !== ticketTypeId);
    return this;
  }

  /**
   * Clear all promo codes.
   */
  clearPromoCodes(): this {
    this._promoCodes = [];
    return this;
  }

  /**
   * Clear the entire cart.
   */
  clear(): this {
    this.tickets = [];
    this._promoCodes = [];
    this.orderAnswers = [];
    this.shippingOptions = [];
    this.insuranceInfo = undefined;
    return this;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a new cart builder.
 *
 * @example
 * ```ts
 * const request = createCart()
 *   .customer('John', 'Doe', 'john@example.com')
 *   .addTicket({ ticketTypeId: 12345, partyMember: 'John', partyMemberLastName: 'Doe' })
 *   .addTicket({ ticketTypeId: 12345, partyMember: 'Jane', partyMemberLastName: 'Doe' })
 *   .promoCode('SAVE10')
 *   .buildRequest();
 * ```
 */
export function createCart(): CartBuilder {
  return new CartBuilder();
}

/**
 * Create a new ticket builder (v1 API uses ticketTypeId).
 *
 * @example
 * ```ts
 * const ticket = createTicket(12345)
 *   .attendee('John', 'Doe')
 *   .email('john@example.com')
 *   .dateOfBirth(5, 15, 1990)
 *   .build();
 * ```
 */
export function createTicket(ticketTypeId: number): TicketBuilder {
  return new TicketBuilder(ticketTypeId);
}

// ============================================================================
// Utility Types for Integration
// ============================================================================

/**
 * Simplified ticket input for common use cases.
 * Uses ticketTypeId (v1 API format).
 */
export interface SimpleTicketInput {
  ticketTypeId: number;
  firstName: string;
  lastName: string;
  email?: string;
}

/**
 * Convert simple ticket inputs to CreateOrderTicket array (v1 API format).
 */
export function simplifyTickets(tickets: SimpleTicketInput[]): CreateOrderTicket[] {
  return tickets.map((t) => ({
    ticketTypeId: t.ticketTypeId,
    partyMember: t.firstName,
    partyMemberLastName: t.lastName,
    partyMemberEmail: t.email,
  }));
}

/**
 * Quick cart builder for simple use cases (v1 API format).
 *
 * @example
 * ```ts
 * const request = quickCart({
 *   customer: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
 *   tickets: [
 *     { ticketTypeId: 12345, firstName: 'John', lastName: 'Doe' },
 *     { ticketTypeId: 12345, firstName: 'Jane', lastName: 'Doe' }
 *   ],
 *   promoCode: 'SAVE10'
 * });
 * ```
 */
export function quickCart(options: {
  customer: { firstName: string; lastName: string; email: string };
  tickets: SimpleTicketInput[];
  promoCode?: string;
  promoCodes?: string[];
}): BuildCartItemsRequest {
  const builder = createCart()
    .customer(options.customer.firstName, options.customer.lastName, options.customer.email);

  options.tickets.forEach((t) => {
    builder.addTicket({
      ticketTypeId: t.ticketTypeId,
      partyMember: t.firstName,
      partyMemberLastName: t.lastName,
      partyMemberEmail: t.email,
    });
  });

  if (options.promoCode) {
    builder.promoCode(options.promoCode);
  }

  if (options.promoCodes) {
    builder.addPromoCodes(options.promoCodes);
  }

  return builder.buildRequest();
}
