# Branding

## Brand Identity

**OnAlert**  - Real-time government appointment monitoring.

### Tagline
> Stop checking. Start knowing.

### Brand Promise
Instant awareness when opportunity strikes. OnAlert eliminates the anxiety of manual checking by delivering time-critical government appointment slots directly to you.

## Logo Assets

All assets are in `/public/brand/`:

| File | Size | Usage |
|------|------|-------|
| `logo-wordmark-dark.png` | 93 KB | Dark backgrounds (primary) |
| `logo-wordmark.png` | 114 KB | Light backgrounds |
| `icon-512.png` | 133 KB | PWA splash, large displays |
| `icon-192.png` | 10 KB | PWA icon, small displays |
| `apple-touch-icon.png` | 9 KB | iOS home screen |
| `favicon-32.png` | 1 KB | Browser tab |
| `favicon-16.png` | 0.5 KB | Browser tab (small) |

### Usage Rules
- Always use the dark wordmark on dark backgrounds
- Minimum clear space: 16px around the logo
- Do not stretch, rotate, or recolor the logo
- The wordmark includes the full "OnAlert" text

## Color Palette

### Primary
- **Crimson**: `#9F0506`  - Brand color, CTAs, urgency
- Used for: buttons, badges, active states, alert accents

### Backgrounds
- **Near-black**: `#0A0A0A`  - App background
- **Elevated**: `#111111`  - Headers, nav
- **Surface**: `#141414`  - Cards

### Neutral
- **Text primary**: `#F5F5F5`
- **Text secondary**: `#A3A3A3`
- **Text muted**: `#666666`

## Tone of Voice

### Principles
1. **Urgent but not alarming**: Convey time-sensitivity without panic
2. **Technical but accessible**: Use clear language, avoid jargon
3. **Confident and precise**: Short, declarative statements
4. **Helpful, not pushy**: Guide users to act, don't pressure

### Examples

| Context | Good | Bad |
|---------|------|-----|
| Alert email | "Appointment slot available" | "URGENT!! BOOK NOW!!!" |
| Empty state | "No monitors yet" | "You haven't set anything up" |
| CTA | "Set up your first monitor" | "Click here to get started" |
| Time warning | "This slot appeared 15 minutes ago" | "HURRY! Time is running out!" |

## Social Media

### Open Graph Image
- Size: 1200x630px (16:9)
- Path: `/public/brand/og-image.png`
- Content: OnAlert logo + tagline on dark background
- Referenced in `index.html` meta tags

### Twitter Card
- Type: `summary_large_image`
- Same image as OG
