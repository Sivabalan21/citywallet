import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { offerId, merchantId } = req.body
  if (!offerId) return res.status(400).json({ error: 'offerId required' })

  try {
    const { data, error } = await supabase
      .from('saved_offers')
      .update({
        redeemed_at: new Date().toISOString(),
        redeemed_by: merchantId || null,
        status: 'redeemed'
      })
      .eq('id', offerId)
      .select()
      .single()

    if (error) throw error

    // Increment merchant offer redemption count
    if (data.merchant_name) {
      const { data: merchantOffer } = await supabase
  .from('merchant_offers')
  .select('redemption_count')
  .eq('merchant_id', merchantId)
  .eq('business_name', data.merchant_name)
  .single()

if (merchantOffer) {
  await supabase
    .from('merchant_offers')
    .update({ redemption_count: (merchantOffer.redemption_count || 0) + 1 })
    .eq('merchant_id', merchantId)
    .eq('business_name', data.merchant_name)
}
    }

    return res.status(200).json({ success: true, offer: data })
  } catch (err) {
    console.error('Redeem QR error:', err)
    return res.status(500).json({ error: 'Failed to redeem offer' })
  }
}