'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Eye, RotateCcw, XCircle, Download } from 'lucide-react'
import { format } from 'date-fns'

interface Booking {
  id: string
  confirmationNumber: string
  email: string
  firstName: string
  lastName: string
  event: { name: string }
  createdAt: string
  total: number
  status: string
}

interface BookingTableProps {
  bookings: Booking[]
  onView?: (bookingId: string) => void
  onRefund?: (bookingId: string) => void
  onCancel?: (bookingId: string) => void
  onResendEmail?: (bookingId: string) => void
}

const statusColors: Record<string, string> = {
  CONFIRMED: 'bg-green-100 text-green-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-orange-100 text-orange-800',
}

export function BookingTable({
  bookings,
  onView,
  onRefund,
  onCancel,
  onResendEmail,
}: BookingTableProps) {
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null)

  if (bookings.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <p className="text-gray-500 text-lg">No bookings found</p>
          <p className="text-gray-400 text-sm mt-2">
            Bookings will appear here when customers complete their purchases
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-4 px-6 font-semibold text-gray-700">
                Confirmation #
              </th>
              <th className="text-left py-4 px-6 font-semibold text-gray-700">
                Customer
              </th>
              <th className="text-left py-4 px-6 font-semibold text-gray-700">
                Event
              </th>
              <th className="text-left py-4 px-6 font-semibold text-gray-700">
                Date
              </th>
              <th className="text-left py-4 px-6 font-semibold text-gray-700">
                Total
              </th>
              <th className="text-left py-4 px-6 font-semibold text-gray-700">
                Status
              </th>
              <th className="text-center py-4 px-6 font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking, index) => (
              <tr
                key={booking.id}
                className={`border-b border-gray-100 hover:bg-gray-50 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                }`}
              >
                <td className="py-4 px-6 font-mono text-xs text-gray-600">
                  {booking.confirmationNumber.slice(0, 8).toUpperCase()}
                </td>
                <td className="py-4 px-6">
                  <div>
                    <p className="font-medium text-gray-900">
                      {booking.firstName} {booking.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{booking.email}</p>
                  </div>
                </td>
                <td className="py-4 px-6 text-gray-700">{booking.event.name}</td>
                <td className="py-4 px-6 text-gray-700">
                  {format(new Date(booking.createdAt), 'MMM dd, yyyy')}
                </td>
                <td className="py-4 px-6 font-semibold text-gray-900">
                  ${Number(booking.total).toFixed(2)}
                </td>
                <td className="py-4 px-6">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      statusColors[booking.status] ||
                      'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {booking.status}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView?.(booking.id)}
                    >
                      <Eye size={16} />
                    </Button>
                    {booking.status === 'CONFIRMED' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRefund?.(booking.id)}
                          title="Refund"
                        >
                          <Download size={16} className="rotate-180" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onCancel?.(booking.id)}
                          title="Cancel"
                        >
                          <XCircle size={16} />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onResendEmail?.(booking.id)}
                      title="Resend Confirmation"
                    >
                      <RotateCcw size={16} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
