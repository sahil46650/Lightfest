# Landing Page Redesign - The Lights Festival Style

**Date:** January 9, 2026
**Status:** Design Finalized - Ready for Implementation
**Reference:** `references/code.html` and `references/screen.png`

---

## Overview

Transform the current component showcase landing page into an immersive "The Lights Festival" style experience while maintaining full integration with the existing Next.js booking system.

---

## Decisions Made

### 1. Image Strategy
**Decision:** Use the same Google-hosted images from the reference temporarily

- Enables rapid iteration with full visual impact
- Images can be swapped for production assets later
- Reference URLs from `code.html` will be used directly

### 2. Functionality Level
**Decision:** Full redesign with working links

All sections connect to real routes:
- "Get Tickets" button → Opens ticket modal or navigates to `/events`
- Location/event cards → Link to actual event detail pages (`/events/[slug]`)
- Email signup → Integrates with existing newsletter/email system
- Navigation links → Connect to real app routes

### 3. Event Data Strategy
**Decision:** Fallback pattern

- **Primary:** Fetch real published events from database
- **Fallback:** If no events exist, show placeholder cards linking to `/events`
- Ensures landing page always looks complete during development and production

### 4. Marquee Animation
**Decision:** Implement real CSS animation

- Smooth infinite scroll using CSS keyframes
- Performant (no JavaScript required)
- Adds polish to the design

---

## Target Sections

Based on reference analysis:

| Section | Description | Integration |
|---------|-------------|-------------|
| **Floating Navigation** | Glassmorphism pill-shaped nav bar | Existing routes + UserMenu |
| **Hero** | Full viewport, "IGNITE THE NIGHT" style | CTA → `/events` or ticket modal |
| **Marquee Strip** | Animated "DREAM • IGNITE • CONNECT" | CSS keyframes animation |
| **"More Than Just a Festival"** | Two-column with image masonry | Decorative, links to experience |
| **"Find Your Light"** | Horizontal scrolling event cards | Real events with fallback |
| **"Ready to Glow?" CTA** | Dark purple section, email form | Newsletter integration |
| **"Captured Moments"** | Photo gallery/masonry | Social proof, decorative |
| **Footer** | Redesigned footer | Existing links preserved |

---

## Current State Analysis

### Files to Modify
- `app/page.tsx` - Complete rewrite from showcase to landing
- `components/layout/header.tsx` - Transform to floating glassmorphism style
- `components/layout/footer.tsx` - Redesign to match reference
- `components/events/hero-section.tsx` - Full viewport hero with new design
- `tailwind.config.ts` - Add animation keyframes, extended border-radius

### New Components Needed
- `components/landing/marquee-strip.tsx`
- `components/landing/intro-section.tsx` ("More Than Just a Festival")
- `components/landing/event-slider.tsx` (horizontal scroll cards)
- `components/landing/cta-section.tsx` ("Ready to Glow?")
- `components/landing/gallery-section.tsx` ("Captured Moments")

---

## Design Tokens from Reference

```typescript
// Colors (already in tailwind.config.ts)
primary: "#cd2bee"
primary-dark: "#a61cbd"
background-light: "#f8f6f8"
background-dark: "#1f1022"

// Additional tokens needed
boxShadow: {
  'glow': '0 0 20px rgba(205, 43, 238, 0.3)',
  'float': '0 10px 30px -10px rgba(0,0,0,0.1)',
}

borderRadius: {
  'DEFAULT': '1rem',
  'lg': '1.5rem',
  'xl': '2.5rem',
  '2xl': '3.5rem',
  '3xl': '5rem',
}

// Marquee animation
@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
```

---

## Reference Image URLs

From `references/code.html`:

```
Hero Background:
https://lh3.googleusercontent.com/aida-public/AB6AXuDBBkwj1rOCtOESZ4ufGq-2MD8E57ClTQu_HXP9-L-sOZkIwj-uuCXq1HyzfgVUw-q71PF5L7gFfF7RvCZRppVlMivgxvYcQD6J2ir7D8TxN3EwS-uUzQartr7j-ccmJANv-sB6GAgV7q2JgBYcrtRvAyaoaiolDf056y7Jn2A15n7_mAnUjooU9vwAArARjHee9DYb-9T8iMzam1GdGFZhgkQx3GXdtEnnXHc1effGnbo2RzUJ3SrS1YVRE70cGF2abLkRzu9bGMw

Intro Section Images:
- Woman with lantern: https://lh3.googleusercontent.com/aida-public/AB6AXuBr45zpc6jf-p244x_pxxkIB9B-fNC2p5qVLPTeR9K2eHqNcKFK23CnXQqbTRQpukKu8R9_jgX7VpKtn94xGsRDq4_-dKnDE3sBaYfeLDfV-RojE7Ef35rM1YjvwdjxCqmRU8IJbGiu83c0UiuWtkAgTh5B8LhZCIKDWQGV5J8DSWbWitXYWo2BowoLDpmX6Q-6EpHzqwyvNYqUrUCtq3Gya28qo84BUekyoeH7vze2RQZxgLoX9WZyfNuZfyO1uPNhLpnF4waoqLU
- Lanterns in sky: https://lh3.googleusercontent.com/aida-public/AB6AXuC9qfL0PLEmCqV41_x6YtMMvMn0rzGh0jRop1vfLj7uOHXL4oRllQhetYuquOrvHucp-blIBjnxGnXc-7XQcc9vQaasOF_K63uZw5vWIHBLNYTmPrnq3E235cAP994cmNxdqtFH4w6Op9Z8AP8Wdj-VbqvH3ZGOfXXBmfWrbDeZLGQiFQ2qlAcMkQSovIFrQu8Co174ZPkKBDICNkqHT60BpjFhfVUYHLvdAPZpViPnOVoXHcqz79MLEY_qaE-rVIllstYQa4xeIeM
- Friends at festival: https://lh3.googleusercontent.com/aida-public/AB6AXuAXJ4_k1CiTC34uUsq42DeEM4b1rCZ5Xqsexgxfz2f2QTimaq6fUlpyzvM0wCIiaNJyjS1nIaV3BOc-HFfz11N9agJw1hPoufvfT5Hi-80GxwMgO3LpHJg1yW8Zugek0b3AZMtUSiO--ijiCtPhYPNsO51P4Icpe7IC6V4ymEHMbRDt1ivTFbEs8VaVO78ubqvBToP_NUtINRkp6ksFYeWPKZP0cP9wmp0MKalFYRO0XTf8fXowiUojjwNVCZO21-5CThhcIWj0WRo

Location Cards:
- Austin: https://lh3.googleusercontent.com/aida-public/AB6AXuDaYZ3Q27V_YXcQLn3VY8q-6U8WaW4NcVGz2-KG3CFOKAFXLcI_lh3J4ZRjAgZASSmANOguYPVkiI1O1zAMeZBsvkYraEsMmntk7hXTSDeE3CZSCOx3am6Q77pqQc9sGEWZaQdGDTBIOJA_9QAYxyKbH0icSQx9moFIgfuHsf0YiResu7nKaVzvGV8bUjxc6U-ivArkd7JPfNKY0Dwrv6Z6ZmurdEoennShIwAXxoq04WY46kwq0tc5drdf3RHAL6nbPBWcsXrL384
- London: https://lh3.googleusercontent.com/aida-public/AB6AXuChylpICTz-CjF2o8IN4AAyfhgduwwOokpNGCWBw4lm6c-w6bGQSOTIoo0rygEEx3tGFYxH4QP_ml33R50r07dVep3apJb753itY_yJ44aR-hDYnZHtDTyxzJp-ojz1KcbHFpH92A4TtbmdBciRFndaQU_wmola6kjZM8bzH_CJsGsHbpDDkCPT0fb55OJfQap8l4risQNPKUTzllHDr-pScsjEWh-UXGlww_ysdN7hzpbGlje6L8ixGsiITOtZHYDaeDcJC4Gi0-0
- Tokyo: https://lh3.googleusercontent.com/aida-public/AB6AXuBtF-6t9KmgUIx7TZy3VuAd-dPsqwQ6dylzzF5EyYD3Tlq8CEyi1MmSj9EFd5TKXDufMUolJWm0bS4LzHaxrO1np6whKIKnbD6IuPRXOmpvolTEFr3_T1dSocAaTUCIWOf0w_cRkK09fMWblbbgbyRDdGIh2Xa8pryAV5MVqVBa6Ao0WTJobEBTeKcLkv4wfS1oyT8Hf7ENLXG47nuKRTJqL8a-mXHynbOkepU7iWnFIjKNxuqt__ECM5_i7aPGEIsqbd7mME9uSqM
- New York: https://lh3.googleusercontent.com/aida-public/AB6AXuD-i2PRvDmubQSxuVZ1Vq8mUSSbAhook5MDwn3GE1gMsYqgWOsWrGs3bMEtI1aFQ3XcszTivbXK64QJ3j5wADy8i_f5WvirgCwGyXDyjp1r9OehG5JpvjUpSpqKJpgwrVTeIt_ljaeSih3kZPaTOjsBZDooHikfTDk8No-lpfQzvfyH81FKFswIYOFsytb_Te5i1UM1DOapqAB-YBq4-cI0ldZuUrkqE04Us2tn1yVONdvefwJrVmdb5S1Y1k7LyIsFcGP3dZ75kKA

Gallery Images:
- People watching lanterns: https://lh3.googleusercontent.com/aida-public/AB6AXuAQ2QiMjeETFBU24sFoLFljDq-7_uPHwXt-M-OelrG8jXmTcF2GsNArzNUrL8bGJWG5KT12lroJMPIKwn9hvg13OpNdmPn7zHVXus1E7JNZnTlF_tq8XYv9K2wJTk12LusFtH4gkeqXsqtn_ROgsR1rUE2Sl9zQuBZ9XKRfzVS2EMVbzdgFJKaaemIexwH0OASBMCbfBtSLFniVnLWEYYgDai2FjXC-BGPeq4pE2CGk6hKieiLZ1bG80T5D-Mn3URyPS45EtalN318
- Skier with flare: https://lh3.googleusercontent.com/aida-public/AB6AXuCa6VH39w-Pke2ihkV7gIDdhJUcpek0Ve1do69YTJoqeFvI3DjNlS2N16bV0FE7-4h3LbURh7oyEUZbvodCtvMDwPoZMvIKim35xLjUVRNEiye3TBMhe-9_Bn-3eHPkX0Yhdfd7ZyFE0k_5SE2Pbr4BoR1uK7ibRNyZY2vzoOaYKspc5mVT_fKG4pnLoSD8bh-2a9gI-Sv5eKXCTWF43yivX55f0uV9yWyBunJEPp8f78zHJ2JB4OU9HjR5G4x24s5hLdkkPnH3ZRo
- Silhouette: https://lh3.googleusercontent.com/aida-public/AB6AXuATK35NqHzy-aZSnWMzy2uYieeU3ATsSv-GNwD8EO6g4hzn8ALGBuJizuZ0ZSC0bmDwZDJhy_LIp1QH3qAywYLGChX7QrIU3YwIXiYbAETDM7CEbCMyfpvH1SzKmvyXbSc301YlqAckx0Lkgr6d5ePjAdXTMUWSoMvnCdtfl4WnxW-U9Y6JL-Ij7w2DTs33s-islSVlE0aGqN9JEfMZvz5ALzvIxki0g5hqIN0N1fIUZlhfF43JWC2n_hdNhrObLfccMV3jwtF1-F8
- Mountain landscape: https://lh3.googleusercontent.com/aida-public/AB6AXuCkIYF7ikEP7JxcwbYx2gqcIe3Y4e8s6pv9giZCJGciEFIS9UpygiKVbXRvTI_JviviQr3x6OUp16Vpu9b-VNUp_K-cT4gqaF7kGfWjUBxxDzwFC8WDF2IQohnigdNgEvHW0VQja2OIBo-l0w24gzLcSDCQJjgjQYFqc-DUucDHcWvmDeRHEpAruLO-D14Uf9WDS9a6cL759R9XenUlBDUC9fypHwqkl9uKzNFCrU1DOvh3KY2JLApTXqjggqcR0SmjQgnJaodgAw8
```

---

## Implementation Plan

**All design questions finalized ✓**

**Implementation order:**
1. Update `tailwind.config.ts` with new design tokens (glow shadow, extended border-radius, marquee animation)
2. Create new landing page components:
   - `components/landing/marquee-strip.tsx`
   - `components/landing/intro-section.tsx`
   - `components/landing/event-slider.tsx`
   - `components/landing/cta-section.tsx`
   - `components/landing/gallery-section.tsx`
3. Update `components/layout/header.tsx` to floating glassmorphism style with mobile drawer
4. Rebuild `app/page.tsx` as immersive landing page
5. Update `components/layout/footer.tsx` to match design
6. Add event badge field to Prisma schema (optional admin override)
7. Wire up event data fetching with fallback pattern

**Use frontend-design skill** for implementation

---

## Additional Decisions (Session 2)

### 5. Newsletter Form Behavior
**Decision:** Toast notification

- Shows celebratory success toast in corner
- Form stays visible, user stays on page
- Keeps energy flowing, non-disruptive UX

### 6. Mobile Navigation
**Decision:** Hamburger → Slide-out drawer

- Classic pattern users expect
- Full-height panel slides from right
- Links stacked vertically
- Styled with glassmorphism to match desktop aesthetic

### 7. Event Card Badge Logic
**Decision:** Hybrid (automatic rules + admin override)

- **Automatic rules:**
  - "SELLING FAST" → <20% tickets remaining
  - "ALMOST SOLD OUT" → <10% remaining
  - "NEW" → Event created within last 7 days
- **Admin override:** Can set custom badge text per event in dashboard

### 8. Events Page Strategy
**Decision:** Keep landing page and `/events` page separate

- Landing page: 4-6 featured/upcoming events in "Find Your Light" section
- `/events` page: Full filterable list of all events
- "View All Events" link connects them
- Clear separation: landing = conversion, events = browsing

---

## Validated Design Specification

### Page Structure

The landing page has **7 distinct vertical sections**, creating an emotional journey:

```
┌─────────────────────────────────────┐
│  Floating Nav (glassmorphism)       │  ← Fixed position, blurs on scroll
├─────────────────────────────────────┤
│  HERO - "IGNITE THE NIGHT"          │  ← Full viewport, background image
│  CTA: "Get Tickets"                 │
├─────────────────────────────────────┤
│  MARQUEE - "DREAM • IGNITE • ..."   │  ← CSS infinite scroll animation
├─────────────────────────────────────┤
│  INTRO - "More Than Just..."        │  ← Two-column, image masonry
├─────────────────────────────────────┤
│  EVENTS - "Find Your Light"         │  ← Horizontal scroll cards (4-6)
│  "View All Events →"                │
├─────────────────────────────────────┤
│  CTA - "Ready to Glow?"             │  ← Dark purple bg, email form
├─────────────────────────────────────┤
│  GALLERY - "Captured Moments"       │  ← Photo masonry grid
├─────────────────────────────────────┤
│  FOOTER                             │  ← Redesigned, dark theme
└─────────────────────────────────────┘
```

### Navigation Behavior

- **Desktop:** Horizontal pill-shaped nav with glassmorphism (backdrop-blur + semi-transparent bg)
  - Links: Home, Events, About, Contact
  - Right side: "Get Tickets" button + UserMenu
- **Mobile:** Hamburger icon → slide-out drawer from right, same glassmorphism styling
- **Scroll behavior:** Nav starts transparent over hero, becomes more opaque with blur as user scrolls

### Component Architecture

**New Components (`components/landing/`):**

| Component | Props | Responsibility |
|-----------|-------|----------------|
| `marquee-strip.tsx` | `words: string[]` | Infinite CSS scroll animation |
| `intro-section.tsx` | None (static) | Two-column layout, image masonry |
| `event-slider.tsx` | `events`, `fallbackEvents?` | Horizontal scroll event cards with badges |
| `cta-section.tsx` | `onSubmit: (email) => void` | Dark purple bg, email input, toast on submit |
| `gallery-section.tsx` | None (static) | Masonry grid of gallery images |

**Modified Components:**

| Component | Changes |
|-----------|---------|
| `header.tsx` | Floating pill shape, glassmorphism, mobile drawer, scroll-aware opacity |
| `footer.tsx` | Restyle to dark theme |
| `hero-section.tsx` | New `variant="landing"` prop for full viewport style |

### Page Composition

```tsx
// app/page.tsx (Server Component)
export default async function HomePage() {
  const events = await getUpcomingEvents()

  return (
    <>
      <Header floating />
      <HeroSection variant="landing" />
      <MarqueeStrip words={["DREAM", "IGNITE", "CONNECT", "GLOW"]} />
      <IntroSection />
      <EventSlider events={events} fallbackEvents={placeholders} />
      <CtaSection onSubmit={handleNewsletterSignup} />
      <GallerySection />
      <Footer />
    </>
  )
}
```

### Data Flow

- **Event fetching:** Server-side in `app/page.tsx`, queries published events ordered by date
- **Fallback pattern:** If 0 events, show placeholder cards with "Coming Soon" linking to `/events`
- **Badge calculation:** Utility function checks admin override first, then automatic rules
- **Newsletter:** Client component calls `/api/newsletter/subscribe`, shows toast on success

---

*Design validated and ready for implementation*
