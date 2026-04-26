import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userEmail } = req.query
  if (!userEmail) return res.status(400).json({ error: 'userEmail required' })

  try {
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 })

    if (customers.data.length === 0) {
      return res.status(200).json({
        plan: 'free', active: false,
        currentPeriodEnd: null,
        customerPro: null, merchantPro: null
      })
    }

    const customer = customers.data[0]

    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 10
    })

    if (subscriptions.data.length === 0) {
      return res.status(200).json({
        plan: 'free', active: false,
        currentPeriodEnd: null,
        customerPro: null, merchantPro: null
      })
    }

    const customerProPriceId = process.env.STRIPE_CUSTOMER_PRO_PRICE_ID
    const merchantProPriceId = process.env.STRIPE_MERCHANT_PRO_PRICE_ID

    let customerPro = null
    let merchantPro = null

    for (const sub of subscriptions.data) {
      const priceId = sub.items?.data?.[0]?.price?.id
      if (!priceId) continue

      // Safely convert timestamp
      const periodEnd = sub.current_period_end
      const periodEndISO = periodEnd
        ? new Date(periodEnd * 1000).toISOString()
        : null

      if (priceId === customerProPriceId) {
        customerPro = { active: true, currentPeriodEnd: periodEndISO }
      }
      if (priceId === merchantProPriceId) {
        merchantPro = { active: true, currentPeriodEnd: periodEndISO }
      }
    }

    const plan = customerPro ? 'customer_pro' : merchantPro ? 'merchant_pro' : 'free'
    const currentPeriodEnd = customerPro?.currentPeriodEnd || merchantPro?.currentPeriodEnd || null

    return res.status(200).json({
      plan,
      active: !!(customerPro || merchantPro),
      currentPeriodEnd,
      customerPro,
      merchantPro
    })
  } catch (err) {
    console.error('Subscription status error:', err)
    return res.status(500).json({ error: 'Failed to get subscription status' })
  }
}