// Centralized haptic feedback engine
// Named patterns for consistent tactile feedback across the app

type HapticPattern = number | number[]

const PATTERNS: Record<string, HapticPattern> = {
  // Navigation & selection
  tap: 15,
  selection: 30,
  navigation: [20, 10, 20],

  // Success states
  success: [50, 30, 50],
  monitorCreated: [50, 30, 50, 30, 80],

  // Alert states
  alertArrival: [100, 50, 100],
  urgentAlert: [150, 50, 150, 50, 200],

  // Interaction feedback
  pullThreshold: 40,
  pullRelease: [30, 20, 30],
  swipeAction: [20, 15, 40],

  // Error / warning
  warning: [60, 30, 60],
  error: [100, 50, 100, 50, 100],
}

export function haptic(pattern: keyof typeof PATTERNS): void {
  if (!('vibrate' in navigator)) return
  try {
    const p = PATTERNS[pattern]
    if (p !== undefined) {
      navigator.vibrate(Array.isArray(p) ? p : [p])
    }
  } catch {
    // Silently fail - vibration is enhancement only
  }
}

export function hapticRaw(pattern: number[]): void {
  if (!('vibrate' in navigator)) return
  try {
    navigator.vibrate(pattern)
  } catch {
    // Silently fail
  }
}
