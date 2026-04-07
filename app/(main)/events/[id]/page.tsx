'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Calendar, MapPin, Clock, Users, Ticket, Loader2 } from 'lucide-react'
import { useEvent, useTicketTypes } from '@/features/events/api'
import { formatEventDate, formatEventLocation } from '@/features/events/utils'
import { useBuildCartItems } from '@/features/cart'
import { useCheckoutStore, CheckoutStep } from '@/store/useCheckoutStore'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatDollars } from '@/lib/utils'

interface TicketSelection {
  typeId: string
  name: string
  price: number
  quantity: number
}

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string

  const [selectedTickets, setSelectedTickets] = React.useState<TicketSelection[]>([])
  const [isCheckingOut, setIsCheckingOut] = React.useState(false)

  // Build cart mutation for validating and pricing via TSCheckout API
  const buildCart = useBuildCartItems()

  // Zustand store for checkout state (cart managed client-side)
  const checkoutStore = useCheckoutStore()

  // Fetch event details by ID
  const { data: eventData, isLoading: eventLoading, error: eventError } = useEvent(eventId)
  const event = eventData?.data

  // Fetch ticket types using the event ID
  const ticketEventId = event?.id || eventId
  const { data: ticketData, isLoading: ticketsLoading } = useTicketTypes(eventId)
  const ticketTypes = ticketData?.data ?? []

  const handleTicketChange = (typeId: string, name: string, price: number, quantity: number) => {
    setSelectedTickets(prev => {
      const existing = prev.filter(t => t.typeId !== typeId)
      if (quantity > 0) {
        return [...existing, { typeId, name, price, quantity }]
      }
      return existing
    })
  }

  const totalAmount = selectedTickets.reduce((sum, t) => sum + t.price * t.quantity, 0)
  const totalTickets = selectedTickets.reduce((sum, t) => sum + t.quantity, 0)

  const handleCheckout = async () => {
    if (totalTickets === 0) return

    setIsCheckingOut(true)

    try {
      // Generate a unique cart ID (for reference/tracking only, cart managed client-side)
      const cartId = crypto.randomUUID()

      // Build tickets array for TSCheckout API validation (v1 uses ticketTypeId)
      const tickets = selectedTickets.flatMap((ticket) =>
        Array.from({ length: ticket.quantity }, () => ({
          ticketTypeId: parseInt(ticket.typeId, 10),
        }))
      )

      // Validate cart and get server-side pricing via TSCheckout API
      const cartResult = await buildCart.mutateAsync({
        includeFees: 1,
        tickets,
      })

      // Reset and populate Zustand store for checkout UI
      checkoutStore.reset()
      checkoutStore.initializeBooking(cartId, event?.id?.toString() || eventId)

      // Add each ticket selection to the cart with server-validated prices
      selectedTickets.forEach((ticket) => {
        checkoutStore.addToCart({
          ticketTypeId: ticket.typeId,
          ticketName: ticket.name,
          price: ticket.price,
          quantity: ticket.quantity,
        })
      })

      // Move to personal info step (skip ticket selection since it's done here)
      checkoutStore.setCurrentStep(CheckoutStep.PERSONAL_INFO)

      // Store checkout context in sessionStorage (includes server-validated totals)
      const checkoutData = {
        cartId,
        eventId: event?.id || eventId,
        eventName: event?.title || 'Event',
        tickets: selectedTickets,
        totalAmount: cartResult.total, // Use server-validated total (orderTotal from v1 API)
        subtotal: cartResult.subtotal, // cartTotal from v1 API
        serviceFee: cartResult.serviceFee,
        processingFee: cartResult.processingFee,
        discounts: cartResult.discounts,
      }
      sessionStorage.setItem('checkoutData', JSON.stringify(checkoutData))

      // Navigate to checkout with the cart ID
      router.push(`/checkout/${cartId}`)
    } catch (error) {
      console.error('Failed to validate cart:', error)
      // TODO: Show user-friendly error notification
    } finally {
      setIsCheckingOut(false)
    }
  }

  if (eventLoading) {
    return <EventDetailSkeleton />
  }

  if (eventError || !event) {
    return (
      <main className="min-h-screen bg-background-light pt-28 pb-12">
        <div className="container max-w-6xl mx-auto px-4">
          <Link href="/events" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </Link>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
            <p className="text-gray-600 mb-6">
              Sorry, we couldn't find the event you're looking for.
            </p>
            <Button asChild>
              <Link href="/events">Browse All Events</Link>
            </Button>
          </div>
        </div>
      </main>
    )
  }

  const eventDate = formatEventDate(event.start)
  const eventLocation = event.venue?.name || event.location || event.title
  const imageUrl = event.largePic || event.smallPic || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80'

  return (
    <main className="min-h-screen bg-background-light pt-28 pb-12">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Back link */}
        <Link href="/events" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Events
        </Link>

        <div className="grid lg:grid-cols-[1fr,400px] gap-8">
          {/* Main content */}
          <div>
            {/* Hero image */}
            <div className="relative aspect-[16/9] rounded-2xl overflow-hidden mb-8">
              <Image
                src={imageUrl}
                alt={event.title}
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Event details */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {event.title}
            </h1>

            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-5 h-5" />
                <span>{eventDate}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-5 h-5" />
                <span>{eventLocation}</span>
              </div>
              {event.inventory && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="w-5 h-5" />
                  <span>
                    {event.inventory.total === null
                      ? 'Unlimited capacity'
                      : `${Math.max(0, event.inventory.total - event.inventory.sold)} tickets available`}
                  </span>
                </div>
              )}
            </div>

            {event.description && (
              <div className="prose prose-gray max-w-none mb-8">
                <h2 className="text-xl font-semibold mb-3">About This Event</h2>
                <p className="text-gray-600 whitespace-pre-wrap">{event.description}</p>
              </div>
            )}
          </div>

          {/* Ticket selection sidebar */}
          <div className="lg:sticky lg:top-28 h-fit">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Ticket className="w-5 h-5" />
                Select Tickets
              </h2>

              {ticketsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full rounded-lg" />
                  <Skeleton className="h-20 w-full rounded-lg" />
                </div>
              ) : ticketTypes.length === 0 ? (
                <p className="text-gray-500 py-4">
                  No tickets available at this time.
                </p>
              ) : (
                <div className="space-y-4 mb-6">
                  {ticketTypes.map((ticket) => {
                    const selected = selectedTickets.find(t => t.typeId === String(ticket.id))
                    const quantity = selected?.quantity || 0
                    const remaining = ticket.quantityAvailable !== undefined
                      ? Math.max(0, ticket.quantityAvailable - (ticket.quantitySold || 0))
                      : 99

                    return (
                      <div
                        key={ticket.id}
                        className={cn(
                          "border rounded-xl p-4 transition-colors",
                          quantity > 0 ? "border-primary bg-primary/5" : "border-gray-200"
                        )}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold">{ticket.name}</h3>
                            {ticket.description && (
                              <p className="text-sm text-gray-500">{ticket.description}</p>
                            )}
                          </div>
                          <span className="font-bold text-lg">
                            {formatDollars(ticket.price)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <span className="text-sm text-gray-500">
                            {remaining > 0 ? `${remaining} left` : 'Sold out'}
                          </span>

                          {remaining > 0 && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleTicketChange(
                                  String(ticket.id),
                                  ticket.name,
                                  ticket.price,
                                  Math.max(0, quantity - 1)
                                )}
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
                                disabled={quantity === 0}
                              >
                                -
                              </button>
                              <span className="w-8 text-center font-medium">{quantity}</span>
                              <button
                                type="button"
                                onClick={() => handleTicketChange(
                                  String(ticket.id),
                                  ticket.name,
                                  ticket.price,
                                  Math.min(remaining, quantity + 1)
                                )}
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
                                disabled={quantity >= remaining}
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Total and checkout */}
              {totalTickets > 0 && (
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-600">
                      {totalTickets} ticket{totalTickets !== 1 ? 's' : ''}
                    </span>
                    <span className="text-2xl font-bold">
                      ${totalAmount.toFixed(2)}
                    </span>
                  </div>

                  <Button
                    onClick={handleCheckout}
                    className="w-full"
                    size="lg"
                    disabled={isCheckingOut}
                  >
                    {isCheckingOut ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Validating...
                      </>
                    ) : (
                      'Proceed to Checkout'
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

function EventDetailSkeleton() {
  return (
    <main className="min-h-screen bg-background-light pt-28 pb-12">
      <div className="container max-w-6xl mx-auto px-4">
        <Skeleton className="h-6 w-32 mb-8" />

        <div className="grid lg:grid-cols-[1fr,400px] gap-8">
          <div>
            <Skeleton className="aspect-[16/9] rounded-2xl mb-8" />
            <Skeleton className="h-10 w-3/4 mb-4" />
            <div className="flex gap-4 mb-6">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-6 w-40" />
            </div>
            <Skeleton className="h-40 w-full" />
          </div>

          <div>
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <Skeleton className="h-8 w-40 mb-4" />
              <Skeleton className="h-20 w-full rounded-lg mb-4" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
