import { useState, useEffect } from 'react'
import { supabase, type Profile } from '@/lib/supabase'

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function load() {
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

  return { profile, loading, isPremium: profile?.plan === 'premium' }
}
