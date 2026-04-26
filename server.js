import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// API routes
const apiRoutes = [
  'offers', 'explore', 'weather', 'save-offer', 'saved-offers',
  'upload-community-offer', 'community-offers', 'get-profile',
  'save-profile', 'merchant-offers', 'validate-qr', 'redeem-qr',
  'nearby-merchant-offers', 'create-checkout', 'subscription-status',
  'invoices'
]

for (const route of apiRoutes) {
  app.all(`/api/${route}`, async (req, res) => {
    try {
      const mod = await import(`./api/${route}.js`)
      return mod.default(req, res)
    } catch (err) {
      console.error(`Error in /api/${route}:`, err)
      res.status(500).json({ error: err.message })
    }
  })
}

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, 'dist')))
  app.get('/{*path}', (req, res) => {
    res.sendFile(join(__dirname, 'dist', 'index.html'))
  })
}

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})