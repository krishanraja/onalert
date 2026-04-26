import { useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { Users, Building2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/hooks/useProfile'
import { PageHeader } from '@/components/layout/PageHeader'

export function OrganizationPage() {
  const navigate = useNavigate()
  const { profile, loading: profileLoading } = useProfile()
  const [org, setOrg] = useState<{ id: string; name: string; seats: number } | null>(null)
  const [members, setMembers] = useState<{ id: string; user_id: string; joined_at: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase || !profile?.organization_id) {
      const t = setTimeout(() => setLoading(false), 0)
      return () => clearTimeout(t)
    }

    async function load() {
      const { data: orgData } = await supabase!
        .from('organizations')
        .select('id, name, seats')
        .eq('id', profile!.organization_id)
        .single()

      if (orgData) {
        setOrg(orgData)
        const { data: memberData } = await supabase!
          .from('organization_members')
          .select('id, user_id, joined_at')
          .eq('organization_id', orgData.id)

        setMembers(memberData || [])
      }
      setLoading(false)
    }

    load()
  }, [profile?.organization_id])

  // Gate the page to users who actually belong to an organization. Profile
  // still loading? Render nothing for a tick. No org? Bounce to /app.
  if (profileLoading) return null
  if (!profile?.organization_id) {
    return <Navigate to="/app" replace />
  }

  return (
    <div className="min-h-dvh bg-background pb-24">
      <PageHeader
        title="Organization"
        onBack={() => navigate('/app/settings')}
        maxWidthClassName=""
      />

      <main className="px-4 py-5 max-w-2xl mx-auto space-y-6">
        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-surface-muted rounded w-1/3" />
            <div className="h-20 bg-surface-muted rounded" />
          </div>
        ) : org ? (
          <>
            <div className="bg-surface border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-primary" />
                <h2 className="text-base font-semibold text-foreground">{org.name}</h2>
              </div>
              <p className="text-xs text-foreground-muted">
                {members.length} / {org.seats} seats used
              </p>
            </div>

            <section>
              <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                Members
              </h3>
              <div className="space-y-2">
                {members.map((m) => (
                  <div key={m.id} className="bg-surface border border-border rounded-lg px-3 py-2 flex items-center justify-between">
                    <span className="text-xs font-mono text-foreground">{m.user_id.slice(0, 8)}...</span>
                    <span className="text-xs text-foreground-muted">
                      Joined {new Date(m.joined_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
              {/* TODO: invite flow — endpoint and email template not built yet */}
            </section>
          </>
        ) : (
          <div className="text-center py-8">
            <Building2 className="w-8 h-8 text-foreground-muted mx-auto mb-2" />
            <p className="text-sm text-foreground-muted mb-1">No organization</p>
            <p className="text-xs text-foreground-muted">
              Group plans are available for companies that sponsor Global Entry for employees.
            </p>
            <a href="mailto:support@onalert.app" className="text-xs text-primary mt-3 inline-block">
              Contact us for group pricing
            </a>
          </div>
        )}
      </main>
    </div>
  )
}
