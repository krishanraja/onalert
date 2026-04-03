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
  pro: {
    name: 'Pro',
    price: 29,
    interval: null,
    monitors: 1,
    checkInterval: 5,
    channels: ['email', 'sms'],
    features: [
      '1 active monitor',
      'Email + SMS alerts',
      'Checked every 5 minutes',
      'Unlimited locations',
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
      'Email + SMS alerts',
      'Checked every 5 minutes',
      'Unlimited locations',
    ],
  },
}
