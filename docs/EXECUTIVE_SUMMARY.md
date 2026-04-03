# Executive Summary

## What is OnAlert?

OnAlert is a real-time government appointment monitoring platform that gives travelers a decisive edge. It watches CBP Trusted Traveler Program systems -- Global Entry, TSA PreCheck, NEXUS, and SENTRI -- and delivers instant notifications the moment appointment slots open from cancellations.

**Live at [onalert.app](https://onalert.app)** -- Stop checking. Start knowing.

## The Problem

Every year, millions of conditionally approved travelers are stuck in a frustrating loop: manually refreshing the CBP scheduler dozens of times per day, hoping to catch a cancellation slot that fills within minutes of appearing. Popular enrollment centers like JFK, LAX, and SFO routinely show wait times of 3-12 months. The CBP system offers zero notification capability -- if you're not looking at the exact right moment, you miss it.

## The Solution

OnAlert eliminates the guesswork entirely. It polls the CBP scheduler API every 10 minutes (premium) or 60 minutes (free), detects newly available slots through intelligent state comparison, and delivers branded email alerts within seconds -- complete with a direct booking link. Users act before the slot fills again, turning months of waiting into days.

## Business Model

| Tier | Price | Monitors | Check Frequency | Channels |
|------|-------|----------|-----------------|----------|
| Free | $0/month | 1 | Every 60 min | Email |
| Premium Monthly | $19/month | Unlimited | Every 10 min | Email + SMS |
| Premium Annual | $149/year | Unlimited | Every 10 min | Email + SMS |

**ROI**: A single caught appointment saves weeks or months of waiting. $19/month is trivial compared to the value of having Global Entry on your next international trip.

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui | Fast, type-safe, component-driven |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions, Realtime) | Full backend in one platform with RLS |
| Payments | Stripe (subscriptions via Checkout + Customer Portal) | Industry-standard billing |
| Email | Resend (transactional alerts) | Developer-first email delivery |
| Hosting | Vercel (static SPA + global CDN) | Zero-config deploys, edge performance |
| PWA | Workbox service worker, installable on mobile | Native app feel, no app store needed |

## Key Metrics

| Metric | Target |
|--------|--------|
| Slot detection latency | <10 minutes (premium) |
| Alert delivery latency | <30 seconds after detection |
| Alert delivery rate | >99% |
| Polling success rate | >98% |
| Target uptime | 99.9% |

## Competitive Advantage

OnAlert is purpose-built for a single job: catching government appointment cancellations. Unlike generic monitoring tools, Reddit threads, or abandoned side projects, OnAlert offers real-time API polling, instant multi-channel notifications, and a mobile-first PWA experience -- all backed by a transparent freemium model.
