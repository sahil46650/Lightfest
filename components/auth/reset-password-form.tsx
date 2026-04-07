'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/validations/auth'
import { PasswordStrengthIndicator } from './password-strength-indicator'

interface ResetPasswordFormProps {
  token: string
  className?: string
}

export function ResetPasswordForm({ token, className }: ResetPasswordFormProps) {
  const router = useRouter()
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token,
      password: '',
      confirmPassword: '',
    },
  })

  const password = watch('password')

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: data.token,
          password: data.password,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.message || 'Failed to reset password. Please try again.')
        return
      }

      // Show success message
      setSuccess(true)

      // Auto-login with the new password
      if (result.data?.email) {
        const signInResult = await signIn('credentials', {
          email: result.data.email,
          password: data.password,
          redirect: false,
        })

        if (signInResult?.ok) {
          // Redirect to account after short delay
          setTimeout(() => {
            router.push('/account')
            router.refresh()
          }, 2000)
        } else {
          // Redirect to login if auto-login fails
          setTimeout(() => {
            router.push('/login?reset=true')
          }, 2000)
        }
      } else {
        // Redirect to login
        setTimeout(() => {
          router.push('/login?reset=true')
        }, 2000)
      }
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
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Password Reset Successful!</h2>
            <p className="text-gray-600">
              Your password has been reset successfully. You are being signed in automatically...
            </p>
            <div className="flex items-center justify-center pt-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('w-full max-w-md', className)}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Reset your password</CardTitle>
        <CardDescription>
          Enter your new password below. Make sure it&apos;s strong and secure.
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

          {/* Hidden token field */}
          <input type="hidden" {...register('token')} />

          {/* New Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password" className="font-medium">
              New Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                autoComplete="new-password"
                disabled={isLoading}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p id="password-error" className="flex items-center gap-1.5 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {errors.password.message}
              </p>
            )}
            <PasswordStrengthIndicator password={password} />
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="font-medium">
              Confirm New Password
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your new password"
                autoComplete="new-password"
                disabled={isLoading}
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                {...register('confirmPassword')}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p id="confirmPassword-error" className="flex items-center gap-1.5 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {errors.confirmPassword.message}
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
                Resetting password...
              </>
            ) : (
              'Reset Password'
            )}
          </Button>

          {/* Back to Login Link */}
          <p className="text-center text-sm text-gray-600">
            Remember your password?{' '}
            <Link
              href="/login"
              className="font-medium text-primary hover:text-primary-dark hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}

ResetPasswordForm.displayName = 'ResetPasswordForm'
