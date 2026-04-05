import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, Plus, Building2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/hooks/useProfile'

export function OrganizationPage() {
  const navigate = useNavigate()
  const { profile } = useProfile()
  const [org, setOrg] = useState<{ id: string; name: string; seats: number } | null>(null)
  const [members, setMembers] = useState<{ id: string; user_id: string; joined_at: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase || !profile?.organization_id) {
      setLoading(false)
      return
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

  return (
    <div className="min-h-dvh bg-background pb-24">
      <header className="sticky top-0 z-10 bg-background-elevated border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/app/settings')} className="p-1 text-foreground-muted hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Organization</h1>
        </div>
      </header>

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
              {members.length < org.seats && (
                <button className="mt-3 flex items-center gap-1.5 text-xs text-primary font-medium">
                  <Plus className="w-3.5 h-3.5" />
                  Invite member
                </button>
              )}
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
