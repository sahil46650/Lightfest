'use client'

import * as React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { AlertCircle, Eye, EyeOff, ArrowLeft, ArrowRight } from 'lucide-react'

// Import schema from checkout feature module
import { personalInfoSchema, type PersonalInfo } from '@/features/checkout/schemas'

type PersonalInfoFormData = PersonalInfo

interface PersonalInfoStepProps {
  onSubmit: (data: PersonalInfoFormData) => void
  onBack: () => void
  isLoading?: boolean
  initialData?: Partial<PersonalInfoFormData>
}

const countryOptions = [
  { code: '+1', label: '+1 (US/Canada)' },
  { code: '+44', label: '+44 (UK)' },
  { code: '+61', label: '+61 (Australia)' },
  { code: '+33', label: '+33 (France)' },
  { code: '+49', label: '+49 (Germany)' },
  { code: '+39', label: '+39 (Italy)' },
]

export const PersonalInfoStep = React.forwardRef<HTMLDivElement, PersonalInfoStepProps>(
  (
    {
      onSubmit,
      onBack,
      isLoading = false,
      initialData,
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const {
      register,
      handleSubmit,
      watch,
      formState: { errors },
      control,
    } = useForm<PersonalInfoFormData>({
      resolver: zodResolver(personalInfoSchema),
      defaultValues: {
        email: initialData?.email || '',
        firstName: initialData?.firstName || '',
        lastName: initialData?.lastName || '',
        phone: initialData?.phone || '',
        countryCode: initialData?.countryCode || '+1',
        createAccount: initialData?.createAccount || false,
        password: initialData?.password || '',
      },
    })

    const createAccount = watch('createAccount')

    return (
      <div ref={ref} className="w-full">
        {/* Card with subtle gradient border */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-float overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 md:px-8 md:py-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Your Details</h2>
            <p className="text-sm text-gray-500 mt-1">
              Contact information for your booking
            </p>
          </div>

          {/* Form Content */}
          <div className="p-6 md:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address <span className="text-primary">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  disabled={isLoading}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  className={cn(
                    'h-12 rounded-xl border-gray-200 bg-gray-50 focus:bg-white transition-colors',
                    errors.email && 'border-red-300 bg-red-50'
                  )}
                  {...register('email')}
                />
                {errors.email && (
                  <p id="email-error" className="flex items-center gap-1.5 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                    First Name <span className="text-primary">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    disabled={isLoading}
                    aria-invalid={!!errors.firstName}
                    aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                    className={cn(
                      'h-12 rounded-xl border-gray-200 bg-gray-50 focus:bg-white transition-colors',
                      errors.firstName && 'border-red-300 bg-red-50'
                    )}
                    {...register('firstName')}
                  />
                  {errors.firstName && (
                    <p id="firstName-error" className="flex items-center gap-1.5 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      {errors.firstName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                    Last Name <span className="text-primary">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    disabled={isLoading}
                    aria-invalid={!!errors.lastName}
                    aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                    className={cn(
                      'h-12 rounded-xl border-gray-200 bg-gray-50 focus:bg-white transition-colors',
                      errors.lastName && 'border-red-300 bg-red-50'
                    )}
                    {...register('lastName')}
                  />
                  {errors.lastName && (
                    <p id="lastName-error" className="flex items-center gap-1.5 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Phone Field with Country Code */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                  Phone Number <span className="text-primary">*</span>
                </Label>
                <div className="flex gap-3">
                  <Controller
                    name="countryCode"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        disabled={isLoading}
                        className="flex h-12 w-36 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm ring-offset-background focus:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                      >
                        {countryOptions.map((option) => (
                          <option key={option.code} value={option.code}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  <Input
                    id="phone"
                    placeholder="5551234567"
                    disabled={isLoading}
                    aria-invalid={!!errors.phone}
                    aria-describedby={errors.phone ? 'phone-error' : undefined}
                    className={cn(
                      'h-12 flex-1 rounded-xl border-gray-200 bg-gray-50 focus:bg-white transition-colors',
                      errors.phone && 'border-red-300 bg-red-50'
                    )}
                    {...register('phone')}
                  />
                </div>
                {errors.phone && (
                  <p id="phone-error" className="flex items-center gap-1.5 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {errors.phone.message}
                  </p>
                )}
              </div>


              {/* Create Account Checkbox */}
              <div className={cn(
                "flex items-start gap-4 rounded-xl border-2 p-4 transition-all duration-300",
                createAccount
                  ? "border-primary/30 bg-primary/5"
                  : "border-gray-100 bg-gray-50 hover:border-gray-200"
              )}>
                <Controller
                  name="createAccount"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="createAccount"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                      className="mt-0.5"
                    />
                  )}
                />
                <div className="flex-1">
                  <Label htmlFor="createAccount" className="cursor-pointer font-semibold text-gray-900">
                    Create an account
                  </Label>
                  <p className="text-sm text-gray-500 mt-1">
                    Save your details for faster checkout next time and track your bookings
                  </p>
                </div>
              </div>

              {/* Password Field (Conditional) */}
              {createAccount && (
                <div className="space-y-2 animate-fade-in">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password <span className="text-primary">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="At least 8 characters"
                      disabled={isLoading}
                      aria-invalid={!!errors.password}
                      aria-describedby={errors.password ? 'password-error' : undefined}
                      className={cn(
                        'h-12 rounded-xl border-gray-200 bg-gray-50 focus:bg-white pr-12 transition-colors',
                        errors.password && 'border-red-300 bg-red-50'
                      )}
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p id="password-error" className="flex items-center gap-1.5 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      {errors.password.message}
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  disabled={isLoading}
                  className="flex-1 h-12 rounded-xl font-semibold"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 h-12 rounded-xl font-semibold shadow-glow-sm hover:shadow-glow"
                >
                  {isLoading ? 'Processing...' : 'Continue'}
                  {!isLoading && <ArrowRight className="h-4 w-4 ml-2" />}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }
)

PersonalInfoStep.displayName = 'PersonalInfoStep'
