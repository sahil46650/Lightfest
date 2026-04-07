'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Trash2, Plus, Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/navigation'

// Helper to safely get error message
const getErrorMessage = (error: any): string | undefined => {
  return error?.message as string | undefined
}

// Validation schema
const ticketTypeSchema = z.object({
  name: z.string().min(1, 'Ticket type name is required'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be 0 or greater'),
  quantityTotal: z.coerce.number().min(1, 'Quantity must be at least 1'),
  availableFrom: z.string().optional(),
  availableTo: z.string().optional(),
}) as any

const eventFormSchema = z.object({
  name: z.string().min(1, 'Event name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  location: z.string().min(1, 'Location is required'),
  address: z.string().optional(),
  date: z.string().min(1, 'Event date is required'),
  endDate: z.string().optional(),
  timezone: z.string().default('UTC'),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
  status: z.enum(['DRAFT', 'PUBLISHED']),
  ticketTypes: z.array(ticketTypeSchema).min(1, 'At least one ticket type is required'),
}) as any

type EventFormValues = z.infer<typeof eventFormSchema>

interface EventFormProps {
  eventId?: string
  initialData?: Partial<EventFormValues>
  onSuccess?: () => void
}

export function EventForm({
  eventId,
  initialData,
  onSuccess,
}: EventFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [preview, setPreview] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
    setValue,
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      status: 'DRAFT',
      timezone: 'UTC',
      ticketTypes: [
        { name: '', description: '', price: 0, quantityTotal: 0 },
      ],
      ...initialData,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'ticketTypes',
  })

  const nameValue = watch('name')

  // Auto-generate slug from name
  useEffect(() => {
    if (nameValue && !eventId) {
      const slug = nameValue
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
      setValue('slug', slug)
    }
  }, [nameValue, eventId, setValue])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const onSubmit = async (data: EventFormValues) => {
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('eventData', JSON.stringify(data))
      if (imageFile) {
        formData.append('image', imageFile)
      }

      const url = eventId
        ? `/api/admin/events/${eventId}`
        : '/api/admin/events'
      const method = eventId ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        router.push('/admin/events')
        onSuccess?.()
      } else {
        const error = await response.json()
        alert(`Error: ${error.message}`)
      }
    } catch (error) {
      console.error('Form submission error:', error)
      alert('Failed to save event. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Basic Information */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Basic Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="name">Event Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Summer Music Festival"
              {...register('name')}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{getErrorMessage(errors.name)}</p>
            )}
          </div>

          <div>
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              placeholder="summer-music-festival"
              {...register('slug')}
              className={errors.slug ? 'border-red-500' : ''}
            />
            {errors.slug && (
              <p className="text-red-600 text-sm mt-1">{getErrorMessage(errors.slug)}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="description">Description *</Label>
            <textarea
              id="description"
              placeholder="Describe your event..."
              rows={4}
              {...register('description')}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-magenta-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.description && (
              <p className="text-red-600 text-sm mt-1">
                {getErrorMessage(errors.description)}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Date and Location */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Date and Location
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="date">Event Date & Time *</Label>
            <Input
              id="date"
              type="datetime-local"
              {...register('date')}
              className={errors.date ? 'border-red-500' : ''}
            />
            {errors.date && (
              <p className="text-red-600 text-sm mt-1">{getErrorMessage(errors.date)}</p>
            )}
          </div>

          <div>
            <Label htmlFor="endDate">End Date & Time (Optional)</Label>
            <Input
              id="endDate"
              type="datetime-local"
              {...register('endDate')}
            />
          </div>

          <div>
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              placeholder="City, Venue"
              {...register('location')}
              className={errors.location ? 'border-red-500' : ''}
            />
            {errors.location && (
              <p className="text-red-600 text-sm mt-1">
                {getErrorMessage(errors.location)}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="address">Address (Optional)</Label>
            <Input
              id="address"
              placeholder="Street address"
              {...register('address')}
            />
          </div>

          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <select
              id="timezone"
              {...register('timezone')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-magenta-500"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">London</option>
              <option value="Europe/Paris">Paris</option>
            </select>
          </div>

          <div>
            <Label htmlFor="capacity">Capacity *</Label>
            <Input
              id="capacity"
              type="number"
              min="1"
              {...register('capacity')}
              className={errors.capacity ? 'border-red-500' : ''}
            />
            {errors.capacity && (
              <p className="text-red-600 text-sm mt-1">
                {getErrorMessage(errors.capacity)}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Media */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Media</h2>
        <div>
          <Label htmlFor="image">Hero Image</Label>
          <div className="mt-2 flex gap-6">
            <div className="flex-1">
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="border-2 border-dashed border-gray-300 py-8"
              />
              <p className="text-xs text-gray-500 mt-2">
                Recommended: 1200x630px, Max 5MB
              </p>
            </div>
            {imagePreview && (
              <div className="w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Ticket Types */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Ticket Types
          </h2>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              append({
                name: '',
                description: '',
                price: 0,
                quantityTotal: 0,
              })
            }
            className="gap-2"
          >
            <Plus size={16} />
            Add Ticket Type
          </Button>
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="p-4 border border-gray-200 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    placeholder="e.g., Early Bird"
                    {...register(`ticketTypes.${index}.name`)}
                    className={
                      (errors.ticketTypes as any)?.[index]?.name
                        ? 'border-red-500'
                        : ''
                    }
                  />
                </div>

                <div>
                  <Label>Price ($) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...register(`ticketTypes.${index}.price`)}
                    className={
                      (errors.ticketTypes as any)?.[index]?.price
                        ? 'border-red-500'
                        : ''
                    }
                  />
                </div>

                <div>
                  <Label>Quantity *</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="100"
                    {...register(`ticketTypes.${index}.quantityTotal`)}
                    className={
                      (errors.ticketTypes as any)?.[index]?.quantityTotal
                        ? 'border-red-500'
                        : ''
                    }
                  />
                </div>

                <div className="flex items-end">
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => remove(index)}
                      className="w-full gap-2"
                    >
                      <Trash2 size={16} />
                      Remove
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Description (Optional)</Label>
                  <Input
                    placeholder="e.g., Limited time offer"
                    {...register(`ticketTypes.${index}.description`)}
                  />
                </div>

                <div>
                  <Label>Available Until (Optional)</Label>
                  <Input
                    type="datetime-local"
                    {...register(`ticketTypes.${index}.availableTo`)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {errors.ticketTypes && (
          <p className="text-red-600 text-sm mt-4">
            {getErrorMessage(errors.ticketTypes)}
          </p>
        )}
      </Card>

      {/* Status */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Status</h2>
        <div className="space-y-3">
          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              value="DRAFT"
              {...register('status')}
              className="w-4 h-4"
            />
            <span className="font-medium text-gray-900">Draft</span>
            <span className="text-sm text-gray-600">
              Event is not published yet
            </span>
          </label>
          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              value="PUBLISHED"
              {...register('status')}
              className="w-4 h-4"
            />
            <span className="font-medium text-gray-900">Published</span>
            <span className="text-sm text-gray-600">
              Event is live and visible to customers
            </span>
          </label>
        </div>
      </Card>

      {/* Form Actions */}
      <div className="flex gap-4 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setPreview(!preview)}
          className="gap-2"
          disabled={isLoading}
        >
          {preview ? <EyeOff size={16} /> : <Eye size={16} />}
          {preview ? 'Hide' : 'Preview'}
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? 'Saving...' : 'Save & Publish'}
        </Button>
      </div>
    </form>
  )
}
