'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface FooterProps extends React.HTMLAttributes<HTMLElement> {}

const Footer = React.forwardRef<HTMLElement, FooterProps>(
  ({ className, ...props }, ref) => {
    const exploreLinks = [
      { href: '/events', label: 'Experience' },
      { href: '/events', label: 'Locations' },
      { href: '#', label: 'Merch' },
      { href: '/faq', label: 'FAQ' },
    ]

    const connectLinks = [
      { href: '#', label: 'Instagram' },
      { href: '#', label: 'TikTok' },
      { href: '#', label: 'Twitter' },
      { href: '/contact', label: 'Contact' },
    ]

    const legalLinks = [
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
    ]

    return (
      <footer
        ref={ref}
        className={cn(
          'border-t border-slate-200 bg-white pb-10 pt-20',
          className
        )}
        {...props}
      >
        <div className="mx-auto max-w-[1400px] px-6 md:px-12">
          {/* Main Content */}
          <div className="mb-16 flex flex-col justify-between gap-12 md:flex-row">
            {/* Brand */}
            <div className="max-w-xs">
              <Link
                href="/"
                className="mb-6 flex items-center gap-2 text-slate-900"
              >
                <div className="flex size-8 items-center justify-center rounded-full bg-slate-900 text-white">
                  <svg
                    className="size-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                </div>
                <span className="text-lg font-bold tracking-tight">
                  The Lights Festival
                </span>
              </Link>
              <p className="text-sm text-slate-500">
                Creating magical moments that connect people and light up the
                world, one city at a time.
              </p>
            </div>

            {/* Link Columns */}
            <div className="flex flex-wrap gap-16">
              {/* Explore */}
              <div>
                <h4 className="mb-4 font-bold text-slate-900">Explore</h4>
                <ul className="space-y-3 text-sm text-slate-500">
                  {exploreLinks.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="transition hover:text-primary"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Connect */}
              <div>
                <h4 className="mb-4 font-bold text-slate-900">Connect</h4>
                <ul className="space-y-3 text-sm text-slate-500">
                  {connectLinks.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="transition hover:text-primary"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h4 className="mb-4 font-bold text-slate-900">Legal</h4>
                <ul className="space-y-3 text-sm text-slate-500">
                  {legalLinks.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="transition hover:text-primary"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="flex flex-col items-center justify-between border-t border-slate-200 pt-8 text-xs text-slate-400 md:flex-row">
            <p>© {new Date().getFullYear()} The Lights Festival. All rights reserved.</p>
            <p className="mt-2 md:mt-0">Designed for dreamers.</p>
          </div>
        </div>
      </footer>
    )
  }
)

Footer.displayName = 'Footer'

export { Footer }
