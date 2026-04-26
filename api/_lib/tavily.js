const TAVILY_API_KEY = process.env.TAVILY_API_KEY

export async function searchDeals(neighborhood, categories = []) {
  try {
    const categoryStr = categories.length
      ? categories.join(' ')
      : 'food coffee shopping'

    const query = `${categoryStr} deals discounts offers ${neighborhood} NYC today 2025`

    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query,
        search_depth: 'basic',
        max_results: 5,
        include_answer: true
      })
    })

    const data = await res.json()
    return {
      answer: data.answer || '',
      results: data.results || []
    }
  } catch (err) {
    console.error('Tavily error:', err)
    return { answer: '', results: [] }
  }
}