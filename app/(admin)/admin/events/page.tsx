'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EventTable } from '@/components/admin/event-table'
import { EventFilters } from '@/components/admin/event-filters'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Event } from '@prisma/client'

interface EventWithCapacity extends Event {
  capacity: number
  soldTickets: number
  _count?: {
    tickets: number
  }
}

export default function EventsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<EventWithCapacity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchEvents()
  }, [searchQuery, statusFilter])

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const response = await fetch(`/api/admin/events?${params}`)
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || [])
      }
    } catch (error) {
      console.error('Failed to fetch events:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return

    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setEvents(events.filter(e => e.id !== eventId))
      }
    } catch (error) {
      console.error('Failed to delete event:', error)
    }
  }

  const handleDuplicate = async (eventId: string) => {
    try {
      const response = await fetch(`/api/admin/events/${eventId}/duplicate`, {
        method: 'POST',
      })
      if (response.ok) {
        const data = await response.json()
        router.push(`/admin/events/${data.event.id}`)
      }
    } catch (error) {
      console.error('Failed to duplicate event:', error)
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600 mt-1">
            Manage all your events, create new ones, and track sales
          </p>
        </div>
        <Link href="/admin/events/new">
          <Button className="gap-2">
            <Plus size={18} />
            Create Event
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <EventFilters
        onSearch={setSearchQuery}
        onStatusFilter={setStatusFilter}
      />

      {/* Events Table */}
      {loading ? (
        <Card className="p-12">
          <div className="text-center text-gray-500">Loading events...</div>
        </Card>
      ) : (
        <EventTable
          events={events}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
        />
      )}
    </div>
  )
}
