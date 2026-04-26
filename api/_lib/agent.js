import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function rankOffers({
  venues,
  yelpData,
  tavilyData,
  userProfile,
  context
}) {
  const systemPrompt = `You are CityWallet's AI offer discovery agent.
Your job is to find REAL, SPECIFIC offers and deals from the venue data provided.

STRICT RULES:
1. Only include venues that have a REAL, SPECIFIC offer or deal — explicit discount, happy hour with time and price, promo code, meal deal with price, free item, percentage off etc.
2. DO NOT invent generic descriptions like "warm up with a beer" or "enjoy wine and small plates" — these are NOT offers. They are just descriptions.
3. If a venue has no real offer visible in the review or web data, SKIP IT entirely. Do not make one up.
4. merchant_name must be EXACTLY copied from the provided data. Never modify, shorten, or invent names.
5. merchant_address must be EXACTLY copied from the provided data.
6. It is better to return 2 or 3 real verified offers than 6 invented ones.
7. For why_relevant: write a specific contextual reason using the current time, weather, day, and user interests. Never say "user is in NYC" — that is obvious and useless.
8. Return ONLY a valid JSON array. No markdown, no explanation, no extra text.
9. Each merchant can only appear ONCE in the results. If a venue has multiple offers, combine them into one offer_text separated by " • " for example: "Happy hour 5-7pm: $4 beers • Student discount 10% off food"`

  const userPrompt = `
USER CONTEXT:
- Location: ${context.neighborhood}
- Time: ${context.time} on ${context.dayOfWeek}
- Weather: ${context.weather}
- Interests: ${userProfile.categories?.join(', ') || 'general'}
- Budget: ${userProfile.budget || 'mid'}
- Favourite brands: ${userProfile.brand_affinities?.join(', ') || 'none'}

VENUES FROM GOOGLE PLACES - USE EXACT NAMES AND ADDRESSES:
${venues.slice(0, 5).map(v => `
name="${v.displayName?.text}"
address="${v.formattedAddress}"
rating=${v.rating || 'unknown'}
price=${v.priceLevel || 'unknown'}
type=${v.types?.[0] || 'venue'}
reviews="${v.reviews?.slice(0, 1).map(r => r.text?.text?.slice(0, 100) || '').join('') || 'none'}"
`).join('\n')}

YELP DATA - USE EXACT NAMES:
${yelpData.slice(0, 4).map(b => `
name="${b.name}"
address="${b.location?.address1 || ''}"
rating=${b.rating}
categories=${b.categories?.map(c => c.title).join(', ')}
`).join('\n')}

WEB SEARCH FOR REAL DEALS (use for offer ideas only, NEVER for merchant names):
${tavilyData.answer?.slice(0, 150) || 'none'}
${tavilyData.results?.slice(0, 2).map(r => `- ${r.title}: ${r.content?.slice(0, 150)}`).join('\n') || ''}

TASK:
- Read through ALL the review text and web data carefully
- Find venues that have REAL, SPECIFIC offers mentioned (happy hour prices, discount codes, meal deals, free items, % off)
- For each real offer found, create one entry in the JSON array
- If no real offer exists for a venue, DO NOT include it
- Copy merchant_name and merchant_address EXACTLY from the data above

Return this exact JSON structure (only real offers, minimum 1, maximum 8):
[
  {
    "merchant_name": "EXACT name from data above",
    "merchant_address": "EXACT address from data above",
    "category": "food|coffee|fashion|fitness|nightlife|shopping|beauty|books",
    "rating": 0.0,
    "price_level": "$|$$|$$$",
    "distance_meters": 0,
    "offer_text": "SPECIFIC real deal — must include price, discount, or specific promotion",
    "why_relevant": "specific reason using ${context.time} + ${context.weather} + ${context.dayOfWeek} + user interests",
    "confidence": 0.0,
    "freshness": "live|recent|estimated",
    "lat": 0.0,
    "lng": 0.0
  }
]

ONLY return the JSON array. No other text whatsoever.`

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.1,
    max_tokens: 1200
  })

  const raw = completion.choices[0]?.message?.content || '[]'

  try {
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function extractOfferFromImage(base64Image, mimeType = 'image/jpeg') {
  const completion = await groq.chat.completions.create({
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`
            }
          },
          {
            type: 'text',
            text: `Analyze this image and extract any offer, deal, discount, or promotion visible.
Return ONLY a JSON object with this exact structure:
{
  "merchant_name": "name of the business if visible, else null",
  "merchant_address": "address if visible, else null",
  "offer_text": "the specific deal or offer text exactly as shown",
  "category": "food|coffee|fashion|fitness|nightlife|shopping|beauty|books",
  "confidence": 0.0 to 1.0,
  "is_valid_offer": true or false
}
If no clear offer, deal, discount or promotion is visible in the image, return {"is_valid_offer": false}.
Only JSON, no other text.`
          }
        ]
      }
    ],
    temperature: 0.1,
    max_tokens: 500
  })

  const raw = completion.choices[0]?.message?.content || '{}'
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    return { is_valid_offer: false }
  }
}