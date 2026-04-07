'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { BookingTable } from '@/components/admin/booking-table'
import { BookingFilters } from '@/components/admin/booking-filters'
import { Download } from 'lucide-react'

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

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchBookings()
  }, [searchQuery, statusFilter])

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const response = await fetch(`/api/admin/bookings?${params}`)
      if (response.ok) {
        const data = await response.json()
        setBookings(data.bookings || [])
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefund = async (bookingId: string) => {
    if (!confirm('Are you sure you want to refund this booking?')) return

    try {
      const response = await fetch(
        `/api/admin/bookings/${bookingId}/refund`,
        { method: 'POST' }
      )
      if (response.ok) {
        setBookings(
          bookings.map(b =>
            b.id === bookingId ? { ...b, status: 'REFUNDED' } : b
          )
        )
      }
    } catch (error) {
      console.error('Failed to refund booking:', error)
    }
  }

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return

    try {
      const response = await fetch(
        `/api/admin/bookings/${bookingId}/cancel`,
        { method: 'POST' }
      )
      if (response.ok) {
        setBookings(
          bookings.map(b =>
            b.id === bookingId ? { ...b, status: 'CANCELLED' } : b
          )
        )
      }
    } catch (error) {
      console.error('Failed to cancel booking:', error)
    }
  }

  const handleResendEmail = async (bookingId: string) => {
    try {
      const response = await fetch(
        `/api/admin/bookings/${bookingId}/resend`,
        { method: 'POST' }
      )
      if (response.ok) {
        alert('Confirmation email resent successfully')
      }
    } catch (error) {
      console.error('Failed to resend email:', error)
    }
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      params.append('format', 'csv')

      const response = await fetch(`/api/admin/bookings/export?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Failed to export bookings:', error)
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
          <p className="text-gray-600 mt-1">
            Manage customer bookings, refunds, and communications
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={handleExport}
        >
          <Download size={18} />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <BookingFilters
        onSearch={setSearchQuery}
        onStatusFilter={setStatusFilter}
      />

      {/* Bookings Table */}
      {loading ? (
        <Card className="p-12">
          <div className="text-center text-gray-500">Loading bookings...</div>
        </Card>
      ) : (
        <BookingTable
          bookings={bookings}
          onRefund={handleRefund}
          onCancel={handleCancel}
          onResendEmail={handleResendEmail}
        />
      )}

      {/* Booking Count */}
      <div className="text-sm text-gray-600">
        Showing {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}
