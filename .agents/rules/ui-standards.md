# UI Standards & Consistency Rules

## Banner Standard
Always maintain the exact same height and padding for all page banners across QueueLess:
- `min-height: var(--banner-min-height, 250px);`
- `padding: var(--banner-padding, 36px 44px);`
- Tablet (`max-width: 900px`): `min-height: 220px;`, `padding: var(--banner-padding-tablet, 28px 24px);`
- Mobile (`max-width: 600px`): `min-height: 200px;`, `padding: var(--banner-padding-mobile, 22px 18px);`
- Always reference `--banner-min-height` and `--banner-padding` from `variables.css`.

## Card Standards
- 3 cards per row on desktop (`grid-template-columns: repeat(3, 1fr)`).
- Resting box-shadow: `0 6px 20px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04)`.
- Hover box-shadow: `0 16px 32px -4px rgba(15, 23, 42, 0.12), 0 6px 12px -2px rgba(15, 23, 42, 0.06)`.
- Duration badge: Top-right corner of poster with dark frosted glass (`rgba(15, 23, 42, 0.72)` + blur) for universal visibility.
- Action buttons inside cards: No box-shadow on hover.
