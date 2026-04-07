import { Suspense } from 'react'
import { Metadata } from 'next'
import { EventsClient } from './events-client'

export const metadata: Metadata = {
  title: 'Explore Events | Festival Lights',
  description: 'Browse and book tickets for upcoming events at Festival Lights',
}

function EventsLoading() {
  return (
    <div className="container mx-auto px-4 pt-28 pb-12">
      <div className="mb-8">
        <div className="h-10 w-64 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-lg h-72 animate-pulse" />
        ))}
      </div>
    </div>
  )
}

export default function EventsPage() {
  return (
    <Suspense fallback={<EventsLoading />}>
      <EventsClient />
    </Suspense>
  )
}
