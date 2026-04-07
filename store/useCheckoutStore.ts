import { create } from "zustand"
import { persist } from "zustand/middleware"

export enum CheckoutStep {
  TICKET_SELECTION = "TICKET_SELECTION",
  PERSONAL_INFO = "PERSONAL_INFO",
  ATTENDEE_INFO = "ATTENDEE_INFO",
  PAYMENT = "PAYMENT",
}

export interface CartItem {
  ticketTypeId: string
  ticketName: string
  price: number
  quantity: number
}

export interface PersonalInfo {
  email: string
  firstName: string
  lastName: string
  phone: string
  countryCode: string
  createAccount?: boolean
  password?: string
}

export interface AttendeeInfo {
  name: string
  email: string
  addOns?: Array<{ name: string; price: number }>
}

export interface PromoCodeData {
  code: string
  discountType: "PERCENTAGE" | "FIXED"
  discountValue: number
}

interface CheckoutState {
  bookingId: string | null
  currentStep: CheckoutStep
  cart: CartItem[]
  personalInfo: PersonalInfo | null
  attendees: Record<string, AttendeeInfo>
  promoCode: PromoCodeData | null
  eventId: string | null

  // Computed values
  subtotal: () => number
  discount: () => number
  serviceFee: () => number
  total: () => number

  // Actions
  initializeBooking: (bookingId: string, eventId: string) => void
  setCurrentStep: (step: CheckoutStep) => void
  addToCart: (item: CartItem) => void
  updateQuantity: (ticketTypeId: string, quantity: number) => void
  removeFromCart: (ticketTypeId: string) => void
  setPersonalInfo: (info: PersonalInfo) => void
  updateAttendee: (ticketIndex: string, info: AttendeeInfo) => void
  setPromoCode: (code: PromoCodeData | null) => void
  reset: () => void
  getCartSummary: () => { totalTickets: number; totalPrice: number }
}

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set, get) => ({
      bookingId: null,
      currentStep: CheckoutStep.TICKET_SELECTION,
      cart: [],
      personalInfo: null,
      attendees: {},
      promoCode: null,
      eventId: null,

      subtotal: () => {
        const { cart } = get()
        return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
      },

      discount: () => {
        const { promoCode, subtotal } = get()
        if (!promoCode) return 0
        const baseAmount = subtotal()
        if (promoCode.discountType === "PERCENTAGE") {
          return (baseAmount * promoCode.discountValue) / 100
        }
        return promoCode.discountValue
      },

      serviceFee: () => {
        // 37% of subtotal (similar to the reference site)
        const { subtotal } = get()
        return subtotal() * 0.37
      },

      total: () => {
        const { subtotal, discount, serviceFee } = get()
        return subtotal() + serviceFee() - discount()
      },

      initializeBooking: (bookingId: string, eventId: string) => {
        set({ bookingId, eventId })
      },

      setCurrentStep: (step: CheckoutStep) => {
        set({ currentStep: step })
      },

      addToCart: (item: CartItem) => {
        const { cart } = get()
        const existingItem = cart.find(
          (i) => i.ticketTypeId === item.ticketTypeId
        )

        if (existingItem) {
          set({
            cart: cart.map((i) =>
              i.ticketTypeId === item.ticketTypeId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          })
        } else {
          set({ cart: [...cart, item] })
        }
      },

      updateQuantity: (ticketTypeId: string, quantity: number) => {
        const { cart } = get()
        if (quantity === 0) {
          set({ cart: cart.filter((i) => i.ticketTypeId !== ticketTypeId) })
        } else {
          set({
            cart: cart.map((i) =>
              i.ticketTypeId === ticketTypeId ? { ...i, quantity } : i
            ),
          })
        }
      },

      removeFromCart: (ticketTypeId: string) => {
        const { cart } = get()
        set({ cart: cart.filter((i) => i.ticketTypeId !== ticketTypeId) })
      },

      setPersonalInfo: (info: PersonalInfo) => {
        set({ personalInfo: info })
      },

      updateAttendee: (ticketIndex: string, info: AttendeeInfo) => {
        const { attendees } = get()
        set({ attendees: { ...attendees, [ticketIndex]: info } })
      },

      setPromoCode: (code: PromoCodeData | null) => {
        set({ promoCode: code })
      },

      reset: () => {
        set({
          bookingId: null,
          currentStep: CheckoutStep.TICKET_SELECTION,
          cart: [],
          personalInfo: null,
          attendees: {},
          promoCode: null,
          eventId: null,
        })
      },

      getCartSummary: () => {
        const { cart } = get()
        return {
          totalTickets: cart.reduce((sum, item) => sum + item.quantity, 0),
          totalPrice: get().total(),
        }
      },
    }),
    {
      name: "checkout-store",
      partialize: (state) => ({
        bookingId: state.bookingId,
        currentStep: state.currentStep,
        cart: state.cart,
        personalInfo: state.personalInfo,
        attendees: state.attendees,
        promoCode: state.promoCode,
        eventId: state.eventId,
      }),
    }
  )
)
