# Visual Guidelines

## Layout Structure

### Mobile-First Approach
All layouts are designed for 375px viewport first, then scale up with `md:` breakpoints (768px).

### Page Layout
```
┌─────────────────────────┐
│  Header (safe-top)      │  bg-background-elevated, border-b
├─────────────────────────┤
│                         │
│  Content Area           │  px-4 py-6, overflow-y-auto
│  (scrollable)           │
│                         │
├─────────────────────────┤
│  Bottom Nav (fixed)     │  bg-background-elevated, border-t
│  (safe-bottom)          │
└─────────────────────────┘
```

### Safe Areas
iOS notch and home indicator are handled via CSS environment variables:
- `safe-top` class: `padding-top: env(safe-area-inset-top)`
- `safe-bottom` class: `padding-bottom: env(safe-area-inset-bottom)`
- Bottom nav accounts for `--safe-area-bottom` in its height

### Bottom Navigation
- 4 items: Home, Alerts (with unread badge), Add (+), Settings
- Add button is elevated: crimson `bg-primary` rounded square with `+` icon
- Fixed to bottom, 64px height + safe area
- Content area has matching bottom padding to avoid overlap

## Responsive Patterns

### Landing Page
- Hero section: centered text, full-width CTA on mobile
- Features grid: stacked on mobile → 3-column on `md:`
- Pricing grid: stacked on mobile → 2-column on `md:`

### Dashboard
- Monitor cards: full-width stacked list
- Upgrade prompt: full-width card below monitors

### Add Monitor Wizard
- Progress bar: horizontal 3-step indicator
- Service type grid: 2-column on all sizes
- Location list: scrollable with max-height `max-h-96`

## Empty States

Every list view has a dedicated empty state:
- Centered layout with dashed border icon placeholder
- Descriptive heading + body text
- Primary CTA button

Examples:
- Dashboard (no monitors): "No monitors yet" + "Add your first monitor"
- Alerts (no alerts): "No alerts yet" + descriptive subtext
- Location search (no results): "No locations found" message

## Error States

- Inline error banners: `bg-destructive/10 border border-destructive/20 rounded-lg p-3`
- Form validation: `text-sm text-destructive` below input
- Global error boundary: centered card with reload button, inline styles

## Loading States

- Page load: Single pulsing crimson dot, centered
- Button loading: Text changes to "Loading..." / "Activating..." + `disabled:opacity-50`
- Toggle loading: Button disabled during operation

## Iconography

- **Library**: Lucide React
- **Default size**: 16–22px depending on context
- **Color**: Inherits from text color (usually `text-foreground-muted`)
- **Stroke width**: Default (2), except add button (2.5)

### Common Icons
| Icon | Usage |
|------|-------|
| `Home` | Dashboard nav |
| `Bell` | Alerts nav |
| `Plus` | Add monitor |
| `Settings` | Settings nav |
| `MapPin` | Location indicators |
| `Clock` | Time indicators |
| `Crown` | Premium badge |
| `ArrowLeft` | Back navigation |
| `Check` | Selected state, feature lists |
| `Pause` / `Play` | Monitor toggle |
| `Trash2` | Delete |
| `ExternalLink` | External links, booking |

## Alert Card Design

```
┌──────────────────────────────────────┐
│ ● [GE]  📍 JFK International    2m  │
│   Wednesday, March 15, 2026          │
│   10:30 AM EST                       │
└──────────────────────────────────────┘
```

- Unread dot (primary color) on left
- Service badge (monospace, primary/10 bg)
- Location with pin icon
- Time ago on right (monospace)
- Slot date + time below
