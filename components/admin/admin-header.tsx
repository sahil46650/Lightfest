'use client'

import { Session } from 'next-auth'
import { Bell, ChevronDown, LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useState } from 'react'
import Link from 'next/link'

interface AdminHeaderProps {
  user: Session['user']
  title?: string
  pendingEmailsCount?: number
}

export function AdminHeader({
  user,
  title = 'Dashboard',
  pendingEmailsCount = 0,
}: AdminHeaderProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-30">
      <div className="flex items-center justify-between h-16 px-6">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>

        <div className="flex items-center gap-6">
          {/* Notifications */}
          <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell size={20} />
            {pendingEmailsCount > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {pendingEmailsCount > 99 ? '99+' : pendingEmailsCount}
              </span>
            )}
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <ChevronDown
                size={16}
                className={`transition-transform ${
                  isUserMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                <Link
                  href="/admin/settings/preferences"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  Settings
                </Link>
                <button
                  onClick={async () => {
                    setIsUserMenuOpen(false)
                    await signOut({ redirect: true, callbackUrl: '/' })
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
