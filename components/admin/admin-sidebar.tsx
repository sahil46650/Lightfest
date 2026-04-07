'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { signOut } from 'next-auth/react'

const navigation = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Events',
    href: '/admin/events',
    icon: Calendar,
    children: [
      { title: 'All Events', href: '/admin/events' },
      { title: 'Create New', href: '/admin/events/new' },
    ],
  },
  {
    title: 'Bookings',
    href: '/admin/bookings',
    icon: BookOpen,
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    children: [
      { title: 'Email Templates', href: '/admin/settings/email' },
      { title: 'Preferences', href: '/admin/settings/preferences' },
    ],
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-6 left-6 z-50 p-2 rounded-lg hover:bg-gray-200"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 w-64 bg-gray-900 text-white flex flex-col transition-transform duration-300 z-40',
          'md:relative md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="px-6 py-8 border-b border-gray-800">
          <h1 className="text-2xl font-bold text-magenta-500">Festival</h1>
          <p className="text-xs text-gray-400">Admin Dashboard</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6">
          <div className="space-y-2">
            {navigation.map((item) => (
              <div key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                    isActive(item.href)
                      ? 'bg-magenta-500 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  )}
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.title}</span>
                </Link>

                {/* Sub-menu */}
                {item.children && isActive(item.href) && (
                  <div className="mt-2 ml-4 space-y-2">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors',
                          pathname === child.href
                            ? 'bg-magenta-600 text-white'
                            : 'text-gray-400 hover:text-gray-300'
                        )}
                      >
                        <div className="w-1 h-1 rounded-full" />
                        {child.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>

        {/* Logout */}
        <div className="border-t border-gray-800 px-4 py-4">
          <button
            onClick={async () => {
              await signOut({ redirect: true, callbackUrl: '/' })
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-red-900/20 hover:text-red-400 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
