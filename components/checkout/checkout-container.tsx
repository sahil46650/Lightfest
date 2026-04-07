'use client'

import * as React from 'react'
import { useCheckoutStore, CheckoutStep } from '@/store/useCheckoutStore'
import { ProgressIndicator } from './progress-indicator'
import { OrderSummary } from './order-summary'
import { PersonalInfoStep } from './steps/personal-info-step'
import { AttendeeInfoStep } from './steps/attendee-info-step'
import { PaymentStep } from './steps/payment-step'
import { AlertCircle, ArrowRight } from 'lucide-react'
import { z } from 'zod'

// Import schemas from checkout feature module
import {
  personalInfoSchema,
  saveAttendeesRequestSchema,
  type PersonalInfo,
} from '@/features/checkout/schemas'

// Import PayVia types for tokenized payment
import type { TokenCreatedData } from '@/lib/payvia'

interface CheckoutContainerProps {
  cartId: string
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
}

/**
 * Transforms Zustand store attendees to the API format expected by TSCheckout.
 *
 * Store format: { "0": { name: "John Doe", email: "..." }, "1": { ... } }
 * API format:   { "typeId-0": { firstName: "John", lastName: "Doe", email: "..." } }
 */
function transformAttendeesForApi(
  cart: Array<{ ticketTypeId: string; quantity: number }>,
  attendees: Record<string, { name: string; email: string }>
): Record<string, { firstName: string; lastName: string; email: string }> {
  const result: Record<string, { firstName: string; lastName: string; email: string }> = {}

  let attendeeIndex = 0
  for (const item of cart) {
    for (let i = 0; i < item.quantity; i++) {
      const attendee = attendees[attendeeIndex.toString()]
      if (attendee) {
        // Parse full name into firstName and lastName
        const nameParts = attendee.name.trim().split(/\s+/)
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || nameParts[0] || '' // Use first name as last if only one word

        const apiKey = `${item.ticketTypeId}-${i}`
        result[apiKey] = {
          firstName,
          lastName,
          email: attendee.email,
        }
      }
      attendeeIndex++
    }
  }

  return result
}

// Local attendee form schema (combines base attendee with add-ons)
const attendeeFormSchema = z.object({
  attendees: z.array(z.object({
    name: z.string().min(1, 'Name required').max(100),
    email: z.string().email('Valid email required'),
  })),
  addOns: z.record(z.string(), z.array(z.object({
    name: z.string(),
    quantity: z.number().min(0),
    price: z.number(),
  }))),
})

type PersonalInfoFormData = PersonalInfo
type AttendeeFormData = z.infer<typeof attendeeFormSchema>

export const CheckoutContainer = React.forwardRef<HTMLDivElement, CheckoutContainerProps>(
  (
    {
      cartId,
      onSuccess,
      onError,
    },
    ref
  ) => {
    const {
      currentStep,
      setCurrentStep,
      cart,
      personalInfo,
      attendees,
      setPersonalInfo,
      updateAttendee,
    } = useCheckoutStore()

    const [isLoading, setIsLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    // Server-validated pricing from v1 API (stored in sessionStorage by event page)
    const [serverPricing, setServerPricing] = React.useState({
      subtotal: 0,
      serviceFee: 0,
      processingFee: 0,
      discounts: 0,
      total: 0,
    })

    // Load server-validated pricing from sessionStorage on mount
    React.useEffect(() => {
      try {
        const checkoutDataStr = sessionStorage.getItem('checkoutData')
        if (checkoutDataStr) {
          const checkoutData = JSON.parse(checkoutDataStr)
          setServerPricing({
            subtotal: checkoutData.subtotal ?? 0,
            serviceFee: checkoutData.serviceFee ?? 0,
            processingFee: checkoutData.processingFee ?? 0,
            discounts: checkoutData.discounts ?? 0,
            total: checkoutData.totalAmount ?? 0,
          })
        }
      } catch (e) {
        console.error('Failed to parse checkoutData from sessionStorage:', e)
      }
    }, [])

    // Map CheckoutStep from store to the numeric values used in ProgressIndicator
    const currentStepNumber = Object.values(CheckoutStep).indexOf(currentStep)

    // Calculate total without processing fee (per Ticketsocket staff guidance)
    const adjustedTotal = serverPricing.total - serverPricing.processingFee

    const totalAttendees = cart.reduce((sum, item) => sum + item.quantity, 0)
    const completedAttendees = Object.keys(attendees).length
    const isAttendeeStepComplete = completedAttendees === totalAttendees

    const handlePersonalInfoSubmit = (data: PersonalInfoFormData) => {
      try {
        setIsLoading(true)
        setError(null)

        personalInfoSchema.parse(data)
        setPersonalInfo({
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          countryCode: data.countryCode,
          createAccount: data.createAccount,
          password: data.password,
        })

        setCurrentStep(CheckoutStep.ATTENDEE_INFO)
      } catch (err) {
        const errorMessage = err instanceof z.ZodError
          ? err.issues[0]?.message || 'Validation failed'
          : 'Failed to save personal information'
        setError(errorMessage)
        onError?.(new Error(errorMessage))
      } finally {
        setIsLoading(false)
      }
    }

    const handleAttendeeInfoSubmit = (data: AttendeeFormData) => {
      try {
        setIsLoading(true)
        setError(null)

        attendeeFormSchema.parse(data)

        // Update attendees in store
        data.attendees.forEach((attendee, index) => {
          updateAttendee(index.toString(), {
            name: attendee.name,
            email: attendee.email,
            addOns: data.addOns[index.toString()] || [],
          })
        })

        setCurrentStep(CheckoutStep.PAYMENT)
      } catch (err) {
        const errorMessage = err instanceof z.ZodError
          ? err.issues[0]?.message || 'Validation failed'
          : 'Failed to save attendee information'
        setError(errorMessage)
        onError?.(new Error(errorMessage))
      } finally {
        setIsLoading(false)
      }
    }

    const handlePaymentSubmit = async (tokenData: TokenCreatedData) => {
      try {
        setIsLoading(true)
        setError(null)

        if (!personalInfo) {
          throw new Error('Personal information is required')
        }

        // Transform attendees from Zustand format to API format
        const transformedAttendees = transformAttendeesForApi(cart, attendees)

        // Transform cart items from store format to API format
        // Store has ticketTypeId (string), v1 API also uses ticketTypeId (number)
        const cartItems = cart.map((item) => ({
          ticketTypeId: parseInt(item.ticketTypeId, 10),
          quantity: item.quantity,
        }))

        // Call the payment API with tokenized card data and checkout info
        const response = await fetch('/api/checkout/payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cartItems,
            personalInfo: {
              firstName: personalInfo.firstName,
              lastName: personalInfo.lastName,
              email: personalInfo.email,
              phone: personalInfo.phone,
            },
            attendees: transformedAttendees,
            tokenData,
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error?.message || 'Payment failed')
        }

        // Payment successful - pass order data to success handler
        onSuccess?.({
          orderId: result.data.orderId,
          confirmationNumber: result.data.confirmationNumber,
          email: result.data.email,
          total: result.data.total,
          status: result.data.status,
        })
      } catch (err) {
        const errorMessage = err instanceof Error
          ? err.message
          : 'Failed to process payment'
        setError(errorMessage)
        onError?.(new Error(errorMessage))
      } finally {
        setIsLoading(false)
      }
    }

    const handleEditStep = (stepNumber: number) => {
      const steps = Object.values(CheckoutStep)
      setCurrentStep(steps[stepNumber] as CheckoutStep)
    }

    const handleBack = () => {
      const steps = Object.values(CheckoutStep)
      const previousStepIndex = currentStepNumber - 1
      if (previousStepIndex >= 0) {
        setCurrentStep(steps[previousStepIndex] as CheckoutStep)
      }
    }

    const handleCartBack = () => {
      setCurrentStep(CheckoutStep.TICKET_SELECTION)
    }

    return (
      <div ref={ref} className="w-full">
        {/* Progress Indicator - Centered */}
        <div className="mb-10">
          <ProgressIndicator
            currentStep={currentStepNumber}
            className="max-w-xl mx-auto"
          />
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-8 animate-fade-in">
            <div className="flex gap-4 p-4 rounded-xl bg-red-50 border border-red-200">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="font-bold text-red-900">Something went wrong</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content with Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
          {/* Left: Forms */}
          <div className="lg:col-span-2">
            {/* Step 2: Personal Info */}
            {currentStep === CheckoutStep.PERSONAL_INFO && (
              <div className="animate-fade-in-up">
                <PersonalInfoStep
                  onSubmit={handlePersonalInfoSubmit}
                  onBack={handleCartBack}
                  isLoading={isLoading}
                  initialData={personalInfo || undefined}
                />
              </div>
            )}

            {/* Step 3: Attendee Info */}
            {currentStep === CheckoutStep.ATTENDEE_INFO && (
              <div className="animate-fade-in-up">
                <AttendeeInfoStep
                  onSubmit={handleAttendeeInfoSubmit}
                  onBack={handleBack}
                  cartItems={cart}
                  isLoading={isLoading}
                  initialData={personalInfo ? {
                    attendees: (() => {
                      const totalAttendees = cart.reduce((sum, item) => sum + item.quantity, 0)
                      return Array.from({ length: totalAttendees }, (_, index) =>
                        index === 0
                          ? { name: `${personalInfo.firstName} ${personalInfo.lastName}`, email: personalInfo.email }
                          : { name: '', email: '' }
                      )
                    })(),
                  } : undefined}
                />
              </div>
            )}

            {/* Step 4: Payment */}
            {currentStep === CheckoutStep.PAYMENT && personalInfo && (
              <div className="animate-fade-in-up">
                <PaymentStep
                  onSubmit={handlePaymentSubmit}
                  onBack={handleBack}
                  onEditStep={handleEditStep}
                  completedSteps={{
                    personal: true,
                    attendee: isAttendeeStepComplete,
                  }}
                  draftBookingId={cartId}
                  personalInfo={{
                    email: personalInfo.email,
                    firstName: personalInfo.firstName,
                    lastName: personalInfo.lastName,
                  }}
                  cartItems={cart}
                  subtotal={cart.reduce((sum, item) => sum + item.price * item.quantity, 0)}
                  serviceFee={serverPricing.serviceFee}
                  discount={serverPricing.discounts}
                  total={adjustedTotal}
                  itemCount={totalAttendees}
                  isLoading={isLoading}
                />
              </div>
            )}

            {/* Default: Start Checkout CTA */}
            {currentStep === CheckoutStep.TICKET_SELECTION && (
              <div className="animate-fade-in-up">
                <div className="rounded-2xl border border-gray-200 bg-white p-8 md:p-10 text-center shadow-sm">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                    Ready to complete your booking?
                  </h2>
                  <p className="text-gray-500 mt-2 max-w-md mx-auto">
                    {cart.length > 0
                      ? `You have ${totalAttendees} ticket${totalAttendees !== 1 ? 's' : ''} selected.`
                      : 'Select your tickets to begin.'}
                  </p>

                  <button
                    onClick={() => setCurrentStep(CheckoutStep.PERSONAL_INFO)}
                    disabled={isLoading || cart.length === 0}
                    className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-white px-8 py-3 font-semibold hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Continue to Checkout
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <OrderSummary
              items={cart.map((item) => ({
                ticketName: item.ticketName,
                quantity: item.quantity,
                price: item.price,
              }))}
              subtotal={cart.reduce((sum, item) => sum + item.price * item.quantity, 0)}
              serviceFee={serverPricing.serviceFee}
              discount={serverPricing.discounts}
              total={adjustedTotal}
            />
          </div>
        </div>
      </div>
    )
  }
)

CheckoutContainer.displayName = 'CheckoutContainer'
