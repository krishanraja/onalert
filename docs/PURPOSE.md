# Purpose

## Why OnAlert Exists

The U.S. Customs and Border Protection (CBP) Trusted Traveler Programs -- Global Entry, TSA PreCheck, NEXUS, and SENTRI -- require an in-person enrollment interview at a designated center. After conditional approval, applicants often face wait times of 3-12 months at popular locations because:

1. **Limited capacity**: High-demand airports (JFK, LAX, SFO, ORD) have few interview slots per day
2. **Cancellation churn**: Slots open unpredictably when travelers cancel or reschedule
3. **No native notifications**: The CBP scheduler has no alert system -- users must manually check
4. **Speed advantage**: Open slots fill within 5-15 minutes of appearing

This creates a painful and inequitable situation: the travelers who happen to be refreshing at the right moment get appointments, while everyone else keeps waiting.

## What OnAlert Does

OnAlert automates the manual checking process and levels the playing field:

1. **Monitors** the CBP scheduler API at configurable intervals (every 10 or 60 minutes)
2. **Detects** newly available slots by comparing against last-known state
3. **Alerts** users via email (and SMS for premium) within seconds of detection
4. **Links** directly to the CBP booking page so users can act immediately

One setup. Always watching. No more manual refreshing.

## Who It's For

- **Conditionally approved applicants** for Global Entry, TSA PreCheck, NEXUS, or SENTRI
- **Frequent travelers** who need faster enrollment before an upcoming trip
- **Family coordinators** managing multiple applications across different locations
- **Anyone** tired of manually refreshing the CBP scheduler and missing slots by minutes

## Design Philosophy

- **Mobile-first**: Designed as an installable PWA for home screen access on any device
- **Urgency-driven**: Alert UI emphasizes speed -- time since alert, slot expiry warning, one-tap booking
- **Low-friction onboarding**: Google OAuth, email/password, or magic link -- sign in however you prefer
- **Dark terminal aesthetic**: Bloomberg-inspired UI that conveys precision, reliability, and authority
- **Privacy-first**: Minimal data collection, no data selling, row-level security on all user data
