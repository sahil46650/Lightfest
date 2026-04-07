'use client'

import * as React from 'react'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GalleryItem {
  id: string
  type: 'image' | 'quote'
  url?: string
  alt?: string
  quote?: string
  author?: string
}

interface GallerySectionProps extends React.HTMLAttributes<HTMLElement> {
  heading?: string
  items?: GalleryItem[]
  socialHandle?: string
  hashtag?: string
}

const defaultItems: GalleryItem[] = [
  {
    id: '1',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
    alt: 'People watching lanterns in the sky',
  },
  {
    id: '2',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80',
    alt: 'Festival crowd at night',
  },
  {
    id: '3',
    type: 'quote',
    quote: '"The most beautiful thing I\'ve ever seen. Period."',
    author: '@sarah_j',
  },
  {
    id: '4',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80',
    alt: 'Silhouette of person in front of light',
  },
  {
    id: '5',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80',
    alt: 'Mountain landscape at night with stars',
  },
]

const GallerySection = React.forwardRef<HTMLElement, GallerySectionProps>(
  (
    {
      className,
      heading = 'CAPTURED MOMENTS',
      items = defaultItems,
      socialHandle = '@LightsFest',
      hashtag = '#IgniteTheNight',
      ...props
    },
    ref
  ) => {
    return (
      <section
        ref={ref}
        className={cn('bg-white py-24', className)}
        {...props}
      >
        <div className="mx-auto max-w-[1400px] px-6 md:px-12">
          {/* Header */}
          <div className="mb-12 flex flex-col items-end justify-between gap-6 md:flex-row">
          <div>
            <h2 className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
              {heading}
            </h2>
          </div>
          <div className="flex gap-2 text-sm font-bold">
            <Link
              href="#"
              className="rounded-full bg-slate-100 px-4 py-2 text-slate-900 transition hover:bg-slate-200"
            >
              {socialHandle}
            </Link>
            <Link
              href="#"
              className="rounded-full bg-slate-100 px-4 py-2 text-slate-900 transition hover:bg-slate-200"
            >
              {hashtag}
            </Link>
          </div>
        </div>

        {/* Masonry Grid */}
        <div className="columns-1 gap-6 space-y-6 md:columns-2 lg:columns-3">
          {items.map((item) => {
            if (item.type === 'quote') {
              return (
                <div
                  key={item.id}
                  className="break-inside-avoid overflow-hidden rounded-2xl"
                >
                  <div className="flex h-full flex-col justify-center bg-purple-50 p-8 text-center">
                    <p className="mb-4 text-xl font-bold text-primary">
                      {item.quote}
                    </p>
                    <p className="text-sm font-bold text-slate-500">
                      - {item.author}
                    </p>
                  </div>
                </div>
              )
            }

            return (
              <div
                key={item.id}
                className="group relative break-inside-avoid overflow-hidden rounded-2xl"
              >
                <img
                  src={item.url}
                  alt={item.alt || ''}
                  className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* Hover Overlay with Heart */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <Heart className="size-8 text-white" fill="currentColor" />
                </div>
              </div>
            )
          })}
          </div>
        </div>
      </section>
    )
  }
)

GallerySection.displayName = 'GallerySection'

export { GallerySection }
