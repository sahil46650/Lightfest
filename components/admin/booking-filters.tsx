'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'

interface BookingFiltersProps {
  onSearch?: (query: string) => void
  onStatusFilter?: (status: string) => void
  onEventFilter?: (eventId: string) => void
}

export function BookingFilters({
  onSearch,
  onStatusFilter,
  onEventFilter,
}: BookingFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [status, setStatus] = useState('all')

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    onSearch?.(value)
  }

  const handleStatusChange = (value: string) => {
    setStatus(value)
    onStatusFilter?.(value)
  }

  const handleClear = () => {
    setSearchQuery('')
    setStatus('all')
    onSearch?.('')
    onStatusFilter?.('all')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <Input
              type="text"
              placeholder="Search by confirmation #, email, or name..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-4"
            />
          </div>
        </div>

        {/* Status Filter */}
        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-magenta-500"
        >
          <option value="all">All Status</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PENDING">Pending</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="REFUNDED">Refunded</option>
        </select>

        {/* Clear Button */}
        {(searchQuery || status !== 'all') && (
          <Button
            variant="outline"
            onClick={handleClear}
            className="gap-2"
          >
            <X size={16} />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {(searchQuery || status !== 'all') && (
        <div className="text-sm text-gray-600">
          Showing results
          {searchQuery && ` for "${searchQuery}"`}
          {searchQuery && status !== 'all' && ' with'}
          {status !== 'all' && ` status: ${status}`}
        </div>
      )}
    </div>
  )
}
