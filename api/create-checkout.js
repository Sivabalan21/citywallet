import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { priceId, userId, userEmail, plan } = req.body

  if (!priceId || !userId) {
    return res.status(400).json({ error: 'priceId and userId required' })
  }

  try {
    const appUrl = process.env.APP_URL || process.env.VITE_APP_URL || 'http://localhost:5173'
    const successPath = plan === 'merchant_pro' ? '/merchant' : '/profile'
    const cancelPath = plan === 'merchant_pro' ? '/merchant' : '/profile'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: userEmail,
      metadata: { userId, plan },
      success_url: `${appUrl}${successPath}?subscription=success&plan=${plan}`,
      cancel_url: `${appUrl}${cancelPath}?subscription=cancelled`,
    })

    return res.status(200).json({ url: session.url, sessionId: session.id })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return res.status(500).json({ error: 'Failed to create checkout session' })
  }
}