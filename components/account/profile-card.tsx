'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Mail, Phone, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProfileCardProps {
  user: {
    id: string
    name?: string | null
    email?: string | null
    phone?: string | null
    image?: string | null
    createdAt?: Date | string
  }
  className?: string
}

export function ProfileCard({ user, className }: ProfileCardProps) {
  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.email?.charAt(0).toUpperCase() || '?'

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : null

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header with gradient */}
      <div className="h-24 bg-gradient-to-r from-primary/80 to-primary" />

      <CardContent className="relative pt-0">
        {/* Avatar */}
        <div className="absolute -top-12 left-6">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name || 'Profile'}
              className="h-24 w-24 rounded-full border-4 border-white object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-gray-100 text-2xl font-semibold text-gray-600">
              {initials}
            </div>
          )}
        </div>

        {/* User info */}
        <div className="pt-16 space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {user.name || 'User'}
            </h2>
            {memberSince && (
              <p className="text-sm text-gray-500">
                Member since {memberSince}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Mail className="h-4 w-4 text-gray-400" />
              {user.email}
            </div>
            {user.phone && (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Phone className="h-4 w-4 text-gray-400" />
                {user.phone}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

ProfileCard.displayName = 'ProfileCard'
