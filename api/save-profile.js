import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const {
    userId,
    role,
    current_mode,
    is_merchant,
    business_name,
    business_address,
    business_category,
    business_lat,
    business_lng
  } = req.body

  if (!userId) return res.status(400).json({ error: 'userId required' })

  try {
    // Get existing profile first to preserve fields not being updated
    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    // Merge — only overwrite fields explicitly provided
    const updateData = {
      id: userId,
      role: role ?? existing?.role ?? 'customer',
      current_mode: current_mode ?? existing?.current_mode ?? 'customer',
      is_merchant: is_merchant ?? existing?.is_merchant ?? false,
      business_name: business_name ?? existing?.business_name ?? null,
      business_address: business_address ?? existing?.business_address ?? null,
      business_category: business_category ?? existing?.business_category ?? null,
      business_lat: business_lat ?? existing?.business_lat ?? null,
      business_lng: business_lng ?? existing?.business_lng ?? null
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert(updateData)
      .select()
      .single()

    if (error) throw error

    return res.status(200).json({ profile: data })
  } catch (err) {
    console.error('Save profile error:', err)
    return res.status(500).json({ error: 'Failed to save profile' })
  }
}