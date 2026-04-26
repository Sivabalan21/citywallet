import { getNearbyPlaces } from './_lib/places.js'
import { getYelpBusinesses } from './_lib/yelp.js'
import { searchDeals } from './_lib/tavily.js'
import { rankOffers } from './_lib/agent.js'
import { cacheGet, cacheSet } from './_lib/cache.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { lat, lng, neighborhood, userProfile } = req.body

  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng are required' })
  }

  // Cache key based on location grid + user categories
  const gridLat = Math.round(lat * 100) / 100
  const gridLng = Math.round(lng * 100) / 100
  const categoriesKey = userProfile?.categories?.sort().join('-') || 'general'
  const cacheKey = `offers:${gridLat}:${gridLng}:${categoriesKey}`

  // Check cache first
  const cached = await cacheGet(cacheKey)
    if (cached) {
        const cachedOffers = Array.isArray(cached) ? cached : []
        if (cachedOffers.length > 0) {
            return res.status(200).json({ offers: cachedOffers, cached: true })
        }
    }

  try {
    // Get current time context
    const now = new Date()
    const context = {
      neighborhood: neighborhood || 'New York City',
      time: now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
      weather: req.body.weather || 'Clear, 18°C'
    }

    // Fetch all data sources in parallel
    const [venues, yelpData, tavilyData] = await Promise.allSettled([
      getNearbyPlaces(lat, lng, userProfile?.categories || []),
      getYelpBusinesses(lat, lng, userProfile?.categories || []),
      searchDeals(neighborhood || 'Midtown NYC', userProfile?.categories || [])
    ])

    const resolvedVenues = venues.status === 'fulfilled' ? venues.value : []
    const resolvedYelp = yelpData.status === 'fulfilled' ? yelpData.value : []
    const resolvedTavily = tavilyData.status === 'fulfilled'
      ? tavilyData.value
      : { answer: '', results: [] }

    // Run AI agent
    const offers = await rankOffers({
      venues: resolvedVenues,
      yelpData: resolvedYelp,
      tavilyData: resolvedTavily,
      userProfile: userProfile || {},
      context
    })

    // Cache for 30 minutes
    const seen = new Set()
    const safeOffers = Array.isArray(offers) ? offers.filter(o => {
      if (!o.merchant_name || seen.has(o.merchant_name)) return false
      if (o.offer_text === 'No specific offer found') return false
      if (o.offer_text === 'No offer found') return false
      if (!o.offer_text || o.offer_text.trim() === '') return false
      if (o.confidence === 0 || o.confidence < 0.3) return false
      seen.add(o.merchant_name)
      return true
    }) : []
    await cacheSet(cacheKey, safeOffers, 1800)
    return res.status(200).json({ offers: safeOffers, cached: false })
  } catch (err) {
  console.error('Offers API error:', err)
  if (err.status === 429) {
    return res.status(429).json({ 
      error: 'AI agent is taking a short break. Please try again in a few minutes.',
      retryAfter: 60
    })
  }
  return res.status(500).json({ error: 'Failed to fetch offers' })
}
}