export const generateQRData = (offer) => {
  const data = {
    id: crypto.randomUUID(),
    merchant: offer.merchant_name,
    offer: offer.offer_text,
    issued_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    city: 'NYC'
  }
  return JSON.stringify(data)
}