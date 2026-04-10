import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, CheckCircle } from 'lucide-react'

const PROGRAMS = {
  GE: {
    name: 'Global Entry',
    documents: [
      'Valid passport (not expired)',
      'Permanent resident card (if applicable)',
      'Conditional approval letter or confirmation number',
      'Government-issued photo ID (driver\'s license)',
    ],
    tips: [
      'Arrive 15 minutes early for your appointment',
      'You will be fingerprinted and photographed',
      'The interview typically lasts 5-10 minutes',
      'Answer questions honestly and directly',
      'Declare any prior customs violations',
      'Your Global Entry card will be mailed within 2-3 weeks',
    ],
    expect: 'A CBP officer will review your application, ask about your travel history, verify your identity, and collect biometrics. Most interviews are straightforward and take under 10 minutes.',
  },
  NEXUS: {
    name: 'NEXUS',
    documents: [
      'Valid passport',
      'Proof of residency (utility bill, bank statement)',
      'Conditional approval confirmation',
      'Government-issued photo ID',
    ],
    tips: [
      'NEXUS interviews require approval from both US and Canadian authorities',
      'You will be interviewed by both a CBP and CBSA officer',
      'Bring documentation of your cross-border travel history',
      'Your NEXUS card serves as a passport alternative for US-Canada travel',
    ],
    expect: 'You will be interviewed by both a US Customs and Border Protection officer and a Canada Border Services Agency officer. Each will ask about your travel history and reasons for applying.',
  },
  SENTRI: {
    name: 'SENTRI',
    documents: [
      'Valid passport',
      'Vehicle registration and insurance (if enrolling a vehicle)',
      'Conditional approval confirmation',
      'Government-issued photo ID',
    ],
    tips: [
      'SENTRI is specifically for US-Mexico border crossings',
      'Vehicle enrollment requires a separate inspection',
      'Bring all vehicle documentation if enrolling a vehicle',
      'SENTRI includes TSA PreCheck benefits',
    ],
    expect: 'A CBP officer will verify your identity, review your application, collect biometrics, and ask about your cross-border travel patterns. Vehicle enrollment involves a separate vehicle inspection.',
  },
}

type ProgramKey = keyof typeof PROGRAMS

export function InterviewPrepPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<ProgramKey>('GE')
  const program = PROGRAMS[activeTab]

  return (
    <div className="h-full bg-background flex flex-col">
      <header className="bg-background-elevated border-b border-border px-4 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 text-foreground-muted hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Interview Prep</h1>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-border overflow-x-auto shrink-0">
        {(Object.keys(PROGRAMS) as ProgramKey[]).map((key) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === key
                ? 'text-primary border-b-2 border-primary'
                : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            {PROGRAMS[key].name}
          </button>
        ))}
      </div>

      <main className="flex-1 overflow-y-auto px-4 py-5 max-w-2xl mx-auto space-y-6">
        {/* What to expect */}
        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2">What to Expect</h2>
          <p className="text-xs text-foreground-secondary leading-relaxed">{program.expect}</p>
        </section>

        {/* Documents */}
        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-primary" />
            Documents to Bring
          </h2>
          <div className="space-y-2">
            {program.documents.map((doc, i) => (
              <label key={i} className="flex items-start gap-2 bg-surface border border-border rounded-lg px-3 py-2">
                <input type="checkbox" className="mt-0.5 accent-primary" />
                <span className="text-xs text-foreground">{doc}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Tips */}
        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-success" />
            Tips for Success
          </h2>
          <ul className="space-y-2">
            {program.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-foreground-secondary">
                <span className="text-foreground-muted mt-0.5">-</span>
                {tip}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  )
}
