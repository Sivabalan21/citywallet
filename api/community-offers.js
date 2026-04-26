import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { lat, lng, radius = 2000 } = req.query

  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng required' })
  }

  try {
    const { data, error } = await supabase
      .from('community_offers')
      .select('*')
      .eq('status', 'verified')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    const userLat = parseFloat(lat)
    const userLng = parseFloat(lng)
    const maxRadius = parseFloat(radius)

    const nearby = data.filter(offer => {
      // If offer has coordinates, filter by distance
      if (offer.lat && offer.lng) {
        const distance = getDistance(userLat, userLng, offer.lat, offer.lng)
        return distance <= maxRadius
      }
      // If no coordinates stored, include it (neighborhood level match)
      return true
    })

    return res.status(200).json({ offers: nearby })
  } catch (err) {
    console.error('Community offers error:', err)
    return res.status(500).json({ error: 'Failed to fetch community offers' })
  }
}

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}