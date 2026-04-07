'use client'

import { ArrowUpDown } from 'lucide-react'

interface EventSortControlsProps {
  currentSort: string
  currentOrder: string
  onSortChange: (sortBy: string, sortOrder: string) => void
}

const SORT_OPTIONS = [
  { value: 'date', label: 'Date' },
  { value: 'location', label: 'Location' },
  { value: 'availability', label: 'Tickets Available' },
]

export function EventSortControls({
  currentSort,
  currentOrder,
  onSortChange,
}: EventSortControlsProps) {
  const toggleOrder = () => {
    const newOrder = currentOrder === 'asc' ? 'desc' : 'asc'
    onSortChange(currentSort, newOrder)
  }

  const handleSortSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value
    onSortChange(newSort, currentOrder)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-8 items-start sm:items-center">
      <div className="flex-1">
        <label htmlFor="sort-select" className="block text-sm font-medium text-gray-700 mb-2">
          Sort by
        </label>
        <select
          id="sort-select"
          value={currentSort}
          onChange={handleSortSelect}
          className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {SORT_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={toggleOrder}
        className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 flex items-center gap-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        aria-label={`Sort order: ${currentOrder === 'asc' ? 'ascending' : 'descending'}`}
      >
        <ArrowUpDown className="h-4 w-4" />
        <span className="hidden sm:inline text-sm font-medium">
          {currentOrder === 'asc' ? 'Ascending' : 'Descending'}
        </span>
      </button>
    </div>
  )
}
