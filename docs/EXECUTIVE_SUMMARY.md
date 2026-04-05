# Executive Summary

## What is OnAlert?

OnAlert is a real-time government appointment monitoring platform that gives travelers a decisive edge. It watches CBP Trusted Traveler Program systems -- Global Entry, TSA PreCheck, NEXUS, and SENTRI -- and delivers instant notifications the moment appointment slots open from cancellations.

**Live at [onalert.app](https://onalert.app)** -- Stop checking. Start knowing.

## The Problem

Every year, millions of conditionally approved travelers are stuck in a frustrating loop: manually refreshing the CBP scheduler dozens of times per day, hoping to catch a cancellation slot that fills within minutes of appearing. Popular enrollment centers like JFK, LAX, and SFO routinely show wait times of 3-12 months. The CBP system offers zero notification capability -- if you're not looking at the exact right moment, you miss it.

## The Solution

OnAlert eliminates the guesswork entirely. It polls the CBP scheduler API every 5 minutes (paid) or 60 minutes (free), detects newly available slots through intelligent state comparison, and delivers branded email alerts within seconds -- complete with a direct booking link. Users act before the slot fills again, turning months of waiting into days.

## Business Model

OnAlert uses a one-time payment model aligned with how users actually use the product: they need monitoring until they book their appointment, then they're done. No subscriptions, no recurring charges, no cancellation friction.

| Tier | Price | Model | Monitors | Check Frequency | Alert Delivery | Window |
|------|-------|-------|----------|-----------------|----------------|--------|
| Free | $0 | Free | 1 (3 locations) | Every 60 min | Delayed 15 min | 7 days |
| Pro | $39 | One-time | 1 (unlimited) | Every 5 min | Instant | Forever |
| Multi | $59 | One-time | Up to 5 | Every 5 min | Instant | Forever |

**ROI**: Slots fill in 5-15 minutes. Free tier proves the product works but can't catch slots fast enough. $39 once gets instant alerts that actually land before the slot fills.

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui | Fast, type-safe, component-driven |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions, Realtime) | Full backend in one platform with RLS |
| Payments | Stripe (one-time payments via Checkout) | Industry-standard, no subscription overhead |
| Email | Resend (transactional alerts) | Developer-first email delivery |
| Hosting | Vercel (static SPA + global CDN) | Zero-config deploys, edge performance |
| PWA | Workbox service worker, installable on mobile | Native app feel, no app store needed |

## Key Metrics

| Metric | Target |
|--------|--------|
| Slot detection latency | <5 minutes (paid) |
| Alert delivery latency | <30 seconds after detection |
| Alert delivery rate | >99% |
| Polling success rate | >98% |
| Target uptime | 99.9% |

## Competitive Advantage

OnAlert is purpose-built for a single job: catching government appointment cancellations. Unlike generic monitoring tools, Reddit threads, or abandoned side projects, OnAlert offers real-time API polling, instant multi-channel notifications, and a mobile-first PWA experience -- all backed by honest one-time pricing that aligns with how users actually use the product.
