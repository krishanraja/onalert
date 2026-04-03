# Purpose

## Why OnAlert Exists

The U.S. Customs and Border Protection (CBP) Trusted Traveler Programs  - Global Entry, TSA PreCheck, NEXUS, and SENTRI  - require an in-person enrollment interview at a designated center. After conditional approval, applicants often face wait times of 3–12 months at popular locations because:

1. **Limited capacity**: High-demand airports (JFK, LAX, SFO, ORD) have few interview slots per day
2. **Cancellation churn**: Slots open unpredictably when travelers cancel or reschedule
3. **No native notifications**: The CBP scheduler has no alert system  - users must manually check
4. **Speed advantage**: Open slots fill within 5–15 minutes of appearing

## What OnAlert Does

OnAlert automates the manual checking process:

1. **Monitors** the CBP scheduler API at configurable intervals
2. **Detects** newly available slots by comparing against last-known state
3. **Alerts** users via email (and SMS for premium) within seconds
4. **Links** directly to the CBP booking page so users can act immediately

## Who It's For

- Conditionally approved Global Entry / TSA PreCheck / NEXUS / SENTRI applicants
- Frequent travelers who need faster enrollment
- Anyone tired of manually refreshing the scheduler

## Design Philosophy

- **Mobile-first**: Designed as a PWA for home screen installation
- **Urgency-driven**: Alert UI emphasizes speed  - time since alert, slot expiry warning
- **Low-friction**: Magic link auth (no passwords), one-tap booking
- **Dark terminal aesthetic**: Bloomberg-inspired UI that conveys precision and reliability
