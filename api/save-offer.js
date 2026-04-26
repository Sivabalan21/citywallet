import { supabase } from './_lib/supabase.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { offer, userId, action } = req.body

  if (!offer || !userId) {
    return res.status(400).json({ error: 'offer and userId required' })
  }

  try {
    // Check once-per-day claim limit for 'claim' action
    if (action === 'claim') {
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)

      const { data: existingClaim } = await supabase
        .from('saved_offers')
        .select('id, status, redeemed_at')
        .eq('user_id', userId)
        .eq('merchant_name', offer.merchant_name)
        .eq('offer_text', offer.offer_text)
        .gte('claimed_at', startOfDay.toISOString())
        .in('status', ['claimed', 'redeemed'])
        .maybeSingle()

      if (existingClaim) {
        if (existingClaim.status === 'redeemed') {
          return res.status(400).json({
            error: 'already_redeemed',
            message: 'You have already redeemed this offer today. Come back tomorrow!'
          })
        }
        if (existingClaim.status === 'claimed') {
          return res.status(400).json({
            error: 'already_claimed',
            message: 'You already have an active QR for this offer. Show it to the merchant to redeem.'
          })
        }
      }
    }

    // Check if already saved (for save action — prevent duplicates)
    if (action === 'save') {
      const { data: existingSave } = await supabase
        .from('saved_offers')
        .select('id')
        .eq('user_id', userId)
        .eq('merchant_name', offer.merchant_name)
        .eq('offer_text', offer.offer_text)
        .eq('status', 'saved')
        .maybeSingle()

      if (existingSave) {
        return res.status(400).json({
          error: 'already_saved',
          message: 'You have already saved this offer.'
        })
      }
    }

    const qrData = action === 'claim'
      ? JSON.stringify({
          id: crypto.randomUUID(),
          merchant: offer.merchant_name,
          offer: offer.offer_text,
          issued_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
      : null

    const { data, error } = await supabase
      .from('saved_offers')
      .insert({
        user_id: userId,
        merchant_name: offer.merchant_name,
        merchant_address: offer.merchant_address,
        offer_text: offer.offer_text,
        why_relevant: offer.why_relevant,
        category: offer.category,
        rating: offer.rating,
        price_level: offer.price_level,
        distance_meters: offer.distance_meters,
        lat: offer.lat,
        lng: offer.lng,
        status: action === 'claim' ? 'claimed' : 'saved',
        claimed_at: action === 'claim' ? new Date().toISOString() : null,
        qr_data: qrData
      })
      .select()
      .single()

    if (error) throw error

    return res.status(200).json({ success: true, offer: data })
  } catch (err) {
    console.error('Save offer error:', err)
    return res.status(500).json({ error: 'Failed to save offer' })
  }
}