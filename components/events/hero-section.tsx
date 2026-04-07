'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Play, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HeroSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'landing'
  backgroundImage?: string
  headline?: string
  subheadline?: string
  ctaText?: string
  ctaHref?: string
  onCtaClick?: () => void
  showScrollIndicator?: boolean
}

const HeroSection = React.forwardRef<HTMLDivElement, HeroSectionProps>(
  (
    {
      className,
      variant = 'default',
      backgroundImage,
      headline = 'IGNITE THE NIGHT',
      subheadline = "The world's most shareable lantern experience. Join thousands of others in a moment of pure magic.",
      ctaText = 'Find Your City',
      ctaHref = '/events',
      onCtaClick,
      showScrollIndicator = true,
      ...props
    },
    ref
  ) => {
    const isLanding = variant === 'landing'

    // For default variant, render simple hero
    if (!isLanding) {
      return (
        <div
          ref={ref}
          className={cn('relative w-full overflow-hidden rounded-lg', className)}
          {...props}
        >
          {backgroundImage ? (
            <div className="absolute inset-0">
              <Image
                src={backgroundImage}
                alt="Hero background"
                fill
                className="object-cover"
                priority
              />
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-background-darker via-primary-dark/20 to-background-dark" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
          <div className="relative flex flex-col items-start justify-center gap-6 px-6 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-32">
            <h1 className="max-w-2xl text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              {headline}
            </h1>
            <p className="max-w-xl text-lg text-gray-100 sm:text-xl">{subheadline}</p>
            {ctaHref && (
              <Link
                href={ctaHref}
                className="flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-base font-bold text-white shadow-glow transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                {ctaText}
              </Link>
            )}
          </div>
        </div>
      )
    }

    // Landing variant - matches reference design exactly
    return (
      <div
        ref={ref}
        className={cn(
          'relative flex h-[95vh] min-h-[600px] w-full flex-col p-2 pb-0 md:p-4 md:pb-0',
          className
        )}
        {...props}
      >
        {/* Inner Rounded Container */}
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[2rem] bg-slate-900 md:rounded-[3rem]">
          {/* Background Image */}
          {backgroundImage && (
            <div
              className="absolute inset-0 scale-105 bg-cover bg-center opacity-60"
              style={{ backgroundImage: `url('${backgroundImage}')` }}
            />
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/20 to-slate-900/80" />

          {/* Content */}
          <div className="relative z-10 flex max-w-4xl flex-col items-center px-6 text-center">
            {/* Badge */}
            <div className="mb-4 inline-flex animate-pulse items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-md">
              <span className="size-2 rounded-full bg-primary" />
              World Tour 2026
            </div>

            {/* Headline */}
            <h1 className="mb-6 text-6xl font-black leading-[0.9] tracking-tighter text-white md:text-8xl lg:text-[7rem]">
              IGNITE
              <br />
              THE NIGHT
            </h1>

            {/* Subheadline */}
            <p className="mb-10 max-w-lg text-lg font-medium leading-relaxed text-white/80 md:text-xl">
              {subheadline}
            </p>

            {/* CTA Buttons */}
            <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
              <Link
                href={ctaHref}
                className="group flex h-14 items-center justify-center gap-2 rounded-full bg-primary px-8 text-base font-bold text-white shadow-glow transition-all duration-300 hover:bg-white hover:text-primary"
              >
                {ctaText}
                <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <button className="flex h-14 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-8 text-base font-bold text-white backdrop-blur-md transition-all duration-300 hover:bg-white/20">
                <Play className="size-5" />
                Watch Film
              </button>
            </div>
          </div>

          {/* Scroll Indicator */}
          {showScrollIndicator && (
            <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 animate-bounce flex-col items-center gap-2 text-white/50">
              <span className="text-xs font-bold uppercase tracking-widest">Scroll</span>
              <ChevronDown className="size-5" />
            </div>
          )}
        </div>
      </div>
    )
  }
)

HeroSection.displayName = 'HeroSection'

export { HeroSection }
