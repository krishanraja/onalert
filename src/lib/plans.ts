export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    interval: null,
    monitors: 1,
    checkInterval: 60,
    channels: ['email'],
    features: [
      '1 active monitor',
      'Email alerts',
      'Checked every 60 minutes',
    ],
  },
  premium_monthly: {
    name: 'Premium',
    price: 19,
    interval: 'month' as const,
    monitors: Infinity,
    checkInterval: 10,
    channels: ['email', 'sms'],
    features: [
      'Unlimited monitors',
      'Email + SMS alerts',
      'Checked every 10 minutes',
      'Priority support',
    ],
  },
  premium_annual: {
    name: 'Premium Annual',
    price: 149,
    interval: 'year' as const,
    monitors: Infinity,
    checkInterval: 10,
    channels: ['email', 'sms'],
    features: [
      'Everything in Premium',
      'Save $79 vs monthly',
      '2 months free',
    ],
  },
}
