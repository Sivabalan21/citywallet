import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAuth = create((set, get) => ({
  user: null,
  session: null,
  loading: true,
  profile: undefined,
  subscription: null,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user ?? null
    set({ session, user, loading: false })
    if (user) {
      await get().loadProfile(user.id)
      await get().fetchSubscription()
    } else {
      set({ profile: null, subscription: null })
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null
      set({ session, user, loading: false })
      if (user) {
        await get().loadProfile(user.id)
        await get().fetchSubscription()
      } else {
        set({ profile: null, subscription: null })
      }
    })
  },

  fetchSubscription: async () => {
    const { user } = get()
    if (!user?.email) return
    try {
      const res = await fetch(`/api/subscription-status?userEmail=${user.email}`)
      const data = await res.json()
      set({ subscription: data })
    } catch {}
  },

  loadProfile: async (userId) => {
    try {
      const res = await fetch(`/api/get-profile?userId=${userId}`)
      const data = await res.json()
      set({ profile: data.profile ?? null })
    } catch {
      set({ profile: null })
    }
  },

  saveProfile: async (profileData) => {
    const { user } = get()
    if (!user) return
    try {
      const res = await fetch('/api/save-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, ...profileData })
      })
      const data = await res.json()
      set({ profile: data.profile })
      return data.profile
    } catch (err) {
      console.error('Save profile error:', err)
    }
  },

  signInWithGoogle: async (intendedRole = 'customer') => {
    localStorage.setItem('citywallet_intended_role', intendedRole)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
  },

  signOut: async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('citywallet_intended_role')
    set({ user: null, session: null, profile: null, subscription: null })
  }
}))