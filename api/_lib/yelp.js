const YELP_API_KEY = process.env.YELP_API_KEY

export async function getYelpBusinesses(lat, lng, categories = []) {
  try {
    const term = categories.length ? categories.join(',') : 'food,coffee,shopping'
    const url = `https://api.yelp.com/v3/businesses/search?latitude=${lat}&longitude=${lng}&radius=500&limit=15&sort_by=rating&term=${term}`

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${YELP_API_KEY}` }
    })

    const data = await res.json()
    return data.businesses || []
  } catch (err) {
    console.error('Yelp API error:', err)
    return []
  }
}

export async function getYelpReviews(businessId) {
  try {
    const url = `https://api.yelp.com/v3/businesses/${businessId}/reviews?limit=3`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${YELP_API_KEY}` }
    })
    const data = await res.json()
    return data.reviews || []
  } catch {
    return []
  }
}