'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AlertCircle, ChevronRight, Check, Lock, CreditCard, User, Users, ArrowLeft } from 'lucide-react'
import { PayViaCheckout, useCheckoutConfig } from '@/features/checkout/components'
import type { TokenCreatedData } from '@/lib/payvia'

interface CollapsedStepProps {
  stepNumber: number
  title: string
  subtitle: string
  icon: React.ReactNode
  isCompleted: boolean
  onEdit: () => void
}

const CollapsedStep: React.FC<CollapsedStepProps> = ({ title, subtitle, icon, isCompleted, onEdit }) => (
  <button
    type="button"
    onClick={onEdit}
    className="w-full text-left group"
  >
    <div className={cn(
      "flex items-center gap-4 rounded-xl border-2 p-4 transition-all duration-300",
      isCompleted
        ? "border-green-200 bg-green-50/50 hover:border-green-300 hover:bg-green-50"
        : "border-gray-200 bg-gray-50 hover:border-gray-300"
    )}>
      <div className={cn(
        'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl',
        isCompleted
          ? 'bg-green-100 text-green-600'
          : 'bg-gray-200 text-gray-500'
      )}>
        {isCompleted ? <Check className="h-5 w-5" strokeWidth={3} /> : icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900">{title}</p>
        <p className="text-sm text-gray-500 truncate">{subtitle}</p>
      </div>
      <ChevronRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-0.5" />
    </div>
  </button>
)

interface CartItem {
  ticketTypeId: string
  ticketName: string
  price: number
  quantity: number
}

interface PaymentStepProps {
  /** Called when PayVia tokenizes the card and terms are accepted */
  onSubmit: (tokenData: TokenCreatedData) => void
  onBack: () => void
  onEditStep: (stepNumber: number) => void
  completedSteps: {
    personal: boolean
    attendee: boolean
  }
  /** Draft booking ID for the PayVia invoice */
  draftBookingId: string
  /** Personal info for pre-filling PayVia checkout */
  personalInfo: {
    email: string
    firstName: string
    lastName: string
  }
  /** Cart items for Kount tracking */
  cartItems: CartItem[]
  subtotal: number
  serviceFee: number
  discount: number
  total: number
  itemCount: number
  isLoading?: boolean
}

export const PaymentStep = React.forwardRef<HTMLDivElement, PaymentStepProps>(
  (
    {
      onSubmit,
      onBack,
      onEditStep,
      completedSteps,
      draftBookingId,
      personalInfo,
      cartItems,
      total,
      itemCount,
      isLoading = false,
    },
    ref
  ) => {
    const [acceptTerms, setAcceptTerms] = React.useState(false)
    const [termsError, setTermsError] = React.useState<string | null>(null)
    const [payViaReady, setPayViaReady] = React.useState(false)
    const [payViaError, setPayViaError] = React.useState<string | null>(null)

    // Map cart items to PayVia order items format for Kount tracking
    const orderItems = React.useMemo(() => 
      cartItems.map(item => ({
        type: 'ticket',
        description: item.ticketName,
        quantity: item.quantity,
        price: item.price,
        sku: item.ticketTypeId,
      })),
      [cartItems]
    )

    // Build checkout configuration for PayVia iframe
    const checkoutConfig = useCheckoutConfig({
      amount: total,
      email: personalInfo.email,
      cardHolderName: `${personalInfo.firstName} ${personalInfo.lastName}`,
      invoice: draftBookingId,
      orderItems,
    })

    // Handle token created from PayVia iframe
    // Terms are already accepted since iframe only renders when acceptTerms is true
    const handleTokenCreated = React.useCallback((tokenData: TokenCreatedData) => {
      onSubmit(tokenData)
    }, [onSubmit])

    // Handle terms checkbox change
    const handleTermsChange = React.useCallback((checked: boolean) => {
      setAcceptTerms(checked)
      setTermsError(null)
    }, [])

    const handlePayViaReady = React.useCallback(() => {
      setPayViaReady(true)
      setPayViaError(null)
    }, [])

    const handlePayViaError = React.useCallback((error: string) => {
      setPayViaError(error)
    }, [])

    return (
      <div ref={ref} className="w-full space-y-6">
        {/* Previous Steps Summary */}
        <div className="space-y-3">
          {/* Personal Info Step */}
          <CollapsedStep
            stepNumber={1}
            title="Your Details"
            subtitle={`${personalInfo.firstName} ${personalInfo.lastName} · ${personalInfo.email}`}
            icon={<User className="h-5 w-5" />}
            isCompleted={completedSteps.personal}
            onEdit={() => onEditStep(1)}
          />

          {/* Attendee Info Step */}
          <CollapsedStep
            stepNumber={2}
            title="Attendee Information"
            subtitle={`${itemCount} attendee${itemCount !== 1 ? 's' : ''} registered`}
            icon={<Users className="h-5 w-5" />}
            isCompleted={completedSteps.attendee}
            onEdit={() => onEditStep(2)}
          />
        </div>

        {/* Payment Card */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-float overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 md:px-8 md:py-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Payment</h2>
            <p className="text-sm text-gray-500 mt-1">
              Complete your booking securely
            </p>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8 space-y-6">
            {/* Terms and Conditions */}
            <div className={cn(
              "flex items-start gap-4 rounded-xl border-2 p-4 transition-all duration-300 cursor-pointer",
              termsError
                ? "border-red-300 bg-red-50"
                : acceptTerms
                  ? "border-green-300 bg-green-50/50"
                  : "border-gray-200 bg-gray-50 hover:border-gray-300"
            )}
              onClick={() => handleTermsChange(!acceptTerms)}
            >
              <div className="flex h-6 w-6 items-center justify-center">
                <input
                  id="acceptTerms"
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => {
                    e.stopPropagation()
                    handleTermsChange(e.target.checked)
                  }}
                  disabled={isLoading}
                  aria-invalid={!!termsError}
                  aria-describedby={termsError ? 'acceptTerms-error' : undefined}
                  className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                />
              </div>
              <div className="flex-1 space-y-1">
                <label htmlFor="acceptTerms" className="text-sm font-semibold text-gray-900 cursor-pointer">
                  I agree to the Terms and Conditions <span className="text-primary">*</span>
                </label>
                <p className="text-xs text-gray-500">
                  By completing this booking, you agree to Festival Lights Terms of Service and Privacy Policy.
                </p>
                {acceptTerms && (
                  <p className="text-xs text-green-600 flex items-center gap-1.5 mt-2 font-medium">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    Terms accepted - enter your payment details below
                  </p>
                )}
              </div>
            </div>
            {termsError && (
              <p id="acceptTerms-error" className="flex items-center gap-1.5 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {termsError}
              </p>
            )}

            {/* PayVia Error */}
            {payViaError && (
              <div className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{payViaError}</span>
              </div>
            )}

            {/* PayVia Embedded Checkout - Only shown after terms accepted */}
            {acceptTerms ? (
              <div className="animate-fade-in">
                <PayViaCheckout
                  config={checkoutConfig}
                  environment={(process.env.NEXT_PUBLIC_PAYVIA_ENVIRONMENT as 'staging' | 'production') || 'staging'}
                  onTokenCreated={handleTokenCreated}
                  onError={handlePayViaError}
                  onReady={handlePayViaReady}
                  disabled={isLoading}
                  className="min-h-[600px] rounded-xl overflow-hidden"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 mb-4">
                  <CreditCard className="h-7 w-7" />
                </div>
                <p className="text-sm font-semibold text-gray-700">
                  Accept the terms above to continue
                </p>
                <p className="text-xs text-gray-500 mt-1 max-w-xs">
                  The secure payment form will appear here once you agree to the terms and conditions
                </p>
              </div>
            )}

            {/* Security Notice */}
            <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-4 text-sm">
              <Lock className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <p className="text-gray-600">
                Your payment is secured with PCI-compliant encryption.
              </p>
            </div>

            {/* Back Button */}
            <div className="pt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={isLoading}
                className="h-11 rounded-xl"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }
)

PaymentStep.displayName = 'PaymentStep'
