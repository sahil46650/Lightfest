'use client'

import * as React from 'react'
import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle, Mail, CreditCard, ArrowRight, Calendar, Download, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

function CheckoutSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Extract order details from URL params
  const orderId = searchParams.get('orderId')
  const confirmationNumber = searchParams.get('confirmationNumber')
  const email = searchParams.get('email')
  const total = searchParams.get('total')
  const status = searchParams.get('status')

  // Format currency
  const formatCurrency = (amount: string | null) => {
    if (!amount) return '$0.00'
    const numAmount = parseFloat(amount)
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numAmount)
  }

  const handleViewTickets = () => {
    router.push('/account/bookings')
  }

  const handleBackToEvents = () => {
    router.push('/events')
  }

  // If no order details, show error state
  if (!orderId || !confirmationNumber) {
    return (
      <main className="min-h-screen bg-background-light pt-28 pb-12">
        <div className="container max-w-3xl mx-auto px-4">
          <div className="rounded-2xl border border-red-200 bg-white p-8 md:p-10 text-center shadow-float">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Order Not Found
            </h1>
            <p className="text-gray-600 mb-8">
              We couldn't find your order details. Please check your email for confirmation or contact support.
            </p>
            <Button
              onClick={handleBackToEvents}
              className="h-11 rounded-xl"
            >
              Back to Events
            </Button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background-light pt-28 pb-12">
      <div className="container max-w-3xl mx-auto px-4">
        {/* Success Card */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-float overflow-hidden animate-fade-in-up">
          {/* Celebration Header with Gradient Background */}
          <div className="relative px-6 py-8 md:px-10 md:py-12 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border-b border-primary/10">
            {/* Decorative glow effect */}
            <div className="absolute inset-0 bg-gradient-glow opacity-50" />

            {/* Success Icon */}
            <div className="relative flex justify-center mb-6">
              <div className={cn(
                "flex h-20 w-20 items-center justify-center rounded-full",
                "bg-gradient-to-br from-primary to-primary-dark shadow-glow-lg",
                "animate-scale-in"
              )}>
                <CheckCircle className="h-12 w-12 text-white" strokeWidth={2.5} />
              </div>
            </div>

            {/* Success Message */}
            <div className="relative text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                Booking Confirmed!
              </h1>
              <p className="text-lg text-gray-600 max-w-md mx-auto">
                Your payment was successful and your tickets are confirmed
              </p>
            </div>
          </div>

          {/* Order Details */}
          <div className="px-6 py-8 md:px-10 md:py-10 space-y-6">
            {/* Confirmation Number */}
            <div className="flex items-start gap-4 rounded-xl border-2 border-primary/20 bg-primary/5 p-5">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600 mb-1">Confirmation Number</p>
                <p className="text-xl font-bold text-gray-900 font-mono tracking-tight">
                  {confirmationNumber}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Save this number for your records
                </p>
              </div>
            </div>

            {/* Order Summary */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>

              {/* Order ID */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-sm text-gray-600">Order ID</span>
                <span className="text-sm font-semibold text-gray-900 font-mono">
                  #{orderId}
                </span>
              </div>

              {/* Email */}
              <div className="flex items-start gap-3 py-3 border-b border-gray-100">
                <Mail className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-gray-600">Confirmation sent to</span>
                  <p className="text-sm font-semibold text-gray-900 break-all mt-0.5">
                    {email}
                  </p>
                </div>
              </div>

              {/* Total Amount */}
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Total Paid</span>
                </div>
                <span className="text-xl font-bold text-gray-900">
                  {formatCurrency(total)}
                </span>
              </div>

              {/* Status */}
              {status && (
                <div className="flex items-center justify-between py-3 border-t border-gray-100">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold",
                    status === 'confirmed'
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  )}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {status === 'confirmed' ? 'Confirmed' : 'Processing'}
                  </span>
                </div>
              )}
            </div>

            {/* Information Box */}
            <div className="rounded-xl bg-blue-50 border border-blue-200 p-5">
              <div className="flex items-start gap-3">
                <Download className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-900 mb-1">
                    Your Tickets Are Ready
                  </p>
                  <p className="text-sm text-blue-700">
                    A confirmation email with your tickets has been sent to <span className="font-semibold">{email}</span>.
                    You can also view and download your tickets from your account.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={handleViewTickets}
                className="flex-1 h-12 rounded-xl text-base font-semibold shadow-glow"
              >
                View My Tickets
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Button
                onClick={handleBackToEvents}
                variant="outline"
                className="flex-1 h-12 rounded-xl text-base font-semibold"
              >
                Browse More Events
              </Button>
            </div>

            {/* Support Link */}
            <div className="text-center pt-4">
              <p className="text-sm text-gray-500">
                Need help?{' '}
                <a
                  href="/support"
                  className="text-primary hover:text-primary-dark font-semibold transition-colors"
                >
                  Contact Support
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Additional Info Card */}
        <div className="mt-6 rounded-xl bg-white border border-gray-200 p-6 shadow-sm animate-fade-in">
          <h3 className="text-sm font-bold text-gray-900 mb-3">What's Next?</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Check your email for booking confirmation and tickets</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Download or save your tickets to your mobile device</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Present your tickets at the event entrance for scanning</span>
            </li>
          </ul>
        </div>
      </div>
    </main>
  )
}

function CheckoutSuccessLoading() {
  return (
    <main className="min-h-screen bg-background-light pt-28 pb-12">
      <div className="container max-w-3xl mx-auto px-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 md:p-10 shadow-float">
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
            <p className="text-gray-600">Loading order details...</p>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<CheckoutSuccessLoading />}>
      <CheckoutSuccessContent />
    </Suspense>
  )
}
