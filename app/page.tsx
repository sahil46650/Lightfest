import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { HeroSection } from '@/components/events/hero-section'
import { MarqueeStrip } from '@/components/landing/marquee-strip'
import { IntroSection } from '@/components/landing/intro-section'
import { GallerySection } from '@/components/landing/gallery-section'
import { CtaSection } from '@/components/landing/cta-section'
import { FeaturedEventsSection } from '@/features/events'
import Script from 'next/script'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background-darker">
      {/* Floating Navigation */}
      <Header variant="landing" />

      {/* Hero Section - Full viewport with animated reveals */}
      <HeroSection
        variant="landing"
        backgroundImage="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1920&q=80"
        headline="Light Up Your Night"
        subheadline="Experience the magic of thousands of lanterns lighting up the sky"
        ctaText="Get Tickets"
        ctaHref="/events"
      />

      {/* Infinite Marquee Strip */}
      <MarqueeStrip />

      {/* Introduction Section */}
      <IntroSection />

      {/* Featured Events Slider - Fetches from TSCheckout API */}
      <section id="events">
        <FeaturedEventsSection
          heading="Upcoming Events"
          subheading="Find a Festival Lights experience near you"
          limit={6}
        />
      </section>

      {/* Photo Gallery */}
      <GallerySection />

      {/* Call-to-Action Section */}
      <CtaSection />

      {/* Footer */}
      <Footer />
      {/* <script
  src="https://cdn.apigateway.co/webchat-client..prod/sdk.js"
  data-widget-id="883d6c15-01ad-11f1-88d6-86d3d15d780f"
  defer
></script> */}
      <Script
        src='https://cdn.apigateway.co/webchat-client..prod/sdk.js'
        data-widget-id="883d6c15-01ad-11f1-88d6-86d3d15d780f"
        defer
      />
    </div>
  )
}
