import { EventForm } from '@/components/admin/event-form'

export default function CreateEventPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create New Event</h1>
        <p className="text-gray-600 mt-1">
          Add all the details about your event and configure ticket types
        </p>
      </div>

      <EventForm />
    </div>
  )
}
