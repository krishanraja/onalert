# Visual Guidelines

## Layout Structure

### Mobile-First Approach
All layouts are designed for 375px viewport first, then scale up with `md:` breakpoints (768px). The app is primarily a mobile PWA experience.

### Page Layout
```
+---------------------------+
|  Header (safe-top)        |  bg-background-elevated, border-b
+---------------------------+
|                           |
|  Content Area             |  px-4 py-6, overflow-y-auto
|  (scrollable)             |
|                           |
+---------------------------+
|  Bottom Nav (fixed)       |  bg-background-elevated, border-t
|  (safe-bottom)            |
+---------------------------+
```

### Safe Areas
iOS notch and home indicator are handled via CSS environment variables:
- `safe-top` class: `padding-top: env(safe-area-inset-top)`
- `safe-bottom` class: `padding-bottom: env(safe-area-inset-bottom)`
- Bottom nav accounts for `--safe-area-bottom` in its height
- Content area has matching bottom padding to avoid overlap with nav

### Bottom Navigation
- **4 items**: Home, Alerts (with unread badge), Add (+), Settings
- **Add button**: Elevated crimson `bg-primary` rounded square (`rounded-2xl`) with centered `+` icon
- **Fixed position**: Bottom of viewport, 5rem height + safe area inset
- **Unread badge**: Crimson background, white text, absolute positioned on Alerts icon, shows "9+" for counts over 9
- **Active state**: `text-primary` on active nav item

## Responsive Patterns

### Landing Page
- **Hero section**: Large logo (3x scale on mobile), centered text, full-width CTA
- **Feature grid**: 3 feature cards stacked on mobile -> 3-column on `md:`
- **Pricing grid**: Stacked on mobile -> 2-column on `md:`
- **Header**: Icon-only on mobile for maximum content space, full wordmark on desktop

### Dashboard
- **Monitor cards**: Full-width stacked list with service badge, locations, and status
- **Upgrade prompt**: Full-width gradient card below monitors (free users only)
- **Empty state**: Centered with dashed border and "Add your first monitor" CTA
- **Plan badge**: FREE or PREMIUM (with Crown icon) in header

### Add Monitor Wizard
- **Progress bar**: Horizontal 3-step indicator with active/completed states
- **Service type grid**: 2x2 grid with program name, abbreviation, and description
- **Location list**: Searchable with `max-h-96`, multi-select with checkmarks
- **Confirmation**: Summary card with service type, selected locations, and check frequency
- **Plan limits**: Free users see limit warnings (max 3 locations, max 1 monitor)

### Settings Page
- **Sections**: Account, Notifications, Upgrade (free users), Sign out
- **Toggle switches**: Email alerts (always on), SMS alerts (premium only)
- **Pricing cards**: Monthly and Annual side-by-side with "Save $79" badge on annual
- **Sign out**: Confirmation dialog before logout

### Auth Page
- **Multiple modes**: Sign in, sign up, magic link, Google OAuth
- **Google button**: Full-width, prominent placement
- **Divider**: "or continue with email" between OAuth and email form
- **Confirmation screen**: Shown after sign-up or magic link with check icon

## Empty States

Every list view has a dedicated empty state:
- Centered layout with icon placeholder
- Descriptive heading + supportive body text
- Primary CTA button where applicable

| Page | Heading | CTA |
|------|---------|-----|
| Dashboard (no monitors) | "No monitors yet" | "Add your first monitor" |
| Alerts (no alerts) | "No alerts yet" | Descriptive subtext |
| Location search (no results) | "No locations found" | -- |

## Error States

- **Inline error banners**: `bg-destructive/10 border border-destructive/20 rounded-lg p-3`
- **Form validation**: `text-sm text-destructive` below input field
- **Global error boundary**: Centered card with error message + "Reload" button, inline crimson styling
- **Action errors**: Toast or inline message with retry option

## Loading States

- **Page load**: Single pulsing crimson dot, centered in viewport
- **Button loading**: Text changes to "Loading..." / "Activating..." with `disabled:opacity-50`
- **Toggle loading**: Button disabled during async operation
- **Auth loading**: Full-screen spinner during session check

## Iconography

- **Library**: Lucide React
- **Default size**: 16-22px depending on context
- **Color**: Inherits from text color (usually `text-foreground-muted`)
- **Stroke width**: Default (2), except add button (2.5 for emphasis)

### Common Icons
| Icon | Usage |
|------|-------|
| `Home` | Dashboard nav |
| `Bell` | Alerts nav (with unread badge overlay) |
| `Plus` | Add monitor (elevated button) |
| `Settings` | Settings nav |
| `MapPin` | Location indicators |
| `Clock` | Time indicators, "time ago" |
| `Crown` | Premium badge, upgrade prompts |
| `ArrowLeft` | Back navigation |
| `Check` | Selected state, feature lists, confirmations |
| `Pause` / `Play` | Monitor toggle |
| `Trash2` | Delete action |
| `ExternalLink` | External links, booking CTA |
| `Search` | Location search input |
| `Mail` | Email-related features |

## Alert Card Design

```
+--------------------------------------+
| * [GE]  > JFK International    2m   |
|   Wednesday, March 15, 2026          |
|   10:30 AM EST                       |
+--------------------------------------+
```

- **Unread dot**: Primary color on left edge
- **Service badge**: Monospace, `bg-primary/10` background
- **Location**: MapPin icon + name (truncated if long)
- **Time ago**: Monospace, right-aligned (e.g., "2m", "1h")
- **Slot date + time**: Below, monospace font for precision
- **Tap target**: Entire card is clickable, navigates to detail view

## Alert Detail Design

- **Service badge**: Large, prominent
- **Location**: Full name with MapPin icon
- **Slot time**: Full date + time in monospace with timezone
- **Time warning**: Amber banner if alert is >10 minutes old ("This slot appeared X minutes ago")
- **Booking CTA**: Full-width primary button with ExternalLink icon
- **Haptic feedback**: Double-pulse pattern for alerts less than 30 minutes old
