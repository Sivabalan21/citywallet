export default async function handler(req, res) {
  const { lat, lng } = req.query

  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng required' })
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,wind_speed_10m&temperature_unit=celsius`

    const response = await fetch(url)
    const data = await response.json()

    const temp = Math.round(data.current.temperature_2m)
    const code = data.current.weather_code
    const condition = getWeatherCondition(code)

    return res.status(200).json({
      temp,
      condition,
      display: `${condition}, ${temp}°C`
    })
  } catch (err) {
    console.error('Weather error:', err)
    return res.status(200).json({
      temp: 18,
      condition: 'Clear',
      display: 'Clear, 18°C'
    })
  }
}

function getWeatherCondition(code) {
  if (code === 0) return 'Clear'
  if (code <= 3) return 'Partly Cloudy'
  if (code <= 48) return 'Foggy'
  if (code <= 67) return 'Rainy'
  if (code <= 77) return 'Snowy'
  if (code <= 82) return 'Showers'
  if (code <= 99) return 'Stormy'
  return 'Clear'
}