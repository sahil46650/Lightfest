'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { AlertCircle, Check, Plus, Minus } from 'lucide-react'
import { CartItem } from '@/store/useCheckoutStore'

const attendeeSchema = z.object({
  name: z.string().min(1, 'Name required').max(100),
  email: z.string().email('Valid email required'),
})

const attendeeFormSchema = z.object({
  attendees: z.array(attendeeSchema),
  addOns: z.record(z.string(), z.array(z.object({
    name: z.string(),
    quantity: z.number().min(0),
    price: z.number(),
  }))),
})

type AttendeeFormData = z.infer<typeof attendeeFormSchema>

interface AttendeeInfoStepProps {
  onSubmit: (data: AttendeeFormData) => void
  onBack: () => void
  cartItems: CartItem[]
  isLoading?: boolean
  initialData?: Partial<AttendeeFormData>
}

const ADDON_LANTERN = {
  name: 'Extra Lantern',
  price: 8,
}

export const AttendeeInfoStep = React.forwardRef<HTMLDivElement, AttendeeInfoStepProps>(
  (
    {
      onSubmit,
      onBack,
      cartItems,
      isLoading = false,
      initialData,
    },
    ref
  ) => {
    const [activeTab, setActiveTab] = React.useState(0)
    const [addOns, setAddOns] = React.useState<Record<number, number>>(
      initialData?.addOns ?
        Object.fromEntries(
          Object.entries(initialData.addOns).map(([idx, items]) => [
            idx,
            items.find(item => item.name === ADDON_LANTERN.name)?.quantity || 0
          ])
        ) :
        Object.fromEntries(cartItems.map((_, idx) => [idx, 0]))
    )

    // Calculate total attendees needed
    const totalAttendees = cartItems.reduce((sum, item) => sum + item.quantity, 0)

    const {
      register,
      handleSubmit,
      formState: { errors },
      watch,
      setValue,
    } = useForm<AttendeeFormData>({
      resolver: zodResolver(attendeeFormSchema),
      defaultValues: {
        attendees: initialData?.attendees || Array(totalAttendees).fill({ name: '', email: '' }),
        addOns: initialData?.addOns || {},
      },
    })

    const attendees = watch('attendees')

    const handleAddOnsChange = (ticketIndex: number, delta: number) => {
      setAddOns((prev) => ({
        ...prev,
        [ticketIndex]: Math.max(0, (prev[ticketIndex] || 0) + delta),
      }))
    }

    const handleFormSubmit = (data: AttendeeFormData) => {
      const enrichedData = {
        ...data,
        addOns: Object.fromEntries(
          Object.entries(addOns).map(([idx, quantity]) => [
            idx,
            quantity > 0 ? [{ name: ADDON_LANTERN.name, quantity, price: ADDON_LANTERN.price }] : [],
          ])
        ),
      }
      onSubmit(enrichedData)
    }

    // Track which tabs have been completed
    const completedTabs = attendees.map((attendee) =>
      attendee.name && attendee.email
    )

    return (
      <Card ref={ref} className="w-full">
        <CardHeader>
          <CardTitle>Attendee Information</CardTitle>
          <CardDescription>
            We need details for each attendee in your group
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex gap-1 overflow-x-auto pb-0">
                {attendees.map((_, index) => {
                  const isActive = activeTab === index
                  const isCompleted = completedTabs[index]

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setActiveTab(index)}
                      className={cn(
                        'flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-all',
                        isActive
                          ? 'border-primary text-primary'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      )}
                    >
                      <span>Attendee {index + 1}</span>
                      {isCompleted && (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {/* Attendee Name and Email */}
              {attendees.map((_, index) => {
                if (activeTab !== index) return null

                return (
                  <div key={index} className="space-y-6">
                    {/* Ticket Type Display */}
                    <div className="rounded-lg bg-gray-50 p-4 border border-gray-200">
                      <p className="text-sm text-gray-600">Ticket Type</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {cartItems[0]?.ticketName || 'Standard Ticket'}
                      </p>
                    </div>

                    {/* Name Field */}
                    <div className="space-y-2">
                      <Label htmlFor={`name-${index}`} className="font-medium">
                        Full Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id={`name-${index}`}
                        placeholder="John Doe"
                        disabled={isLoading}
                        aria-invalid={!!errors.attendees?.[index]?.name}
                        aria-describedby={
                          errors.attendees?.[index]?.name ? `name-${index}-error` : undefined
                        }
                        {...register(`attendees.${index}.name`)}
                      />
                      {errors.attendees?.[index]?.name && (
                        <p
                          id={`name-${index}-error`}
                          className="flex items-center gap-1.5 text-sm text-red-600"
                        >
                          <AlertCircle className="h-4 w-4" />
                          {errors.attendees?.[index]?.name?.message}
                        </p>
                      )}
                    </div>

                    {/* Email Field */}
                    <div className="space-y-2">
                      <Label htmlFor={`email-${index}`} className="font-medium">
                        Email Address <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id={`email-${index}`}
                        type="email"
                        placeholder="john@example.com"
                        disabled={isLoading}
                        aria-invalid={!!errors.attendees?.[index]?.email}
                        aria-describedby={
                          errors.attendees?.[index]?.email ? `email-${index}-error` : undefined
                        }
                        {...register(`attendees.${index}.email`)}
                      />
                      {errors.attendees?.[index]?.email && (
                        <p
                          id={`email-${index}-error`}
                          className="flex items-center gap-1.5 text-sm text-red-600"
                        >
                          <AlertCircle className="h-4 w-4" />
                          {errors.attendees?.[index]?.email?.message}
                        </p>
                      )}
                    </div>

                    {/* Add-ons Section */}
            
                    {/* <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{ADDON_LANTERN.name}</p>
                          <p className="text-sm text-gray-600">
                            Enhance your experience with an extra lantern
                          </p>
                        </div>
                        <p className="text-lg font-bold text-primary">
                          ${ADDON_LANTERN.price}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleAddOnsChange(index, -1)}
                          disabled={isLoading || !addOns[index]}
                          className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-lg border transition-colors',
                            addOns[index]
                              ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20'
                              : 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                          )}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center font-semibold text-gray-900">
                          {addOns[index] || 0}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddOnsChange(index, 1)}
                          disabled={isLoading}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div> */}

                  </div>
                )
              })}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={isLoading}
                className="flex-1"
              >
                Previous
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !completedTabs.every(Boolean)}
                className="flex-1"
              >
                {isLoading ? 'Processing...' : 'Continue to Payment'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    )
  }
)

AttendeeInfoStep.displayName = 'AttendeeInfoStep'
