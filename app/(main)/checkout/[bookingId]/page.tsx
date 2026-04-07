'use client'

import * as React from 'react'
import { useRouter, useParams } from 'next/navigation'
import { CheckoutContainer } from '@/components/checkout/checkout-container'

interface CheckoutPageProps {
  params: {
    bookingId: string
  }
}

export default function CheckoutPage() {
  const router = useRouter()
  const params = useParams()
  const bookingId = params.bookingId as string

  const handleSuccess = (data: any) => {
    console.log('Booking completed:', data)

    // Redirect to success page with order details
    const searchParams = new URLSearchParams({
      orderId: data.orderId || '',
      confirmationNumber: data.confirmationNumber || '',
      email: data.email || '',
      total: data.total?.toString() || '0',
      status: data.status || 'confirmed',
    })

    router.push(`/checkout/success?${searchParams.toString()}`)
  }

  const handleError = (error: Error) => {
    console.error('Checkout error:', error)
  }

  return (
    <main className="min-h-screen bg-background-light pt-28 pb-12">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Booking</h1>
          <p className="text-gray-600 mt-2">
            Booking ID: <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{bookingId}</span>
          </p>
        </div>

        <CheckoutContainer
          cartId={bookingId}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </div>
    </main>
  )
}
