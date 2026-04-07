'use client'

import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { QuantitySelector } from './quantity-selector'
import { cn, formatDollars } from '@/lib/utils'
import { X } from 'lucide-react'

export interface TicketType {
  id: string
  name: string
  description: string
  price: number
  available: number
}

interface TicketSelectionModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  ticketTypes: TicketType[]
  onProceed: (selectedTickets: Record<string, number>, promoCode?: string) => void
  isLoading?: boolean
}

const TicketSelectionModal = React.forwardRef<
  HTMLDivElement,
  TicketSelectionModalProps
>(
  (
    {
      open = false,
      onOpenChange,
      ticketTypes,
      onProceed,
      isLoading = false,
    },
    ref
  ) => {
    const [quantities, setQuantities] = React.useState<Record<string, number>>(
      {}
    )
    const [promoCode, setPromoCode] = React.useState('')
    const [isPromoApplied, setIsPromoApplied] = React.useState(false)

    React.useEffect(() => {
      // Initialize quantities to 0 for all ticket types
      const initialQuantities: Record<string, number> = {}
      ticketTypes.forEach((ticket) => {
        initialQuantities[ticket.id] = 0
      })
      setQuantities(initialQuantities)
    }, [ticketTypes])

    const handleQuantityChange = (ticketId: string, quantity: number) => {
      setQuantities((prev) => ({
        ...prev,
        [ticketId]: quantity,
      }))
    }

    const handleApplyPromo = () => {
      if (promoCode.trim()) {
        // TODO: Validate promo code with backend
        setIsPromoApplied(true)
      }
    }

    const handleProceed = () => {
      const selectedTickets = Object.fromEntries(
        Object.entries(quantities).filter(([_, qty]) => qty > 0)
      )

      if (Object.keys(selectedTickets).length === 0) {
        alert('Please select at least one ticket')
        return
      }

      onProceed(selectedTickets, promoCode || undefined)
    }

    const subtotal = ticketTypes.reduce((sum, ticket) => {
      return sum + ticket.price * (quantities[ticket.id] || 0)
    }, 0)

    const totalTickets = Object.values(quantities).reduce((sum, qty) => sum + qty, 0)

    return (
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
          <Dialog.Content
            ref={ref}
            className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] rounded-lg bg-white p-6 shadow-lg"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-2xl font-bold text-gray-900">
                Select Your Tickets
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-100"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>

            {/* Content */}
            <div className="mt-6 space-y-6 overflow-y-auto max-h-96">
              {/* Ticket Types */}
              {ticketTypes.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between gap-4 border-b border-gray-200 pb-4 last:border-b-0"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {ticket.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {ticket.description}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {ticket.available} available
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <p className="font-semibold text-primary">
                      {formatDollars(ticket.price)}
                    </p>
                    <QuantitySelector
                      value={quantities[ticket.id] || 0}
                      onChange={(qty) =>
                        handleQuantityChange(ticket.id, qty)
                      }
                      max={ticket.available}
                    />
                  </div>
                </div>
              ))}

              {/* Promo Code */}
              <div className="mt-6 space-y-3 border-t border-gray-200 pt-4">
                <h4 className="font-semibold text-gray-900">
                  Have a promo code?
                </h4>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Enter promo code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    disabled={isPromoApplied}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={handleApplyPromo}
                    disabled={isPromoApplied || !promoCode.trim()}
                  >
                    {isPromoApplied ? 'Applied' : 'Apply'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-6 border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600">
                  {totalTickets} ticket{totalTickets !== 1 ? 's' : ''}
                </span>
                <span className="font-semibold text-gray-900">
                  {formatDollars(subtotal)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Dialog.Close asChild>
                  <Button variant="outline" className="flex-1">
                    Cancel
                  </Button>
                </Dialog.Close>
                <Button
                  onClick={handleProceed}
                  disabled={isLoading || totalTickets === 0}
                  className="flex-1"
                >
                  {isLoading ? 'Processing...' : 'Proceed to Checkout'}
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    )
  }
)

TicketSelectionModal.displayName = 'TicketSelectionModal'

export { TicketSelectionModal }
