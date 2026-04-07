'use client'

import * as React from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserCog, Lock, LogOut, Ticket, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuickActionsProps {
  className?: string
}

const actions = [
  {
    href: '/account/edit',
    icon: UserCog,
    label: 'Edit Profile',
    description: 'Update your name, email, and phone',
  },
  {
    href: '/account/settings/password',
    icon: Lock,
    label: 'Change Password',
    description: 'Update your password',
  },
  {
    href: '/account/bookings',
    icon: Ticket,
    label: 'My Bookings',
    description: 'View all your event bookings',
  },
]

export function QuickActions({ className }: QuickActionsProps) {
  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <action.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{action.label}</p>
                <p className="text-sm text-gray-500">{action.description}</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </Link>
        ))}

        {/* Sign out button */}
        <Button
          variant="outline"
          onClick={handleSignOut}
          className="mt-4 w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </CardContent>
    </Card>
  )
}

QuickActions.displayName = 'QuickActions'
