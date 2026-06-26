export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { query, location } = req.body
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Google Places API key not configured' })
  if (!query || !location) return res.status(400).json({ error: 'Category and location required' })

  try {
    const searchRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query + ' ' + location)}&key=${apiKey}`
    )
    const searchData = await searchRes.json()
    if (!searchData.results?.length) return res.status(200).json({ leads: [] })

    const leads = await Promise.all(
      searchData.results.slice(0, 20).map(async (place) => {
        try {
          const detailRes = await fetch(
            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_phone_number,website,formatted_address,rating,user_ratings_total,business_status,types&key=${apiKey}`
          )
          const { result: d } = await detailRes.json()
          let score = 50, websiteSignal = 'No website', tier = 'Cold'
          if (!d.website) {
            score += 40; websiteSignal = 'No website'
          } else {
            const url = d.website.toLowerCase()
            if (url.includes('facebook') || url.includes('instagram')) { score += 25; websiteSignal = 'Social only' }
            else if (url.includes('wix') || url.includes('squarespace') || url.includes('weebly') || url.includes('wordpress.com')) { score += 15; websiteSignal = 'Basic builder' }
            else { score += 5; websiteSignal = 'Has website' }
          }
          if (d.rating && d.rating < 4.0) score += 5
          if (!d.user_ratings_total || d.user_ratings_total < 20) score += 5
          score = Math.min(99, score)
          if (score >= 75) tier = 'Hot'
          else if (score >= 50) tier = 'Warm'
          return {
            id: place.place_id, name: d.name || place.name,
            phone: d.formatted_phone_number || null, website: d.website || null,
            address: d.formatted_address || place.formatted_address,
            rating: d.rating || null, reviewCount: d.user_ratings_total || 0,
            websiteSignal, score, tier, types: d.types || [], email: null,
            category: query
          }
        } catch { return null }
      })
    )
    return res.status(200).json({ leads: leads.filter(Boolean).sort((a,b) => b.score - a.score) })
  } catch (err) {
    return res.status(500).json({ error: 'Search failed' })
  }
}
