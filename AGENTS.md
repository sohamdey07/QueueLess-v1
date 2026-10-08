# QueueLess Development Guidelines & Agent Memory

## UI & Design Standards

### 1. Banner Standards (MANDATORY across all pages)
All top page hero banners (such as `HeroBanner`, `AppointmentBanner`, and any newly created customer or admin page banners) **must** maintain uniform height and padding:
- **Desktop Dimensions**:
  - `min-height: var(--banner-min-height, 250px);`
  - `padding: var(--banner-padding, 36px 44px);`
- **Tablet Dimensions (`max-width: 900px`)**:
  - `min-height: 220px;`
  - `padding: var(--banner-padding-tablet, 28px 24px);`
- **Mobile Dimensions (`max-width: 600px`)**:
  - `min-height: 200px;`
  - `padding: var(--banner-padding-mobile, 22px 18px);`
- **Design Tokens**: Standardized in `Frontend/src/styles/variables.css`:
  - `--banner-min-height: 250px;`
  - `--banner-padding: 36px 44px;`
  - `--banner-padding-tablet: 28px 24px;`
  - `--banner-padding-mobile: 22px 18px;`

### 2. Service Booking Cards
- **Component**: Centralized common component at `Frontend/src/components/common/ServiceCard.jsx` (also exported from `components/customer`).
- **Grid Layout**: 3 cards per row on desktop (`grid-template-columns: repeat(3, 1fr); gap: 22px;`).
- **Card Structure & Inset Poster**:
  - Outer card has `padding: 16px; border-radius: 20px;`.
  - Poster image is an inset rounded container with its own `border-radius: 14px;` and white margin/padding surrounding it.
- **Card Box Shadow**: Default resting state has a prominent soft shadow:
  `box-shadow: 0 10px 30px -4px rgba(15, 23, 42, 0.08), 0 4px 10px -2px rgba(15, 23, 42, 0.04);`
- **Hover Elevation**: Smooth lift on hover:
  `box-shadow: 0 18px 38px -6px rgba(15, 23, 42, 0.12), 0 8px 16px -4px rgba(15, 23, 42, 0.06);`
- **Duration Badge**: Located at the top-right corner of the service poster image (`top: 10px; right: 10px;`) using frosted dark glass (`background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.2);`) for universal readability over any poster design.
- **Body Spacing**: Reduced gaps for a compact, cohesive look:
  - Gap between description and timing badge: `11px`.
  - Gap between timing badge and book button: `12px`.
- **Card Action Buttons**: No box-shadow on hover (only background color transition).
