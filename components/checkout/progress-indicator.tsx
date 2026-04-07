'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

export enum CheckoutStep {
  TICKET_SELECTION = 0,
  PERSONAL_INFO = 1,
  ATTENDEE_INFO = 2,
  PAYMENT = 3,
}

interface ProgressIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  currentStep: CheckoutStep
  stepLabels?: string[]
}

const defaultStepLabels = [
  'Tickets',
  'Your Details',
  'Attendees',
  'Payment',
]

const ProgressIndicator = React.forwardRef<
  HTMLDivElement,
  ProgressIndicatorProps
>(
  (
    {
      className,
      currentStep,
      stepLabels = defaultStepLabels,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn('w-full', className)}
        {...props}
      >
        {/* Desktop: Horizontal with connected line */}
        <div className="hidden md:block">
          <div className="relative">
            {/* Background track */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200" />

            {/* Progress fill */}
            <div
              className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-primary via-primary to-primary-light transition-all duration-500 ease-out"
              style={{
                width: `${(currentStep / (stepLabels.length - 1)) * 100}%`
              }}
            />

            {/* Steps */}
            <div className="relative flex justify-between">
              {stepLabels.map((label, index) => {
                const isCompleted = index < currentStep
                const isCurrent = index === currentStep
                const isPast = index <= currentStep

                return (
                  <div
                    key={index}
                    className="flex flex-col items-center"
                    style={{
                      animationDelay: `${index * 100}ms`
                    }}
                  >
                    {/* Step Circle */}
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold text-sm transition-all duration-300',
                        isCompleted
                          ? 'border-primary bg-primary text-white'
                          : isCurrent
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-gray-300 bg-white text-gray-400'
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        index + 1
                      )}
                    </div>

                    {/* Label */}
                    <p
                      className={cn(
                        'mt-3 text-xs font-semibold uppercase tracking-wide transition-all duration-300',
                        isCurrent
                          ? 'text-primary'
                          : isPast
                            ? 'text-gray-700'
                            : 'text-gray-400'
                      )}
                    >
                      {label}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Mobile: Compact horizontal pills */}
        <div className="md:hidden">
          <div className="flex items-center justify-center gap-2 rounded-full bg-gray-100 p-2">
            {stepLabels.map((label, index) => {
              const isCompleted = index < currentStep
              const isCurrent = index === currentStep

              return (
                <div
                  key={index}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-300',
                    isCompleted
                      ? 'bg-primary text-white'
                      : isCurrent
                        ? 'bg-white text-primary shadow-sm ring-2 ring-primary/20'
                        : 'text-gray-400'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-3 w-3" strokeWidth={3} />
                  ) : (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-current/10 text-[10px]">
                      {index + 1}
                    </span>
                  )}
                  <span className={cn(
                    'transition-all duration-300',
                    isCurrent || isCompleted ? 'opacity-100' : 'opacity-0 w-0 hidden'
                  )}>
                    {label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }
)

ProgressIndicator.displayName = 'ProgressIndicator'

export { ProgressIndicator }
