import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { merchantId } = req.query
    if (!merchantId) return res.status(400).json({ error: 'merchantId required' })

    try {
      const { data, error } = await supabase
        .from('merchant_offers')
        .select('*')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return res.status(200).json({ offers: data })
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch offers' })
    }
  }

  if (req.method === 'POST') {
    const {
      merchantId,
      business_name,
      business_address,
      business_lat,
      business_lng,
      business_category,
      offer_text,
      description,
      valid_until
    } = req.body

    if (!merchantId || !offer_text) {
      return res.status(400).json({ error: 'merchantId and offer_text required' })
    }

    try {
      const { data, error } = await supabase
        .from('merchant_offers')
        .insert({
          merchant_id: merchantId,
          business_name,
          business_address,
          business_lat,
          business_lng,
          business_category,
          offer_text,
          description,
          valid_until: valid_until || null,
          is_active: true
        })
        .select()
        .single()

      if (error) throw error
      return res.status(200).json({ offer: data })
    } catch (err) {
      console.error('Create offer error:', err)
      return res.status(500).json({ error: 'Failed to create offer' })
    }
  }

  if (req.method === 'PATCH') {
    const { offerId, is_active } = req.body
    if (!offerId) return res.status(400).json({ error: 'offerId required' })

    try {
      const { data, error } = await supabase
        .from('merchant_offers')
        .update({ is_active })
        .eq('id', offerId)
        .select()
        .single()

      if (error) throw error
      return res.status(200).json({ offer: data })
    } catch (err) {
      return res.status(500).json({ error: 'Failed to update offer' })
    }
  }

  if (req.method === 'DELETE') {
    const { offerId } = req.body
    if (!offerId) return res.status(400).json({ error: 'offerId required' })

    try {
      const { error } = await supabase
        .from('merchant_offers')
        .delete()
        .eq('id', offerId)

      if (error) throw error
      return res.status(200).json({ success: true })
    } catch (err) {
      return res.status(500).json({ error: 'Failed to delete offer' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}