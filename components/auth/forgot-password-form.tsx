'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, ArrowLeft, Loader2, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validations/auth'

interface ForgotPasswordFormProps {
  className?: string
}

export function ForgotPasswordForm({ className }: ForgotPasswordFormProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)
  const [submittedEmail, setSubmittedEmail] = React.useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.message || 'Failed to send reset link. Please try again.')
        return
      }

      // Always show success (don't reveal if email exists)
      setSubmittedEmail(data.email)
      setSuccess(true)
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <Card className={cn('w-full max-w-md', className)}>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Check your email</h2>
            <p className="text-gray-600">
              If an account exists for <strong>{submittedEmail}</strong>, we&apos;ve sent a password
              reset link. Please check your inbox.
            </p>
            <p className="text-sm text-gray-500">
              The link will expire in 24 hours.
            </p>
            <div className="pt-4">
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to login
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('w-full max-w-md', className)}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Forgot your password?</CardTitle>
        <CardDescription>
          Enter your email address and we&apos;ll send you a link to reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="font-medium">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              disabled={isLoading}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              {...register('email')}
            />
            {errors.email && (
              <p id="email-error" className="flex items-center gap-1.5 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending reset link...
              </>
            ) : (
              'Send Reset Link'
            )}
          </Button>

          {/* Back to Login Link */}
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
        </form>
      </CardContent>
    </Card>
  )
}

ForgotPasswordForm.displayName = 'ForgotPasswordForm'
