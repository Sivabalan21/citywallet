const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY

export async function getNearbyPlaces(lat, lng, categories = []) {
  const radius = 500
  const types = mapCategoriesToTypes(categories)
  const results = []

  for (const type of types.slice(0, 3)) {
    try {
      const url = `https://places.googleapis.com/v1/places:searchNearby`
      const body = {
        includedTypes: [type],
        maxResultCount: 8,
        locationRestriction: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius
          }
        }
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_API_KEY,
          'X-Goog-FieldMask': [
            'places.id',
            'places.displayName',
            'places.formattedAddress',
            'places.rating',
            'places.priceLevel',
            'places.types',
            'places.location',
            'places.currentOpeningHours',
            'places.editorialSummary',
            'places.reviews'
          ].join(',')
        },
        body: JSON.stringify(body)
      })

      const data = await res.json()
      if (data.places) results.push(...data.places)
    } catch (err) {
      console.error('Places API error:', err)
    }
  }

  // deduplicate by place id
  const seen = new Set()
  return results.filter(p => {
    if (seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })
}

function mapCategoriesToTypes(categories) {
  const map = {
    food: 'restaurant',
    coffee: 'cafe',
    fashion: 'clothing_store',
    fitness: 'gym',
    nightlife: 'bar',
    shopping: 'shopping_mall',
    beauty: 'beauty_salon',
    books: 'book_store'
  }

  if (!categories.length) {
    return ['restaurant', 'cafe', 'bar', 'clothing_store', 'gym']
  }

  return categories.map(c => map[c]).filter(Boolean)
}