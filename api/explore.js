import { getNearbyPlaces } from './_lib/places.js'
import { getYelpBusinesses } from './_lib/yelp.js'
import { searchDeals } from './_lib/tavily.js'
import { rankOffers } from './_lib/agent.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { lat, lng, neighborhood, query, userProfile } = req.body

  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng are required' })
  }

  try {
    const now = new Date()
    const context = {
      neighborhood: neighborhood || 'New York City',
      time: now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
      weather: req.body.weather || 'Clear, 18°C',
      searchQuery: query
    }

    // For explore, use search query to drive categories
    const searchCategories = inferCategoriesFromQuery(query)

    const [venues, yelpData, tavilyData] = await Promise.allSettled([
      getNearbyPlaces(lat, lng, searchCategories),
      getYelpBusinesses(lat, lng, searchCategories),
      searchDeals(`${query} ${neighborhood || 'NYC'}`, searchCategories)
    ])

    const resolvedVenues = venues.status === 'fulfilled' ? venues.value : []
    const resolvedYelp = yelpData.status === 'fulfilled' ? yelpData.value : []
    const resolvedTavily = tavilyData.status === 'fulfilled'
      ? tavilyData.value
      : { answer: '', results: [] }

    const offers = await rankOffers({
      venues: resolvedVenues,
      yelpData: resolvedYelp,
      tavilyData: resolvedTavily,
      userProfile: { ...userProfile, searchQuery: query },
      context
    })

    return res.status(200).json({ offers })
  } catch (err) {
    console.error('Explore API error:', err)
    return res.status(500).json({ error: 'Failed to search offers' })
  }
}

function inferCategoriesFromQuery(query = '') {
  const q = query.toLowerCase()
  const map = {
    coffee: 'coffee', cafe: 'coffee', espresso: 'coffee',
    food: 'food', eat: 'food', lunch: 'food', dinner: 'food',
    pizza: 'food', burger: 'food', sushi: 'food',
    gym: 'fitness', workout: 'fitness', yoga: 'fitness',
    bar: 'nightlife', drinks: 'nightlife', cocktail: 'nightlife',
    shop: 'shopping', store: 'shopping', mall: 'shopping',
    fashion: 'fashion', clothes: 'fashion', nike: 'fashion',
    beauty: 'beauty', salon: 'beauty', spa: 'beauty',
    book: 'books', library: 'books'
  }

  const found = []
  for (const [keyword, category] of Object.entries(map)) {
    if (q.includes(keyword) && !found.includes(category)) {
      found.push(category)
    }
  }

  return found.length ? found : ['food', 'coffee', 'shopping']
}