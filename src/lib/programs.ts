import type { ServiceType } from './locations'

export type JourneyStep = {
  label: string
  detail: string
  url?: string
  isOnAlertStep?: boolean
}

export type ProgramInfo = {
  name: string
  abbr: string
  tagline: string
  whatItIs: string
  whoItsFor: string
  cost: string
  validity: string
  applicationUrl: string
  prerequisite: string
  whatOnAlertDoes: string
  bookingSteps: string[]
  journeySteps: JourneyStep[]
}

export const PROGRAMS: Record<ServiceType, ProgramInfo> = {
  GE: {
    name: 'Global Entry',
    abbr: 'GE',
    tagline: 'Expedited US customs for pre-approved travellers. Includes TSA PreCheck.',
    whatItIs: 'Global Entry lets pre-approved travelers skip the customs line when entering the US. It includes TSA PreCheck benefits.',
    whoItsFor: 'Frequent international travelers entering the US',
    cost: '$100',
    validity: '5 years',
    applicationUrl: 'https://ttp.cbp.dhs.gov/',
    prerequisite: 'You must apply and be conditionally approved on the CBP website before you can book an interview.',
    whatOnAlertDoes: 'OnAlert monitors for interview appointment slots at enrollment centers. These fill within minutes of opening — we alert you the moment one appears.',
    bookingSteps: [
      'Click "Book" to open the CBP Trusted Traveler site',
      'Log in to your GOES (Global Online Enrollment System) account',
      'Go to your conditionally approved application',
      'Select "Schedule Interview" and choose this time slot',
    ],
    journeySteps: [
      { label: 'Apply online', detail: 'Create a GOES account at ttp.cbp.dhs.gov and submit your application', url: 'https://ttp.cbp.dhs.gov/' },
      { label: 'Pay $100 fee', detail: 'Non-refundable application fee paid during submission' },
      { label: 'Wait for conditional approval', detail: 'CBP reviews your application — this can take weeks to months' },
      { label: 'Book an interview', detail: 'This is the hard part. Slots fill in minutes. OnAlert watches for openings and alerts you instantly.', isOnAlertStep: true },
      { label: 'Attend in-person interview', detail: 'Visit your chosen enrollment center with your passport and documents' },
      { label: 'Get approved', detail: 'If approved, you receive Global Entry + TSA PreCheck for 5 years' },
    ],
  },
  NEXUS: {
    name: 'NEXUS',
    abbr: 'NEXUS',
    tagline: 'Expedited travel between the US and Canada.',
    whatItIs: 'NEXUS provides expedited border crossing between the US and Canada at air, land, and marine ports of entry. Includes Global Entry and TSA PreCheck benefits.',
    whoItsFor: 'Frequent travelers between the US and Canada',
    cost: '$50',
    validity: '5 years',
    applicationUrl: 'https://ttp.cbp.dhs.gov/',
    prerequisite: 'You must apply and be conditionally approved by both US and Canadian authorities before you can book an interview.',
    whatOnAlertDoes: 'OnAlert monitors for interview appointment slots at NEXUS enrollment centers. These fill within minutes of opening — we alert you the moment one appears.',
    bookingSteps: [
      'Click "Book" to open the CBP Trusted Traveler site',
      'Log in to your GOES (Global Online Enrollment System) account',
      'Go to your conditionally approved application',
      'Select "Schedule Interview" and choose this time slot',
    ],
    journeySteps: [
      { label: 'Apply online', detail: 'Create a GOES account at ttp.cbp.dhs.gov and submit your application', url: 'https://ttp.cbp.dhs.gov/' },
      { label: 'Pay $50 fee', detail: 'Non-refundable application fee paid during submission' },
      { label: 'Wait for conditional approval', detail: 'Both US (CBP) and Canadian (CBSA) authorities review your application — this can take months' },
      { label: 'Book an interview', detail: 'This is the hard part. Slots fill in minutes. OnAlert watches for openings and alerts you instantly.', isOnAlertStep: true },
      { label: 'Attend in-person interview', detail: 'Visit your chosen NEXUS enrollment center with your passport and documents' },
      { label: 'Get approved', detail: 'If approved, you receive NEXUS + Global Entry + TSA PreCheck for 5 years' },
    ],
  },
  SENTRI: {
    name: 'SENTRI',
    abbr: 'SENTRI',
    tagline: 'Expedited entry at US-Mexico land border crossings.',
    whatItIs: 'SENTRI provides expedited processing at US-Mexico land border crossings through dedicated lanes. Includes Global Entry and TSA PreCheck benefits.',
    whoItsFor: 'Frequent travelers crossing the US-Mexico border',
    cost: '$122.25',
    validity: '5 years',
    applicationUrl: 'https://ttp.cbp.dhs.gov/',
    prerequisite: 'You must apply and be conditionally approved on the CBP website before you can book an interview.',
    whatOnAlertDoes: 'OnAlert monitors for interview appointment slots at SENTRI enrollment centers. These fill within minutes of opening — we alert you the moment one appears.',
    bookingSteps: [
      'Click "Book" to open the CBP Trusted Traveler site',
      'Log in to your GOES (Global Online Enrollment System) account',
      'Go to your conditionally approved application',
      'Select "Schedule Interview" and choose this time slot',
    ],
    journeySteps: [
      { label: 'Apply online', detail: 'Create a GOES account at ttp.cbp.dhs.gov and submit your application', url: 'https://ttp.cbp.dhs.gov/' },
      { label: 'Pay $122.25 fee', detail: 'Non-refundable application fee paid during submission' },
      { label: 'Wait for conditional approval', detail: 'CBP reviews your application — this can take weeks to months' },
      { label: 'Book an interview', detail: 'This is the hard part. Slots fill in minutes. OnAlert watches for openings and alerts you instantly.', isOnAlertStep: true },
      { label: 'Attend in-person interview', detail: 'Visit your chosen SENTRI enrollment center with your passport and documents' },
      { label: 'Get approved', detail: 'If approved, you receive SENTRI + Global Entry + TSA PreCheck for 5 years' },
    ],
  },
}
