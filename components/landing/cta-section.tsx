'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface CtaSectionProps extends React.HTMLAttributes<HTMLElement> {
  heading?: string
  highlightedWord?: string
  description?: string
  disclaimer?: string
}

const CtaSection = React.forwardRef<HTMLElement, CtaSectionProps>(
  (
    {
      className,
      heading = 'READY TO',
      highlightedWord = 'GLOW?',
      description = "Tickets sell out in minutes. Don't miss your chance to be part of the most magical night of the year.",
      disclaimer = 'No spam, just magic. Unsubscribe anytime.',
      ...props
    },
    ref
  ) => {
    return (
      <section
        ref={ref}
        className={cn(
          'relative overflow-hidden bg-slate-900 px-6 py-24',
          className
        )}
        {...props}
      >
        {/* Abstract Background - Radial Gradient */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, #cd2bee 0%, transparent 60%)',
          }}
        />

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          {/* Headline */}
          <h2 className="mb-8 text-4xl font-black tracking-tight text-white md:text-6xl">
            {heading} <span className="text-primary">{highlightedWord}</span>
          </h2>

          {/* Description */}
          <p className="mx-auto mb-10 max-w-2xl text-lg text-white/70 md:text-xl">
            {description}
          </p>

          {/* Email Form */}
          <form className="mx-auto flex max-w-lg flex-col gap-3 rounded-[2rem] border border-white/10 bg-white/5 p-2 backdrop-blur-sm sm:flex-row">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 rounded-full border-0 bg-transparent px-6 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-0"
            />
            <button
              type="submit"
              className="rounded-full bg-white px-8 py-3 font-bold text-slate-900 transition-colors hover:bg-primary hover:text-white"
            >
              Subscribe
            </button>
          </form>

          {/* Disclaimer */}
          <p className="mt-4 text-xs text-white/40">{disclaimer}</p>
        </div>
      </section>
    )
  }
)

CtaSection.displayName = 'CtaSection'

export { CtaSection }
