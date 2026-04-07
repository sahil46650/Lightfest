'use client'

import * as React from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  User,
  Settings,
  Ticket,
  LogOut,
  ChevronDown,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface UserMenuProps {
  className?: string
  mobile?: boolean
}

export function UserMenu({ className, mobile = false }: UserMenuProps) {
  const { data: session, status } = useSession()
  const [isOpen, setIsOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close menu on escape key
  React.useEffect(() => {
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscapeKey)
    return () => document.removeEventListener('keydown', handleEscapeKey)
  }, [])

  if (status === 'loading') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!session?.user) {
    // Not authenticated - show sign in / register buttons
    if (mobile) {
      return (
        <div className={cn('flex gap-3', className)}>
          <Link href="/login" className="flex-1">
            <Button variant="ghost" size="sm" className="w-full">
              Sign In
            </Button>
          </Link>
          <Link href="/register" className="flex-1">
            <Button variant="default" size="sm" className="w-full">
              Register
            </Button>
          </Link>
        </div>
      )
    }

    return (
      <div className={cn('flex items-center gap-3', className)}>
        <Link href="/login">
          <Button variant="ghost" size="sm">
            Sign In
          </Button>
        </Link>
        <Link href="/register">
          <Button variant="default" size="sm">
            Register
          </Button>
        </Link>
      </div>
    )
  }

  // Authenticated - show user menu
  const user = session.user
  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.email?.[0].toUpperCase() || 'U'

  if (mobile) {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name || 'User'}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-medium text-white">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-gray-900">{user.name || 'User'}</p>
            <p className="truncate text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
        <Link
          href="/account"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
        >
          <User className="h-4 w-4" />
          My Account
        </Link>
        <Link
          href="/account/bookings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
        >
          <Ticket className="h-4 w-4" />
          My Bookings
        </Link>
        <Link
          href="/account/settings/password"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    )
  }

  return (
    <div ref={menuRef} className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-gray-100"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || 'User'}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-white">
            {initials}
          </div>
        )}
        <ChevronDown
          className={cn(
            'h-4 w-4 text-gray-500 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 origin-top-right animate-in fade-in zoom-in-95 rounded-xl border border-gray-200 bg-white shadow-lg">
          {/* User Info */}
          <div className="border-b border-gray-100 p-4">
            <p className="truncate font-medium text-gray-900">{user.name || 'User'}</p>
            <p className="truncate text-sm text-gray-500">{user.email}</p>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            <Link
              href="/account"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
            >
              <User className="h-4 w-4" />
              My Account
            </Link>
            <Link
              href="/account/bookings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
            >
              <Ticket className="h-4 w-4" />
              My Bookings
            </Link>
            <Link
              href="/account/settings/password"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </div>

          {/* Sign Out */}
          <div className="border-t border-gray-100 p-2">
            <button
              onClick={() => {
                setIsOpen(false)
                signOut({ callbackUrl: '/' })
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

UserMenu.displayName = 'UserMenu'
