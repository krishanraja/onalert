# Design System

## Philosophy

Bloomberg Terminal meets mobile-first: dark, precise, urgent. The design conveys reliability and speed — critical for a time-sensitive alerting product. Every pixel serves the user's primary goal: catching and booking an appointment before it fills.

## Color tokens

All colors are defined as CSS custom properties (HSL) in `src/index.css` and mapped to Tailwind classes in `tailwind.config.ts`.

### Backgrounds
| Token | HSL | Hex | Usage |
|-------|-----|-----|-------|
| `--background` | `0 0% 4%` | `#0A0A0A` | Page background |
| `--background-elevated` | `0 0% 7%` | `#111111` | Headers, nav, elevated surfaces |
| `--surface` | `0 0% 10%` | `#1A1A1A` | Cards, panels |
| `--surface-muted` | `0 0% 8%` | `#141414` | Hover states, secondary surfaces |
| `--surface-elevated` | `0 0% 12%` | `#1F1F1F` | Buttons, input backgrounds |
| `--input` | `0 0% 12%` | `#1F1F1F` | Form input backgrounds |

### Foregrounds
| Token | HSL | Hex | Usage |
|-------|-----|-----|-------|
| `--foreground` | `0 0% 96%` | `#F5F5F5` | Primary text |
| `--foreground-secondary` | `0 0% 64%` | `#A3A3A3` | Secondary text — WCAG AA 5.74:1 on #0A0A0A |
| `--foreground-muted` | `0 0% 50%` | `#808080` | Muted/tertiary text — WCAG AA 5.39:1 on #0A0A0A |

> **April 2026 token cleanup:** `--foreground-muted` was raised from #666 to #808080 and `--border` from `0 0% 16%` (#2A2A2A) to `0 0% 22%` (#383838) for accessibility. Contrast ratios were re-validated at the same time.

### Accents
| Token | HSL | Hex | Usage |
|-------|-----|-----|-------|
| `--primary` | `0 94% 32%` | `#9F0506` | CTAs, active states, brand crimson |
| `--alert` | `0 94% 32%` | `#9F0506` | Alert accents (same as primary) |
| `--alert-muted` | `0 60% 12%` | — | Unread alert backgrounds |
| `--success` | `142 71% 45%` | `#27AE60` | Active indicators, checkmarks |
| `--warning` | `38 92% 50%` | `#FFBA00` | Time-sensitive slot warnings |
| `--destructive` | `0 72% 51%` | `#FF5454` | Delete actions, errors |

### Borders & rings
| Token | HSL | Hex | Usage |
|-------|-----|-----|-------|
| `--border` | `0 0% 22%` | `#383838` | Default borders (raised for visibility) |
| `--ring` | `0 94% 32%` | `#9F0506` | Focus ring — crimson |

## Typography

### Font stack
- **Sans-serif**: `Inter` (weights: 400, 500, 600, 700) — UI text
- **Monospace**: `Fira Code` / `Fira Mono` (weights: 400, 500) — slot times, badges, timestamps, data

### Type scale
| Usage | Size | Weight | Font |
|-------|------|--------|------|
| Page title | `text-lg` (18px) | 600 (semibold) | Inter |
| Section heading | `text-lg` (18px) | 600 (semibold) | Inter |
| Card title | `text-sm` (14px) | 500 (medium) | Inter |
| Body text | `text-sm` (14px) | 400 (regular) | Inter |
| Mono data | `text-sm` (14px) | 500 (medium) | Fira Code |
| Caption | `text-xs` (12px) | 400 (regular) | Inter |
| Service badge | `text-[10px]` (10px) | 500 (medium) | Fira Code |

Minimum size in the app is 10px (the service badge). Anything smaller fails accessibility.

## Spacing

- Page padding: `px-4 py-6`
- Card padding: `p-4`
- Card gap: `space-y-3`
- Section gap: `space-y-6`
- Header height: `--header-height: 3.5rem`
- Bottom-nav height: `--bottom-nav-height: 5rem`

## Border radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius` | `0.75rem` (12px) | Default — buttons, inputs |
| `--radius-lg` | `1rem` (16px) | Large cards, modals |
| `--radius-xl` | `1.25rem` (20px) | Add button in bottom nav |
| `rounded-full` | `9999px` | Badges, pills, status dots |

## Shadows

| Token | Specs | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.4)` | Subtle elevation (bottom-nav add button) |
| `--shadow-md` | `0 4px 12px -2px rgba(0,0,0,0.5)` | Card hover states |
| `--shadow-lg` | `0 12px 24px -4px rgba(0,0,0,0.6)` | Modals, dialogs, upgrade overlay |

## Animations

All animations respect `prefers-reduced-motion`.

| Name | Duration | Easing | Usage |
|------|----------|--------|-------|
| `fade-in` | 250ms | ease-out | Page transitions, content reveal |
| `scale-in` | 200ms | ease-out | Modal appearance |
| `slide-up` | 300ms | ease-out | Bottom-sheet entry |
| `slide-in-from-bottom` | 250ms | ease-out | Toast appearance |
| `slide-in-from-right` | 250ms | ease-out | Sidebar entry |
| `pulse-glow` | 2s | infinite | Active monitor indicator |
| `accordion-down` / `-up` | 200ms | ease-out | Expandable sections |
| `ticker-scroll` | 30s | linear, infinite | Marquee on landing page |

## Z-index scale

| Layer | z-index |
|-------|---------|
| sticky | 10 |
| popover | 50 |
| modal | 100 |
| toast | 110 |
| tooltip | 200 |

## Component patterns

### Buttons
- **Primary** — `bg-primary text-primary-foreground` — CTAs, submit
- **Secondary** — `border border-border text-foreground` — back, cancel
- **Destructive** — `bg-destructive text-white` — delete confirmations
- **Ghost** — `text-foreground-muted hover:text-foreground` — nav items, subtle actions
- **Outline** — `border border-border hover:bg-surface` — secondary emphasis

### Cards
- Default: `bg-surface border border-border rounded-lg p-4`
- Active/selected: `border-primary bg-primary/5`
- Unread alert: `border-primary/20 bg-alert-muted/30`
- Disabled: `opacity-50 cursor-not-allowed`
- Hover: `hover:border-primary/30 hover:bg-surface-muted`

### Service badges
- `text-[10px] font-mono font-medium bg-primary/10 text-primary px-2 py-0.5 rounded`
- Labels: **GE**, **NEXUS**, **SENTRI** *(no standalone TSA badge — TSA PreCheck is bundled in all three)*

### Status indicators
- Active: `text-success` with filled bullet
- Paused: `text-foreground-muted` with open circle
- Unread alert: 2px primary-colored dot

### Loading
- Page load: single pulsing crimson dot, centered
- Button: text changes to "Loading..." / "Activating..."; `disabled:opacity-50`
- Auth: full-screen spinner during session check

### Plan badges
- FREE — `text-foreground-muted`
- PRO / MULTI / EXPRESS — Crown icon + `text-primary` with subtle gradient on the upgrade overlay

### Toasts
Sonner-backed; appear bottom-center on mobile, top-right on desktop. Use sparingly — most feedback should be inline.

## Accessibility checklist

- All text colors meet WCAG AA contrast against their background
- All interactive elements have a 44×44px minimum touch target on mobile
- Focus rings always visible (crimson `--ring`); never removed without replacement
- ARIA labels on all icon-only buttons
- Reduced-motion respected on every animation
- Screen-reader-only labels on the bottom-nav unread badge
