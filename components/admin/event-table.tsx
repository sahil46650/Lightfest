'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Event } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Edit,
  Trash2,
  Eye,
  Copy,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { format } from 'date-fns'

interface EventWithCounts extends Event {
  _count?: {
    tickets: number
    bookings?: number
  }
  soldTickets?: number
}

interface EventTableProps {
  events: EventWithCounts[]
  onDelete?: (eventId: string) => void
  onDuplicate?: (eventId: string) => void
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

const statusColors: Record<string, string> = {
  PUBLISHED: 'bg-green-100 text-green-800',
  DRAFT: 'bg-gray-100 text-gray-800',
  SOLD_OUT: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-orange-100 text-orange-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
}

export function EventTable({
  events,
  onDelete,
  onDuplicate,
  pagination,
}: EventTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (events.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <p className="text-gray-500 text-lg">No events found</p>
          <p className="text-gray-400 text-sm mt-2">
            Create your first event to get started
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
                Event Name
              </th>
              <th className="text-left py-4 px-6 font-semibold text-gray-700">
                Date
              </th>
              <th className="text-left py-4 px-6 font-semibold text-gray-700">
                Location
              </th>
              <th className="text-left py-4 px-6 font-semibold text-gray-700">
                Tickets
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
            {events.map((event, index) => (
              <tr
                key={event.id}
                className={`border-b border-gray-100 hover:bg-gray-50 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                }`}
              >
                <td className="py-4 px-6">
                  <Link
                    href={`/admin/events/${event.id}`}
                    className="font-semibold text-gray-900 hover:text-magenta-600"
                  >
                    {event.name}
                  </Link>
                </td>
                <td className="py-4 px-6 text-gray-700">
                  {format(event.date, 'MMM dd, yyyy')}
                  <br />
                  <span className="text-xs text-gray-500">
                    {format(event.date, 'HH:mm')}
                  </span>
                </td>
                <td className="py-4 px-6 text-gray-700">
                  {event.location}
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-gray-600">
                          {event.soldTickets || 0} / {event.capacity || 0}
                        </span>
                        <span className="text-xs text-gray-500">
                          {event.capacity > 0
                            ? Math.round(
                                ((event.soldTickets || 0) / event.capacity) * 100
                              )
                            : 0}
                          %
                        </span>
                      </div>
                      <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-magenta-500 transition-all"
                          style={{
                            width: `${
                              event.capacity > 0
                                ? ((event.soldTickets || 0) / event.capacity) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      statusColors[event.status] ||
                      'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {event.status}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center justify-center gap-2">
                    <Link href={`/admin/events/${event.id}`}>
                      <Button variant="ghost" size="sm">
                        <Edit size={16} />
                      </Button>
                    </Link>
                    <a
                      href={`/events/${event.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="sm">
                        <Eye size={16} />
                      </Button>
                    </a>
                    <button
                      onClick={() =>
                        onDuplicate && onDuplicate(event.id)
                      }
                      className="p-2 text-gray-600 hover:bg-gray-200 rounded transition-colors"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={() =>
                        onDelete &&
                        onDelete(event.id)
                      }
                      className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total}{' '}
            total)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === pagination.totalPages}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
