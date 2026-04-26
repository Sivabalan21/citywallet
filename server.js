import express from 'express'
import { createServer } from 'vite'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load env
import dotenv from 'dotenv'
dotenv.config()

const app = express()
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// API routes
const apiRoutes = [
  'offers',
  'explore',
  'weather',
  'save-offer',
  'saved-offers',
  'upload-community-offer',
  'community-offers',
  'get-profile',
  'save-profile',
  'merchant-offers',
  'validate-qr',
  'redeem-qr',
  'nearby-merchant-offers',
  'create-checkout',
  'subscription-status'
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

app.listen(3000, () => {
  console.log('API server running on http://localhost:3000')
})