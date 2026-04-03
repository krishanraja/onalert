import { useState, useEffect } from 'react'
import { supabase, type Profile } from '@/lib/supabase'

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function load() {
      if (!supabase) { setLoading(false); return }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (mounted) {
        setProfile(data)
        setLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [])

  const isPaid = profile?.plan === 'pro' || profile?.plan === 'family'
  const isFamily = profile?.plan === 'family'

  return { profile, loading, isPaid, isFamily }
}
