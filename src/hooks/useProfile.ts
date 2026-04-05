import { useState, useEffect, useCallback } from 'react'
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

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!supabase || !profile) return

    const previous = profile
    setProfile({ ...profile, ...updates })

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile.id)

    if (error) {
      setProfile(previous)
      throw error
    }
  }, [profile])

  const isPaid = profile?.plan === 'pro' || profile?.plan === 'family' || profile?.plan === 'multi' || profile?.plan === 'express'
  const isFamily = profile?.plan === 'family' || profile?.plan === 'multi'
  const isExpress = profile?.plan === 'express'

  return { profile, loading, isPaid, isFamily, isExpress, updateProfile }
}
