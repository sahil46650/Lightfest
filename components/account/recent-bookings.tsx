'use client'

import * as React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, ChevronRight, Ticket } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Booking {
  id: string
  confirmationNumber: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED'
  event: {
    name: string
    date: Date | string
    location: string
  }
  total: number | string
  tickets: Array<{
    id: string
  }>
}

interface RecentBookingsProps {
  bookings: Booking[]
  className?: string
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
}

const statusLabels: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
}

export function RecentBookings({ bookings, className }: RecentBookingsProps) {
  if (bookings.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Ticket className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-gray-500">No bookings yet</p>
            <Link href="/">
              <Button className="mt-4">Browse Events</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Bookings</CardTitle>
        <Link href="/account/bookings">
          <Button variant="ghost" size="sm">
            View All
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {bookings.map((booking) => {
          const eventDate = new Date(booking.event.date)
          const formattedDate = eventDate.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })
          const formattedTime = eventDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          })
          const total = typeof booking.total === 'string'
            ? parseFloat(booking.total)
            : booking.total

          return (
            <Link
              key={booking.id}
              href={`/account/bookings?booking=${booking.id}`}
              className="block rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="font-medium text-gray-900">{booking.event.name}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formattedDate} at {formattedTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {booking.event.location}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-xs text-gray-400">
                      #{booking.confirmationNumber.slice(-8).toUpperCase()}
                    </span>
                    <span className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                      statusColors[booking.status]
                    )}>
                      {statusLabels[booking.status]}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    ${total.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {booking.tickets.length} ticket{booking.tickets.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </Link>
          )
        })}
      </CardContent>
    </Card>
  )
}

RecentBookings.displayName = 'RecentBookings'
