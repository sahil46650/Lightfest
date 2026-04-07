'use client'

import * as React from 'react'
import Link from 'next/link'
import { Menu, X, Sun, User, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'default' | 'landing'
}

const Header = React.forwardRef<HTMLElement, HeaderProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

    const isLanding = variant === 'landing'

    const navLinks = [
      { href: '/events', label: 'Experience' },
      { href: '/events', label: 'Locations' },
      { href: '/about', label: 'About' },
      { href: '/faq', label: 'FAQ' },
    ]

    return (
      <>
        {/* Floating Navigation - Centered Pill Design */}
        <div
          ref={ref as React.Ref<HTMLDivElement>}
          className={cn(
            'fixed top-6 left-0 w-full z-50 flex justify-center px-4 pointer-events-none',
            className
          )}
          {...props}
        >
          <nav className="pointer-events-auto flex items-center justify-between gap-4 md:gap-8 bg-white/80 backdrop-blur-xl border border-white/40 shadow-float rounded-full py-3 px-5 md:px-8 max-w-4xl w-full transition-all duration-300 hover:bg-white">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 text-slate-900 group">
              <div className="size-8 bg-slate-900 rounded-full flex items-center justify-center text-white group-hover:bg-primary transition-colors duration-300">
                <Sun className="size-5" />
              </div>
              <span className="font-bold text-lg tracking-tight hidden sm:block">
                TLF
              </span>
            </Link>

            {/* Desktop Links - Centered */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="hidden sm:flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-900 hover:bg-slate-200 transition-colors"
              >
                <User className="size-5" />
              </Link>
              <Link
                href="/events"
                className="flex h-10 px-5 items-center justify-center rounded-full bg-primary text-white text-sm font-bold shadow-glow hover:scale-105 hover:shadow-lg active:scale-95 transition-all duration-300"
              >
                Get Tickets
              </Link>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-900 hover:bg-slate-200 transition-colors"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="size-5" />
              </button>
            </div>
          </nav>
        </div>

        {/* Mobile Slide-out Drawer */}
        {/* Backdrop */}
        <div
          className={cn(
            'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden',
            mobileMenuOpen
              ? 'opacity-100'
              : 'pointer-events-none opacity-0'
          )}
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Drawer */}
        <div
          className={cn(
            'fixed right-0 top-0 z-50 h-full w-80 bg-white p-6 shadow-2xl transition-transform duration-300 ease-out md:hidden',
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          )}
        >
          {/* Close Button */}
          <div className="mb-8 flex justify-end">
            <button
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
              className="rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-2">
            {navLinks.map((link, index) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-4 py-3 text-lg font-medium text-slate-600 transition-all hover:bg-slate-100 hover:text-primary"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Divider */}
          <div className="my-6 h-px bg-slate-200" />

          {/* Auth Links */}
          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-4 py-3 text-center text-lg font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-primary"
            >
              Sign In
            </Link>
            <Link
              href="/events"
              onClick={() => setMobileMenuOpen(false)}
              className="flex h-14 items-center justify-center rounded-full bg-primary text-white text-base font-bold shadow-glow hover:scale-105 transition-all duration-300"
            >
              Get Tickets
              <ArrowRight className="ml-2 size-5" />
            </Link>
          </div>
        </div>
      </>
    )
  }
)

Header.displayName = 'Header'

export { Header }
