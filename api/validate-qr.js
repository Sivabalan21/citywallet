import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { qrData, merchantId } = req.body
  if (!qrData) return res.status(400).json({ error: 'qrData required' })

  try {
    let parsed
    try {
      parsed = JSON.parse(qrData)
    } catch {
      return res.status(200).json({ valid: false, reason: 'Invalid QR code format' })
    }

    // Check expiry
    if (parsed.expires_at && new Date(parsed.expires_at) < new Date()) {
      return res.status(200).json({ valid: false, reason: 'This offer has expired' })
    }

    // Find the offer in DB
    const { data: offer, error } = await supabase
      .from('saved_offers')
      .select('*')
      .eq('qr_data', qrData)
      .single()

    if (error || !offer) {
      return res.status(200).json({ valid: false, reason: 'QR code not found' })
    }

    // Check if already redeemed
    if (offer.redeemed_at) {
      return res.status(200).json({
        valid: false,
        reason: 'This offer has already been redeemed',
        redeemed_at: offer.redeemed_at
      })
    }

    return res.status(200).json({
      valid: true,
      offer: {
        id: offer.id,
        merchant_name: offer.merchant_name,
        offer_text: offer.offer_text,
        claimed_at: offer.claimed_at
      }
    })
  } catch (err) {
    console.error('Validate QR error:', err)
    return res.status(500).json({ error: 'Failed to validate QR' })
  }
}