'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { checkPasswordStrength, type PasswordStrength } from '@/lib/validations/auth'
import { Check, X } from 'lucide-react'

interface PasswordStrengthIndicatorProps {
  password: string
  className?: string
  showChecklist?: boolean
}

const strengthColors: Record<PasswordStrength['label'], string> = {
  'Weak': 'bg-red-500',
  'Fair': 'bg-orange-500',
  'Good': 'bg-yellow-500',
  'Strong': 'bg-green-500',
  'Very Strong': 'bg-emerald-500',
}

const strengthTextColors: Record<PasswordStrength['label'], string> = {
  'Weak': 'text-red-600',
  'Fair': 'text-orange-600',
  'Good': 'text-yellow-600',
  'Strong': 'text-green-600',
  'Very Strong': 'text-emerald-600',
}

export function PasswordStrengthIndicator({
  password,
  className,
  showChecklist = true,
}: PasswordStrengthIndicatorProps) {
  const strength = React.useMemo(() => checkPasswordStrength(password), [password])

  if (!password) {
    return null
  }

  const requirements = [
    { key: 'length', label: 'At least 8 characters', met: strength.checks.length },
    { key: 'uppercase', label: 'One uppercase letter', met: strength.checks.uppercase },
    { key: 'lowercase', label: 'One lowercase letter', met: strength.checks.lowercase },
    { key: 'number', label: 'One number', met: strength.checks.number },
    { key: 'special', label: 'One special character (!@#$%^&*)', met: strength.checks.special },
  ]

  return (
    <div className={cn('space-y-3', className)}>
      {/* Strength bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Password strength</span>
          <span className={cn('text-xs font-medium', strengthTextColors[strength.label])}>
            {strength.label}
          </span>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((segment) => (
            <div
              key={segment}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors',
                segment <= strength.score
                  ? strengthColors[strength.label]
                  : 'bg-gray-200'
              )}
            />
          ))}
        </div>
      </div>

      {/* Requirements checklist */}
      {showChecklist && (
        <ul className="space-y-1">
          {requirements.map((req) => (
            <li
              key={req.key}
              className={cn(
                'flex items-center gap-2 text-xs transition-colors',
                req.met ? 'text-green-600' : 'text-gray-400'
              )}
            >
              {req.met ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <X className="h-3.5 w-3.5" />
              )}
              {req.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

PasswordStrengthIndicator.displayName = 'PasswordStrengthIndicator'
