'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface MarqueeStripProps extends React.HTMLAttributes<HTMLDivElement> {
  words?: string[]
}

const MarqueeStrip = React.forwardRef<HTMLDivElement, MarqueeStripProps>(
  (
    {
      className,
      words = ['DREAM', 'IGNITE', 'CONNECT'],
      ...props
    },
    ref
  ) => {
    // Build repeated content for seamless animation
    const repeatedContent = Array(8).fill(null).map((_, i) => (
      <React.Fragment key={i}>
        {words.map((word, wordIndex) => (
          <React.Fragment key={`${i}-${wordIndex}`}>
            {word}
            <span className="text-white/40">•</span>
          </React.Fragment>
        ))}
      </React.Fragment>
    ))

    return (
      <div
        ref={ref}
        className={cn(
          'relative z-20 -mt-8 flex w-full origin-left rotate-1 scale-105 overflow-hidden bg-primary py-4 shadow-xl',
          className
        )}
        {...props}
      >
        <div className="flex animate-marquee whitespace-nowrap gap-12 px-4">
          <h2 className="flex items-center gap-12 text-xl font-black uppercase tracking-widest text-white md:text-2xl">
            {repeatedContent}
          </h2>
        </div>
      </div>
    )
  }
)

MarqueeStrip.displayName = 'MarqueeStrip'

export { MarqueeStrip }
