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
      return res.status(200).json({ invoices: [], subscription: null })
    }

    const customer = customers.data[0]

    // Get invoices
    const invoiceList = await stripe.invoices.list({
      customer: customer.id,
      limit: 20
    })

    // Get active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1
    })

    let subscription = null
    if (subscriptions.data.length > 0) {
      const sub = subscriptions.data[0]
      const priceId = sub.items.data[0].price.id
      const customerProPriceId = process.env.STRIPE_CUSTOMER_PRO_PRICE_ID
      const merchantProPriceId = process.env.STRIPE_MERCHANT_PRO_PRICE_ID

      subscription = {
        plan: priceId === customerProPriceId
          ? 'customer_pro'
          : priceId === merchantProPriceId
          ? 'merchant_pro' : 'unknown',
        currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString()
      }
    }

    return res.status(200).json({
      invoices: invoiceList.data,
      subscription
    })
  } catch (err) {
    console.error('Invoices error:', err)
    return res.status(500).json({ error: 'Failed to fetch invoices' })
  }
}