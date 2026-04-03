export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    interval: null,
    monitors: 1,
    checkInterval: 60,
    channels: ['email'],
    features: [
      '1 monitor, 3 locations',
      'Checked every 60 minutes',
      'Email alerts delayed 15 min',
      '7-day monitoring window',
    ],
  },
  pro: {
    name: 'Pro',
    price: 29,
    interval: null,
    monitors: 1,
    checkInterval: 5,
    channels: ['email', 'sms'],
    features: [
      '1 monitor, unlimited locations',
      'Checked every 5 minutes',
      'Instant email + SMS alerts',
      'Monitors never expire',
    ],
  },
  family: {
    name: 'Family',
    price: 49,
    interval: null,
    monitors: 5,
    checkInterval: 5,
    channels: ['email', 'sms'],
    features: [
      'Up to 5 monitors',
      'Checked every 5 minutes',
      'Instant email + SMS alerts',
      'Monitors never expire',
    ],
  },
}
