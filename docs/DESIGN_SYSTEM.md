# Design System

## Philosophy

Bloomberg Terminal meets mobile-first: dark, precise, urgent. The design conveys reliability and speed  - critical for a time-sensitive alerting product.

## Color Tokens

All colors are defined as CSS custom properties in `src/index.css` and mapped to Tailwind classes in `tailwind.config.ts`.

### Backgrounds
| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#0A0A0A` | Page background |
| `--background-elevated` | `#111111` | Headers, nav, elevated surfaces |
| `--surface` | `#141414` | Cards, panels |
| `--surface-muted` | `#1A1A1A` | Hover states, secondary surfaces |
| `--input` | `#0F0F0F` | Form input backgrounds |

### Foregrounds
| Token | Value | Usage |
|-------|-------|-------|
| `--foreground` | `#F5F5F5` | Primary text |
| `--foreground-secondary` | `#A3A3A3` | Secondary text |
| `--foreground-muted` | `#666666` | Tertiary text, placeholders |

### Accents
| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | `#9F0506` | CTAs, active states, brand |
| `--destructive` | `#EF4444` | Delete, errors |
| `--success` | `#22C55E` | Active indicators, checkmarks |
| `--warning` | `#FF6B35` | Time-sensitive warnings |
| `--alert-muted` | `#9F050610` | Unread alert backgrounds |

### Borders
| Token | Value | Usage |
|-------|-------|-------|
| `--border` | `#1F1F1F` | Default borders |

## Typography

### Font Stack
- **Sans-serif**: `Inter` (400, 500, 600, 700)
- **Monospace**: `Fira Code` (400, 500)  - slot times, badges, timestamps

### Scale
| Usage | Size | Weight | Font |
|-------|------|--------|------|
| Page title | `text-lg` (18px) | 600 | Inter |
| Section heading | `text-lg` (18px) | 600 | Inter |
| Card title | `text-sm` (14px) | 500 | Inter |
| Body | `text-sm` (14px) | 400 | Inter |
| Mono data | `text-sm` (14px) | 500 | Fira Code |
| Caption | `text-xs` (12px) | 400 | Inter |
| Badge | `text-[10px]` | 500 | Fira Code |

## Spacing

- Page padding: `px-4 py-6`
- Card padding: `p-4`
- Card gap: `space-y-3`
- Section gap: `space-y-6`

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius` | `0.5rem` (8px) | Default (buttons, cards, inputs) |
| `--radius-lg` | `0.75rem` (12px) | Large cards, modals |
| `--radius-full` | `9999px` | Badges, pills, dots |

## Shadows

| Token | Usage |
|-------|-------|
| `--shadow-sm` | Subtle elevation (bottom nav add button) |
| `--shadow-md` | Card hover states |

## Animations

| Name | Duration | Usage |
|------|----------|-------|
| `fade-in` | 300ms | Page transitions |
| `scale-in` | 200ms | Modal appearance |
| `slide-up` | 400ms | Bottom sheet entry |
| `ping` | 1s loop | Loading indicator |

## Component Patterns

### Buttons
- **Primary**: `bg-primary text-white`  - CTAs, submit actions
- **Secondary**: `border border-border text-foreground`  - Back, cancel
- **Destructive**: `bg-destructive text-white`  - Delete confirm
- **Ghost**: `text-foreground-muted hover:text-foreground`  - Nav items

### Cards
- Surface background with border: `bg-surface border border-border rounded-lg p-4`
- Active/selected state: `border-primary bg-primary/5`
- Disabled state: `opacity-50 cursor-not-allowed`

### Service Badges
- Monospace, small: `text-[10px] font-mono font-medium bg-primary/10 text-primary px-2 py-0.5 rounded`

### Status Indicators
- Active: `text-success` with bullet `●`
- Paused: `text-foreground-muted` with open circle `○`
- Unread: 2px primary dot

### Loading State
- Single pulsing dot: `w-1 h-1 rounded-full bg-primary animate-ping`
- Centered in viewport: `min-h-screen flex items-center justify-center`
