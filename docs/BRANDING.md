# Branding

## Brand identity

**OnAlert** — Real-time CBP appointment alerts for Trusted Traveler enrollment.

### Tagline
> Stop checking. Start knowing.

### Brand promise
Instant awareness when opportunity strikes. OnAlert eliminates the anxiety of manual checking by delivering time-critical CBP enrollment slots to you within minutes — across email, SMS, web push, and an in-app realtime feed — with a one-tap booking link directly into the CBP scheduler.

### Brand personality
- **Authoritative.** Bloomberg-terminal aesthetic signals expertise and precision
- **Urgent but calm.** Conveys time-sensitivity without inducing panic
- **Trustworthy.** Dark, minimal design with no visual noise — the data speaks
- **Modern.** Clean typography, considered animations, mobile-first polish
- **Honest.** One-time pricing, transparent limits, no dark patterns

### What we are not
- Not flashy or hype-y. No "URGENT!!" copy, no countdown timers in marketing
- Not a "consumer travel app" aesthetic. No bright pastels, no illustrated mascots
- Not a generic "monitoring SaaS" template. The crimson + dark + monospace combo is intentional and consistent

## Logo & icon assets

| File | Format | Usage |
|------|--------|-------|
| `public/brand/onalert-wordmark-dark.*` | Wordmark | Dark backgrounds (primary) |
| `public/brand/onalert-wordmark-light.*` | Wordmark | Light backgrounds (rare) |
| `public/icon-512.png` | 512×512 | PWA splash, large displays |
| `public/icon-192.png` | 192×192 | PWA icon, small displays |
| `public/apple-touch-icon.png` | 180×180 | iOS home screen |
| `public/favicon.ico` | Multi-size | Universal browser fallback |
| `public/cbp-logo.png` | Government seal | Trust signal on landing page |
| `public/dhs-logo.png` | Government seal | Trust signal on landing page |

### Logo usage rules
- Always use the dark wordmark on dark backgrounds (`#0A0A0A`)
- Minimum clear space: 16px on all sides
- Do not stretch, rotate, skew, or recolor
- Do not separate the icon from the "OnAlert" text in marketing
- Mobile hero displays the icon at 3× scale for impact; desktop navbar shows the full wordmark

## Color palette (canonical — verify against `src/index.css`)

### Primary (the "OnAlert crimson")
- **Crimson**: `#9F0506` — HSL `0 94% 32%`
- Used for: primary CTAs, service badges, alert accents, active nav, focus rings, brand headers in email
- Reserved as the "this matters" color — never used for decorative chrome

### Backgrounds
| Token | Hex | Usage |
|-------|-----|-------|
| `--background` | `#0A0A0A` | Page background |
| `--background-elevated` | `#111111` | Headers, nav, elevated surfaces |
| `--surface` | `#1A1A1A` | Cards, panels |
| `--surface-muted` | `#141414` | Hover, secondary surfaces |
| `--surface-elevated` | `#1F1F1F` | Buttons, input backgrounds |

### Foregrounds
| Token | Hex | Usage |
|-------|-----|-------|
| `--foreground` | `#F5F5F5` | Primary text |
| `--foreground-secondary` | `#A3A3A3` | Secondary text — WCAG AA 5.74:1 |
| `--foreground-muted` | `#808080` | Muted/tertiary text — WCAG AA 5.39:1 |

### Semantic
| Token | Hex | Usage |
|-------|-----|-------|
| `--success` | `#27AE60` | Active state, checkmarks |
| `--warning` | `#FFBA00` | Time-sensitive slot warnings |
| `--destructive` | `#FF5454` | Delete, errors |
| `--alert` | `#9F0506` | Alert accents (same as primary) |

### Borders & rings
| Token | Hex | Usage |
|-------|-----|-------|
| `--border` | `#383838` | Card borders (lifted from #2A2A2A in the April 2026 design-token cleanup for 2.0:1 visibility ratio) |
| `--ring` | `#9F0506` | Focus ring (crimson) |

## Tone of voice

### Principles
1. **Urgent but never alarmist.** Convey time-sensitivity with facts, not exclamation points.
2. **Technical but accessible.** Use plain language; reach for jargon only when speaking to developers.
3. **Confident and precise.** Short, declarative statements. Numbers, not adjectives.
4. **Helpful, not pushy.** Guide users to act with clear CTAs. Never guilt or FOMO.
5. **Honest about limits.** Tell users what we can and can't do. Don't promise an interview — promise the alert.

### Copy examples

| Context | ✅ Good | ❌ Bad |
|---------|--------|-------|
| Alert email subject | "Global Entry slot at JFK — Mon Apr 15 2:30 PM" | "URGENT!! BOOK NOW!!!" |
| Empty state | "No monitors yet" | "You haven't set anything up yet!" |
| CTA | "Set up your first monitor" | "Click here to get started now!" |
| Time warning | "This slot appeared 15 minutes ago" | "HURRY! Time is running out!" |
| Upgrade prompt | "Pro polls every 5 minutes — 12× faster" | "Don't miss out on premium!" |
| Error | "Couldn't reach Stripe. Try again." | "FATAL ERROR" |
| Success | "Monitor saved. We'll alert you the moment a slot opens." | "🎉 You're all set!" |

### Voice when speaking AS OnAlert (for marketing AI agents)

- Speak in second person to the reader ("you", not "users")
- Lead with the customer's problem, not our features
- Quote anchor stats from [VALUE_PROP.md](./VALUE_PROP.md): "5–15 minutes", "60× faster", "$39 once"
- Default sentence length: short. Mix lengths for rhythm. Never write a wall of text.
- Avoid AI-tell patterns: no "delve", "navigate", "unleash", "leverage", "seamlessly", "harness", "unlock", or "elevate"
- Avoid em dashes in customer-facing copy if it isn't natural — they read AI-y at scale
- Use the Oxford comma. Use plain English. Use periods.

## Social media & SEO

### Open Graph
- Image size: 1200×630 (1.91:1)
- Content: OnAlert wordmark + tagline on `#0A0A0A` with subtle crimson accent
- Set in `index.html` meta tags

### Twitter Card
- Type: `summary_large_image`
- Same image as Open Graph

### Default meta description
"OnAlert monitors the CBP Trusted Traveler scheduler 24/7 and alerts you within minutes when a Global Entry, NEXUS, or SENTRI interview slot opens from a cancellation. One-time payment, no subscription."

### Per-page SEO
Each route sets its own title + description via `react-helmet-async` (added in `10d876e` to fix Google Search Console indexing). New pages must follow the same pattern; the public locations and wait-times pages are the SEO surface area for organic acquisition.

## When in doubt

- Use the crimson sparingly. If everything is crimson, nothing is.
- Default to dark. Light surfaces should feel like the exception.
- Quote a number instead of an adjective.
- Show the alert speed, don't claim it. ("5-min polling. 60-second polling on Express.")
- Speak to the moment of pain, not the feature spec.
