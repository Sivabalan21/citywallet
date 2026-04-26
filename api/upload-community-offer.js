import { createClient } from '@supabase/supabase-js'
import { extractOfferFromImage } from './_lib/agent.js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const {
    imageBase64,
    mimeType,
    userId,
    lat,
    lng,
    neighborhood,
    manualMerchant,
    manualAddress
  } = req.body

  if (!imageBase64 || !userId) {
    return res.status(400).json({ error: 'imageBase64 and userId required' })
  }

  if (!manualMerchant || !manualMerchant.trim()) {
    return res.status(400).json({ error: 'Merchant name is required' })
  }

  try {
    // Step 1 — AI extracts offer from image
    const extracted = await extractOfferFromImage(imageBase64, mimeType || 'image/jpeg')

    if (!extracted.is_valid_offer) {
      return res.status(200).json({
        success: false,
        message: 'No valid offer found in this image. Try a clearer photo of a deal or discount.'
      })
    }

    // Step 2 — Upload image to Supabase Storage
    const fileName = `${userId}/${Date.now()}.jpg`
    const imageBuffer = Buffer.from(imageBase64, 'base64')

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('community-offers')
      .upload(fileName, imageBuffer, {
        contentType: mimeType || 'image/jpeg',
        upsert: false
      })

    if (uploadError) console.error('Upload error:', uploadError)

    const imageUrl = uploadData
      ? `${process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL}/storage/v1/object/public/community-offers/${fileName}`
      : null

    // Step 3 — Use manual inputs (required) over AI extracted
    const finalMerchantName = manualMerchant.trim()
    const finalAddress = manualAddress?.trim() || neighborhood || 'NYC'

    // Step 4 — Save to community_offers table
    const { data, error } = await supabase
      .from('community_offers')
      .insert({
        user_id: userId,
        image_url: imageUrl,
        merchant_name: finalMerchantName,
        merchant_address: finalAddress,
        offer_text: extracted.offer_text,
        category: extracted.category || 'food',
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        ai_verified: true,
        ai_confidence: extracted.confidence || 0.7,
        status: 'verified'
      })
      .select()
      .single()

    if (error) throw error

    return res.status(200).json({
      success: true,
      offer: data,
      message: 'Offer verified and added to the community feed!'
    })
  } catch (err) {
    console.error('Community upload error:', err)
    return res.status(500).json({ error: 'Failed to process offer' })
  }
}