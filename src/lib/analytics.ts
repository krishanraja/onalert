/**
 * Humblytics Analytics Integration
 * 
 * Provides custom event tracking for key user actions.
 * The base script is loaded in index.html.
 */

declare global {
  interface Window {
    hmbl?: {
      track: (event: string, properties?: Record<string, unknown>) => void
    }
  }
}

/**
 * Track a custom event with optional properties.
 * Safe to call even if Humblytics hasn't loaded yet.
 */
export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.hmbl?.track) {
    window.hmbl.track(event, properties)
  }
}

/**
 * Pre-defined event names for consistency across the app.
 * Use these constants instead of raw strings.
 */
export const AnalyticsEvents = {
  // Monitor events
  MONITOR_CREATED: 'monitor_created',
  MONITOR_DELETED: 'monitor_deleted',
  MONITOR_PAUSED: 'monitor_paused',
  
  // Alert events
  ALERT_VIEWED: 'alert_viewed',
  ALERT_MARKED_READ: 'alert_marked_read',
  
  // Conversion events
  UPGRADE_CLICKED: 'upgrade_clicked',
  CHECKOUT_STARTED: 'checkout_started',
  
  // Auth events
  SIGNUP_SUBMITTED: 'signup_submitted',
  SIGNIN_COMPLETED: 'signin_completed',
  SIGNOUT_COMPLETED: 'signout_completed',
  
  // Engagement events
  PAGE_VIEW: 'page_view',
  CTA_CLICKED: 'cta_clicked',
} as const

export type AnalyticsEvent = typeof AnalyticsEvents[keyof typeof AnalyticsEvents]
