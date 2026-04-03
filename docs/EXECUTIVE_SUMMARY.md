# Executive Summary

## What is OnAlert?

OnAlert is a real-time government appointment monitoring service. It watches CBP Trusted Traveler Program systems (Global Entry, TSA PreCheck, NEXUS, SENTRI) and instantly notifies users when appointment slots open — typically from cancellations.

## The Problem

Millions of approved travelers wait months for enrollment interviews because appointment slots at popular locations fill within minutes of becoming available. Users must manually refresh the CBP scheduler dozens of times per day hoping to catch a cancellation.

## The Solution

OnAlert polls the CBP scheduler API every 10 minutes (premium) or 60 minutes (free), detects newly available slots, and delivers email alerts within seconds. Users receive a direct booking link and act before the slot fills again.

## Business Model

- **Free tier**: 1 monitor, email alerts, 60-minute check interval
- **Premium ($19/month or $149/year)**: Unlimited monitors, email + SMS alerts, 10-minute checks, priority support

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions) |
| Payments | Stripe (subscriptions via Checkout) |
| Email | Resend (transactional email) |
| Hosting | Vercel (static SPA) |
| PWA | Service worker, installable on mobile |

## Key Metrics

- Appointment slot detection latency: <10 minutes (premium)
- Alert delivery latency: <30 seconds after detection
- Target uptime: 99.9%
