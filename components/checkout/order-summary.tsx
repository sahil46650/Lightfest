'use client'

import * as React from 'react'
import { cn, formatDollars } from '@/lib/utils'
import { Tag } from 'lucide-react'

export interface OrderSummaryItem {
  ticketName: string
  quantity: number
  price: number
}

interface OrderSummaryProps extends React.HTMLAttributes<HTMLDivElement> {
  items: OrderSummaryItem[]
  subtotal: number
  serviceFee: number
  discount?: number
  total: number
}

const OrderSummary = React.forwardRef<HTMLDivElement, OrderSummaryProps>(
  (
    {
      className,
      items,
      subtotal,
      serviceFee,
      discount = 0,
      total,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn('sticky top-20 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm', className)}
        {...props}
      >
        <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>

        {/* Ticket Items */}
        <div className="space-y-3 pb-4 border-b border-gray-100">
          {items.length === 0 ? (
            <p className="text-sm text-gray-500">No items in cart</p>
          ) : (
            items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <div>
                  <p className="font-medium text-gray-900">{item.ticketName}</p>
                  <p className="text-gray-500">Qty: {item.quantity}</p>
                </div>
                <p className="font-medium text-gray-900">
                  {formatDollars(item.price * item.quantity)}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Pricing */}
        <div className="space-y-2 py-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span className="text-gray-900">{formatDollars(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Service Fee</span>
            <span className="text-gray-900">{formatDollars(serviceFee)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between">
              <span className="text-green-600 flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" />
                Discount
              </span>
              <span className="text-green-600 font-medium">-{formatDollars(discount)}</span>
            </div>
          )}
        </div>

        {/* Total */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <span className="text-base font-bold text-gray-900">Total</span>
          <span className="text-xl font-bold text-primary">{formatDollars(total)}</span>
        </div>

        <p className="text-xs text-gray-400 mt-4">
          All sales are final.
        </p>
      </div>
    )
  }
)

OrderSummary.displayName = 'OrderSummary'

export { OrderSummary }
