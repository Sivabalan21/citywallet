import { supabase } from './_lib/supabase.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId } = req.query

  if (!userId) {
    return res.status(400).json({ error: 'userId required' })
  }

  try {
    const { data, error } = await supabase
      .from('saved_offers')
      .select('*')
      .eq('user_id', userId)
      .order('saved_at', { ascending: false })

    if (error) throw error

    return res.status(200).json({ offers: data })
  } catch (err) {
    console.error('Saved offers error:', err)
    return res.status(500).json({ error: 'Failed to fetch saved offers' })
  }
}