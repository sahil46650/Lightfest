'use client'

import * as React from 'react'
import { Music, Sparkles, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

interface IntroSectionProps extends React.HTMLAttributes<HTMLElement> {}

const IntroSection = React.forwardRef<HTMLElement, IntroSectionProps>(
  ({ className, ...props }, ref) => {
    const features = [
      {
        icon: Music,
        title: 'Live Music',
        description: 'Performances from top indie artists that set the perfect mood.',
      },
      {
        icon: Sparkles,
        title: 'Pure Magic',
        description: 'A sky full of dreams taking flight in unison.',
      },
    ]

    const images = [
      {
        url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80',
        alt: 'Woman smiling with lantern light on her face',
      },
      {
        url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
        alt: 'Lanterns floating into the night sky',
      },
      {
        url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80',
        alt: 'Group of friends sitting on grass at festival',
        hasPlayButton: true,
      },
    ]

    return (
      <section
        ref={ref}
        className={cn('bg-white py-24', className)}
        {...props}
      >
        <div className="mx-auto max-w-[1400px] px-6 md:px-12">
          <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Left Column - Text Content */}
          <div className="flex flex-col gap-8">
            <h2 className="text-5xl font-black leading-tight tracking-tight text-slate-900 md:text-7xl">
              MORE THAN
              <br />
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                JUST A FESTIVAL
              </span>
            </h2>

            <p className="max-w-md text-lg leading-relaxed text-slate-600 md:text-xl">
              It's music, memories, and magic wrapped into one unforgettable
              night. We bring people together to cast their worries into the
              sky.
            </p>

            {/* Feature List */}
            <div className="mt-4 flex flex-col gap-6">
              {features.map((feature) => (
                <div key={feature.title} className="flex items-start gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-purple-100 text-primary">
                    <feature.icon className="size-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      {feature.title}
                    </h3>
                    <p className="mt-1 text-slate-500">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Masonry Grid */}
          <div className="grid h-[600px] grid-cols-2 gap-4">
            {/* Left tall image with offset */}
            <div className="col-span-1 h-full pt-12">
              <div className="group relative h-full w-full overflow-hidden rounded-[2rem] bg-gray-200">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                  style={{ backgroundImage: `url('${images[0].url}')` }}
                />
              </div>
            </div>

            {/* Right column - two stacked images */}
            <div className="col-span-1 flex h-full flex-col gap-4">
              <div className="group relative h-1/2 w-full overflow-hidden rounded-[2rem] bg-gray-200">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                  style={{ backgroundImage: `url('${images[1].url}')` }}
                />
              </div>

              <div className="group relative h-1/2 w-full overflow-hidden rounded-[2rem] bg-gray-200">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                  style={{ backgroundImage: `url('${images[2].url}')` }}
                />
                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <button className="flex size-16 cursor-pointer items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-primary">
                    <Play className="size-8" fill="currentColor" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </section>
    )
  }
)

IntroSection.displayName = 'IntroSection'

export { IntroSection }
