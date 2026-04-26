# Visual Guidelines

## Layout structure

### Mobile-first
All layouts are designed for 375px viewport first, then scale up at `md:` (768px) and `lg:` (1024px). The app is primarily a mobile PWA experience, so any layout that fails at 375px is a regression.

### App page layout

```
+---------------------------+
|  Header (safe-top)        |  bg-background-elevated, border-b, height 3.5rem
+---------------------------+
|                           |
|  Content area             |  px-4 py-6, no scroll on enforced pages
|                           |
+---------------------------+
|  Bottom nav (fixed)       |  bg-background-elevated, border-t, height 5rem + safe area
|  (safe-bottom)            |
+---------------------------+
```

### Safe areas
iOS notch and home indicator are handled via CSS environment variables:
- `safe-top`: `padding-top: env(safe-area-inset-top)`
- `safe-bottom`: `padding-bottom: env(safe-area-inset-bottom)`
- Bottom nav accounts for `--safe-area-bottom` in its height
- Content area has matching bottom padding to avoid overlap with the nav

### No-scroll mobile pages
Several core pages enforce `overflow-hidden` on the mobile viewport so the bottom nav never collides with content (regression: `01b43f0`). New pages should follow the same pattern unless they are intentionally scroll-heavy (alerts feed, locations directory).

### Bottom navigation
- **4 items**: Home, Alerts (with unread badge), Add (+ elevated), Settings
- **Add button**: elevated crimson `bg-primary` rounded square (`rounded-2xl`) with centered `+` icon
- **Fixed position**: bottom of viewport, 5rem height + safe area inset
- **Unread badge**: crimson background, white text, absolute-positioned on Alerts icon, shows "9+" for counts above 9
- **Active state**: `text-primary` on the active nav item

### Sidebar (desktop)
- Visible at `md:` and above
- Same nav items as bottom nav plus expanded labels
- Persistent — does not collapse

## Responsive patterns by surface

### Landing page (`/`)
- **Hero**: large icon (3× scale on mobile), centered text, full-width CTA stack
- **Programs strip**: GE / NEXUS / SENTRI badges, centered
- **How-it-works**: 3-step row, stacked on mobile, 3-column on `md:`
- **Pricing**: 4 plan cards (Free / Pro / Multi / Express), stacked on mobile, 2-column on `md:`, 4-column on `lg:`
- **Government agency logos**: DHS + CBP, side-by-side, centered (TSA logo removed in `a3b6f6d` after TSA PreCheck was scoped to "bundled benefit" not "standalone monitor")
- **Header**: icon-only on mobile, full wordmark on desktop
- **"Fastest alerts" badge**: aligned left on mobile (regression fix `a870d8c`)

### Dashboard (`/app`)
- **Quick stats row**: 3 KPI cards (active monitors, alerts this week, locations watched)
- **Activity feed**: timeline of recent alerts
- **Insights cards**: prediction card, location intelligence (Pro+ only)
- **All-clear card**: shown when no new slots in the last polling cycle
- **Plan badge**: FREE or paid tier name (with Crown icon) in header
- **Empty state**: centered, dashed border, "Add your first monitor" CTA

### Add monitor wizard (`/app/add`)
- **Progress bar**: horizontal 3-step indicator with active/completed states
- **Step 1 — service type**: 3-card grid (GE, NEXUS, SENTRI) with abbreviation, description, and "Includes TSA PreCheck" caption
- **Step 2 — locations**: searchable list with `max-h-96`, multi-select with checkmarks, plan-aware limit indicator
- **Step 3 — confirm**: summary card with service, locations, check frequency, deadline filter (Pro+)
- **Plan limits**: free users see "1 monitor max, 3 locations max" inline warnings before they're blocked

### Alerts page (`/app/alerts`)
- **Filter bar**: live / history tabs, monitor filter chip, service-type filter chip
- **Card list**: scrollable, virtualized for large feeds
- **Unread**: 2px crimson dot on left edge, slightly elevated card background
- **Empty state**: "No alerts yet — your monitors are watching" with subtle reassurance copy

### Settings page (`/app/settings`)
- **Sections**: Account, Notifications, Plan / Billing, Phone (SMS), Danger zone, Sign out
- **Toggle switches**: email alerts (always on for transactional), SMS alerts (Pro+ only)
- **Upgrade overlay**: centered modal with all 4 plan cards (regression: solid `bg-surface` so it doesn't bleed — `037323c`); current plan highlighted; tier-appropriate CTAs
- **Sign out**: confirmation dialog before logout

### Auth page (`/auth`)
- **Multiple modes**: sign in, sign up, magic link, Google OAuth
- **Google button**: full-width, prominent placement at the top
- **Divider**: "or continue with email" between OAuth and email form
- **Confirmation screen**: shown after sign-up or magic link with check icon

### Public surfaces (`/locations`, `/wait-times`, `/guide`, `/privacy`, `/terms`)
- Standalone full-page layouts (no app shell)
- Per-page SEO meta via `react-helmet-async`
- Indexable (`/app/*` is `noindex, nofollow` — public surfaces are the SEO surface area)

## Empty states

Every list view has a dedicated empty state:
- Centered layout with icon placeholder
- Descriptive heading + supportive body text
- Primary CTA button when applicable

| Page | Heading | CTA |
|------|---------|-----|
| Dashboard (no monitors) | "No monitors yet" | "Add your first monitor" |
| Alerts (no alerts) | "No alerts yet" | descriptive subtext, no CTA |
| Location search (no results) | "No locations found" | — |
| Audit (no recent runs) | "Polling looks idle" | "View pg_cron jobs" link |

## Error states

- **Inline error banners**: `bg-destructive/10 border border-destructive/20 rounded-lg p-3`
- **Form validation**: `text-sm text-destructive` below input
- **Global error boundary**: centered card with error message + "Reload" button, inline crimson styling
- **Action errors**: toast or inline message with retry option
- **Stripe errors**: surface the actual Stripe error string instead of a generic "something went wrong" (regression `197e4a1`)

## Loading states

- **Page load**: single pulsing crimson dot, centered in viewport
- **Button loading**: text changes to "Loading..." / "Activating..."; `disabled:opacity-50`
- **Toggle loading**: button disabled during async operation
- **Auth loading**: full-screen spinner during session check

## Iconography

- **Library**: Lucide React
- **Default size**: 16–22px depending on context
- **Color**: inherits from text color (usually `text-foreground-muted`)
- **Stroke width**: default 2; bottom-nav add button uses 2.5 for emphasis

### Common icons

| Icon | Usage |
|------|-------|
| `Home` | Dashboard nav |
| `Bell` | Alerts nav (with unread badge overlay) |
| `Plus` | Add monitor (elevated bottom-nav button) |
| `Settings` | Settings nav |
| `MapPin` | Location indicators |
| `Clock` | Time indicators, "time ago" |
| `Crown` | Premium / paid badges, upgrade prompts |
| `ArrowLeft` | Back navigation |
| `Check` | Selected state, feature lists, confirmations |
| `Pause` / `Play` | Monitor toggle |
| `Trash2` | Delete action |
| `ExternalLink` | Booking CTA, outbound links |
| `Search` | Location search input |
| `Mail` | Email-related features |
| `Phone` | SMS settings |
| `Star` | Starred monitors |

## Alert card anatomy

```
+---------------------------------------------------+
| ● [GE]  ▸ JFK International              2m ago   |
|   Wednesday, March 15, 2026                       |
|   10:30 AM EST                                    |
+---------------------------------------------------+
```

- **Unread dot**: primary color on the left edge
- **Service badge**: monospace, `bg-primary/10` background
- **Location**: MapPin icon + name (truncated if long)
- **Time ago**: monospace, right-aligned (e.g., "2m", "1h")
- **Slot date + time**: below, monospace for precision
- **Tap target**: entire card is clickable; navigates to `/app/alerts/:id`

## Alert detail anatomy

- **Service badge**: large, prominent
- **Location**: full name with MapPin icon
- **Slot time**: full date + time in monospace with timezone
- **Time warning**: amber banner if alert is >10 minutes old ("This slot appeared X minutes ago — slots fill in 5–15")
- **Location intelligence** (Pro+): days since last alert at this location, 30-day count, average fill time
- **Booking CTA**: full-width primary button with `ExternalLink` icon — the deep-link generator (`buildBookUrl` in `src/lib/cbpApi.ts`) builds the location- and service-specific URL
- **Haptic feedback**: double-pulse pattern for alerts less than 30 minutes old (mobile only, respects user settings)
- **Click tracking**: every booking-CTA click POSTs to `track-booking-click` for attribution
