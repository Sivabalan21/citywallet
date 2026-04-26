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

    const invoiceList = await stripe.invoices.list({
      customer: customer.id,
      limit: 20
    })

    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 5
    })

    let subscription = null
    if (subscriptions.data.length > 0) {
      const customerProPriceId = process.env.STRIPE_CUSTOMER_PRO_PRICE_ID
      const merchantProPriceId = process.env.STRIPE_MERCHANT_PRO_PRICE_ID

      let customerPro = null
      let merchantPro = null

      for (const sub of subscriptions.data) {
        const priceId = sub.items?.data?.[0]?.price?.id
        if (!priceId) continue
        const periodEnd = sub.current_period_end
        const periodEndISO = periodEnd ? new Date(periodEnd * 1000).toISOString() : null
        if (priceId === customerProPriceId) customerPro = { active: true, currentPeriodEnd: periodEndISO }
        if (priceId === merchantProPriceId) merchantPro = { active: true, currentPeriodEnd: periodEndISO }
      }

      const plan = customerPro ? 'customer_pro' : merchantPro ? 'merchant_pro' : 'unknown'
      const currentPeriodEnd = customerPro?.currentPeriodEnd || merchantPro?.currentPeriodEnd || null

      subscription = { plan, currentPeriodEnd, customerPro, merchantPro }
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