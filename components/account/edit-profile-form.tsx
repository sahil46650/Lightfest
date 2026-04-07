'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Loader2 } from 'lucide-react'
import { updateProfileSchema, type UpdateProfileFormData } from '@/lib/validations/auth'

interface EditProfileFormProps {
  user: {
    id: string
    name?: string | null
    email?: string | null
    phone?: string | null
    image?: string | null
  }
}

export function EditProfileForm({ user }: EditProfileFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user.name || '',
      phone: user.phone || '',
      image: user.image || '',
    },
  })

  const onSubmit = async (data: UpdateProfileFormData) => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.message || 'Failed to update profile')
        return
      }

      setSuccess(true)
      router.refresh()

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false)
      }, 3000)
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
        <CardDescription>
          Update your profile information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Success message */}
          {success && (
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Profile updated successfully!
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email" className="font-medium text-gray-500">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={user.email || ''}
              disabled
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-500">
              Email cannot be changed. Contact support if you need to update it.
            </p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="font-medium">
              Full Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              disabled={isLoading}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
              {...register('name')}
            />
            {errors.name && (
              <p id="name-error" className="flex items-center gap-1.5 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="font-medium">
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1234567890"
              disabled={isLoading}
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? 'phone-error' : undefined}
              {...register('phone')}
            />
            {errors.phone && (
              <p id="phone-error" className="flex items-center gap-1.5 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {errors.phone.message}
              </p>
            )}
          </div>

          {/* Profile Image URL */}
          <div className="space-y-2">
            <Label htmlFor="image" className="font-medium">
              Profile Image URL
            </Label>
            <Input
              id="image"
              type="url"
              placeholder="https://example.com/image.jpg"
              disabled={isLoading}
              aria-invalid={!!errors.image}
              aria-describedby={errors.image ? 'image-error' : undefined}
              {...register('image')}
            />
            {errors.image && (
              <p id="image-error" className="flex items-center gap-1.5 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {errors.image.message}
              </p>
            )}
            <p className="text-xs text-gray-500">
              Enter a URL to an image for your profile picture
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 border-t border-gray-200 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !isDirty}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

EditProfileForm.displayName = 'EditProfileForm'
