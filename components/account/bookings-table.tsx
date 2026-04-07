'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  MapPin,
  ChevronDown,
  ChevronUp,
  Mail,
  ExternalLink,
  Ticket,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface BookingTicket {
  id: string
  attendeeName?: string | null
  attendeeEmail?: string | null
  qrCode?: string | null
  ticketType: {
    name: string
    price: number | string
  }
  addOnsJson?: string | null
}

interface Booking {
  id: string
  confirmationNumber: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED'
  email: string
  firstName: string
  lastName: string
  phone: string
  subtotal: number | string
  discount: number | string
  serviceFee: number | string
  total: number | string
  createdAt: Date | string
  event: {
    name: string
    date: Date | string
    location: string
    address?: string | null
  }
  tickets: BookingTicket[]
  promoCode?: {
    code: string
    discountType: 'PERCENTAGE' | 'FIXED'
    discountValue: number | string
  } | null
}

interface BookingsTableProps {
  bookings: Booking[]
  className?: string
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CONFIRMED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  REFUNDED: 'bg-gray-100 text-gray-800 border-gray-200',
}

const statusLabels: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
}

function BookingRow({ booking }: { booking: Booking }) {
  const [isExpanded, setIsExpanded] = React.useState(false)

  const eventDate = new Date(booking.event.date)
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const formattedTime = eventDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  const total = typeof booking.total === 'string'
    ? parseFloat(booking.total)
    : booking.total
  const subtotal = typeof booking.subtotal === 'string'
    ? parseFloat(booking.subtotal)
    : booking.subtotal
  const discount = typeof booking.discount === 'string'
    ? parseFloat(booking.discount)
    : booking.discount
  const serviceFee = typeof booking.serviceFee === 'string'
    ? parseFloat(booking.serviceFee)
    : booking.serviceFee

  const handleResendEmail = async () => {
    try {
      await fetch(`/api/bookings/${booking.id}/resend`, {
        method: 'POST',
      })
      alert('Confirmation email sent!')
    } catch (error) {
      alert('Failed to send email. Please try again.')
    }
  }

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      {/* Main row */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 text-left transition-colors hover:bg-gray-50"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-3">
              <p className="font-medium text-gray-900">{booking.event.name}</p>
              <span
                className={cn(
                  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
                  statusColors[booking.status]
                )}
              >
                {statusLabels[booking.status]}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formattedDate} at {formattedTime}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {booking.event.location}
              </span>
              <span className="text-gray-400">
                #{booking.confirmationNumber.slice(-8).toUpperCase()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-semibold text-gray-900">${total.toFixed(2)}</p>
              <p className="text-xs text-gray-500">
                {booking.tickets.length} ticket{booking.tickets.length !== 1 ? 's' : ''}
              </p>
            </div>
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Booking Details */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Booking Details</h4>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Event Location</span>
                  <span className="text-gray-900">{booking.event.location}</span>
                </div>
                {booking.event.address && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Address</span>
                    <span className="text-gray-900">{booking.event.address}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Date & Time</span>
                  <span className="text-gray-900">
                    {formattedDate} at {formattedTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Booked By</span>
                  <span className="text-gray-900">
                    {booking.firstName} {booking.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Contact Email</span>
                  <span className="text-gray-900">{booking.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Phone</span>
                  <span className="text-gray-900">{booking.phone}</span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-gray-200 pt-4">
                <h5 className="mb-2 text-sm font-medium text-gray-900">Price Breakdown</h5>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="text-gray-900">${subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>
                        Discount
                        {booking.promoCode && (
                          <span className="ml-1 text-xs">({booking.promoCode.code})</span>
                        )}
                      </span>
                      <span>-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Service Fee</span>
                    <span className="text-gray-900">${serviceFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-1 font-medium">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tickets */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Tickets</h4>

              <div className="space-y-3">
                {booking.tickets.map((ticket, index) => {
                  const ticketPrice = typeof ticket.ticketType.price === 'string'
                    ? parseFloat(ticket.ticketType.price)
                    : ticket.ticketType.price
                  const addOns = ticket.addOnsJson ? JSON.parse(ticket.addOnsJson) : []

                  return (
                    <div
                      key={ticket.id}
                      className="rounded-lg border border-gray-200 bg-white p-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {ticket.ticketType.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {ticket.attendeeName || 'Guest'}
                          </p>
                          {ticket.attendeeEmail && (
                            <p className="text-xs text-gray-400">
                              {ticket.attendeeEmail}
                            </p>
                          )}
                          {addOns.length > 0 && (
                            <p className="mt-1 text-xs text-gray-500">
                              Add-ons: {addOns.map((a: any) => a.name).join(', ')}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            ${ticketPrice.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-400">
                            Ticket #{index + 1}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Actions */}
              <div className="flex gap-2 border-t border-gray-200 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResendEmail}
                  className="flex-1"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Resend Email
                </Button>
                {/* View tickets button - could link to a PDF or QR code page */}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function BookingsTable({ bookings, className }: BookingsTableProps) {
  const [statusFilter, setStatusFilter] = React.useState<string>('all')

  const filteredBookings = React.useMemo(() => {
    if (statusFilter === 'all') return bookings
    return bookings.filter((b) => b.status === statusFilter)
  }, [bookings, statusFilter])

  if (bookings.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-12">
          <div className="text-center">
            <Ticket className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-lg font-medium text-gray-900">No bookings yet</p>
            <p className="mt-1 text-gray-500">
              Book your first event to see it here
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>My Bookings</CardTitle>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Status</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PENDING">Pending</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-200">
          {filteredBookings.map((booking) => (
            <BookingRow key={booking.id} booking={booking} />
          ))}
        </div>
        {filteredBookings.length === 0 && (
          <div className="py-8 text-center text-gray-500">
            No bookings match this filter
          </div>
        )}
      </CardContent>
    </Card>
  )
}

BookingsTable.displayName = 'BookingsTable'
