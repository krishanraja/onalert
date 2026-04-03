# Design System

## Philosophy

Bloomberg Terminal meets mobile-first: dark, precise, urgent. The design conveys reliability and speed -- critical for a time-sensitive alerting product. Every pixel serves the user's primary goal: catching and booking an appointment before it fills.

## Color Tokens

All colors are defined as CSS custom properties (HSL) in `src/index.css` and mapped to Tailwind classes in `tailwind.config.ts`.

### Backgrounds
| Token | HSL | Hex | Usage |
|-------|-----|-----|-------|
| `--background` | `0 0% 4%` | `#0A0A0A` | Page background |
| `--background-elevated` | `0 0% 7%` | `#111111` | Headers, nav, elevated surfaces |
| `--surface` | `0 0% 10%` | `#1A1A1A` | Cards, panels |
| `--surface-muted` | `0 0% 8%` | `#141414` | Hover states, secondary surfaces |
| `--input` | `0 0% 12%` | `#1F1F1F` | Form input backgrounds |

### Foregrounds
| Token | HSL | Hex | Usage |
|-------|-----|-----|-------|
| `--foreground` | `0 0% 96%` | `#F5F5F5` | Primary text |
| `--foreground-secondary` | `0 0% 64%` | `#A3A3A3` | Secondary text (WCAG AA) |
| `--foreground-muted` | `0 0% 40%` | `#666666` | Tertiary text, placeholders |

### Accents
| Token | HSL | Hex | Usage |
|-------|-----|-----|-------|
| `--primary` | `0 94% 32%` | `#9F0506` | CTAs, active states, brand |
| `--destructive` | `0 72% 51%` | `#EF4444` | Delete actions, errors |
| `--success` | `142 71% 45%` | `#22C55E` | Active indicators, checkmarks |
| `--warning` | `38 92% 50%` | `#FF6B35` | Time-sensitive slot warnings |
| `--alert` | `0 94% 32%` | `#9F0506` | Alert accents (same as primary) |
| `--alert-muted` | `0 60% 12%` | -- | Unread alert backgrounds |

### Borders & Rings
| Token | HSL | Hex | Usage |
|-------|-----|-----|-------|
| `--border` | `0 0% 16%` | `#2A2A2A` | Default borders |
| `--ring` | `0 94% 32%` | `#9F0506` | Focus ring (crimson) |

## Typography

### Font Stack
- **Sans-serif**: `Inter` (weights: 400, 500, 600, 700) -- UI text
- **Monospace**: `Fira Code` (weights: 400, 500) -- slot times, badges, timestamps, data

### Type Scale
| Usage | Size | Weight | Font |
|-------|------|--------|------|
| Page title | `text-lg` (18px) | 600 (semibold) | Inter |
| Section heading | `text-lg` (18px) | 600 (semibold) | Inter |
| Card title | `text-sm` (14px) | 500 (medium) | Inter |
| Body text | `text-sm` (14px) | 400 (regular) | Inter |
| Mono data | `text-sm` (14px) | 500 (medium) | Fira Code |
| Caption | `text-xs` (12px) | 400 (regular) | Inter |
| Service badge | `text-[10px]` | 500 (medium) | Fira Code |

## Spacing

- Page padding: `px-4 py-6`
- Card padding: `p-4`
- Card gap: `space-y-3`
- Section gap: `space-y-6`
- Header height: `--header-height: 3.5rem`
- Bottom nav height: `--bottom-nav-height: 5rem`

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius` | `0.75rem` (12px) | Default (buttons, inputs) |
| `--radius-lg` | `1rem` (16px) | Large cards, modals |
| `--radius-xl` | `1.25rem` (20px) | Add button in bottom nav |
| `rounded-full` | `9999px` | Badges, pills, status dots |

## Shadows

| Token | Usage |
|-------|-------|
| `--shadow-sm` | Subtle elevation (bottom nav add button) |
| `--shadow-md` | Card hover states |
| `--shadow-lg` | Modals, dialogs |

## Animations

| Name | Duration | Easing | Usage |
|------|----------|--------|-------|
| `fade-in` | 250ms | ease-out | Page transitions, content reveal |
| `scale-in` | 200ms | ease-out | Modal appearance |
| `slide-up` | 300ms | ease-out | Bottom sheet entry |
| `accordion-down` | 200ms | ease-out | Expandable sections |
| `accordion-up` | 200ms | ease-out | Collapsible sections |

## Component Patterns

### Buttons
- **Primary**: `bg-primary text-primary-foreground` -- CTAs, submit actions
- **Secondary**: `border border-border text-foreground` -- Back, cancel
- **Destructive**: `bg-destructive text-white` -- Delete confirmations
- **Ghost**: `text-foreground-muted hover:text-foreground` -- Nav items, subtle actions
- **Outline**: `border border-border hover:bg-surface` -- Secondary emphasis

### Cards
- Default: `bg-surface border border-border rounded-lg p-4`
- Active/selected: `border-primary bg-primary/5`
- Unread alert: `border-primary/20 bg-alert-muted/30`
- Disabled: `opacity-50 cursor-not-allowed`
- Hover: `hover:border-primary/30 hover:bg-surface-muted`

### Service Badges
- `text-[10px] font-mono font-medium bg-primary/10 text-primary px-2 py-0.5 rounded`
- Labels: GE, TSA, NEXUS, SENTRI

### Status Indicators
- Active: `text-success` with filled bullet `*`
- Paused: `text-foreground-muted` with open circle
- Unread alert: 2px primary-colored dot

### Loading State
- Single pulsing dot: `w-1 h-1 rounded-full bg-primary animate-ping`
- Centered in viewport: `min-h-screen flex items-center justify-center`

### Plan Badges
- FREE: `text-foreground-muted` label
- PREMIUM: Crown icon + `text-primary` with gradient background on upgrade CTA
