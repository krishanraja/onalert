# Branding

## Brand Identity

**OnAlert** -- Real-time government appointment monitoring.

### Tagline
> Stop checking. Start knowing.

### Brand Promise
Instant awareness when opportunity strikes. OnAlert eliminates the anxiety of manual checking by delivering time-critical government appointment slots directly to you -- within minutes, not hours or days.

### Brand Personality
- **Authoritative**: Bloomberg-terminal aesthetic signals expertise and precision
- **Urgent but calm**: Conveys time-sensitivity without inducing panic
- **Trustworthy**: Dark, minimal design with no visual noise -- the data speaks
- **Modern**: Clean typography, smooth animations, mobile-first polish

## Logo Assets

All brand assets are in `/public/`:

| File | Size | Usage |
|------|------|-------|
| `logo-wordmark-dark.png` | Full wordmark | Dark backgrounds (primary use) |
| `logo-wordmark.png` | Full wordmark | Light backgrounds |
| `icon-512.png` | 512x512px | PWA splash screen, large displays |
| `icon-192.png` | 192x192px | PWA icon, small displays |
| `apple-touch-icon.png` | 180x180px | iOS home screen |
| `favicon-32.png` | 32x32px | Browser tab |
| `favicon-16.png` | 16x16px | Browser tab (small) |
| `favicon.ico` | Multi-size | Universal browser fallback |

### Logo Usage Rules
- Always use the dark wordmark on dark backgrounds (#0A0A0A)
- Minimum clear space: 16px around the logo on all sides
- Do not stretch, rotate, skew, or recolor the logo
- The wordmark includes the full "OnAlert" text -- do not separate icon from text
- On the desktop navbar, the icon appears alongside navigation
- On mobile, the hero displays the logo at 3x scale for impact

## Color Palette

### Primary
- **Crimson**: `#9F0506` (HSL: 0 94% 32%) -- Brand color, CTAs, urgency indicators
- Used for: primary buttons, service badges, alert accents, active states, focus rings

### Backgrounds
- **Near-black**: `#0A0A0A` -- App background (base layer)
- **Elevated**: `#111111` -- Headers, navigation, elevated surfaces
- **Surface**: `#141414` -- Cards, panels
- **Surface muted**: `#1A1A1A` -- Hover states, secondary surfaces

### Neutral Text
- **Primary text**: `#F5F5F5` -- High contrast for readability
- **Secondary text**: `#A3A3A3` -- WCAG AA compliant on dark backgrounds
- **Muted text**: `#666666` -- Tertiary info, placeholders

### Semantic Colors
- **Success**: `#22C55E` -- Active indicators, checkmarks
- **Warning**: `#FF6B35` -- Time-sensitive slot warnings
- **Destructive**: `#EF4444` -- Delete actions, errors

## Tone of Voice

### Principles
1. **Urgent but not alarming**: Convey time-sensitivity without panic or pressure
2. **Technical but accessible**: Use clear language; avoid jargon unless speaking to developers
3. **Confident and precise**: Short, declarative statements that build trust
4. **Helpful, not pushy**: Guide users to act with clear CTAs, never guilt or FOMO tactics

### Copy Examples

| Context | Good | Bad |
|---------|------|-----|
| Alert email subject | "Appointment slot available at JFK" | "URGENT!! BOOK NOW!!!" |
| Empty state | "No monitors yet" | "You haven't set anything up" |
| CTA | "Set up your first monitor" | "Click here to get started now!" |
| Time warning | "This slot appeared 15 minutes ago" | "HURRY! Time is running out!" |
| Upgrade prompt | "Get 6x faster alerts" | "You're missing out on premium!" |
| Error message | "Something went wrong. Try again." | "FATAL ERROR" |

## Social Media & SEO

### Open Graph
- Image size: 1200x630px (16:9 ratio)
- Content: OnAlert logo + tagline on dark #0A0A0A background
- Referenced in `index.html` meta tags

### Twitter Card
- Type: `summary_large_image`
- Shares the same OG image

### Meta Description
"OnAlert monitors CBP Trusted Traveler Program schedulers and alerts you when appointment slots open. Get your Global Entry, TSA PreCheck, NEXUS, or SENTRI interview faster."
