const stripe = require('stripe')

class Stripe {
  constructor ({ config }) {
    this.config = config
    this.stripe = stripe
  }

  async setup () {
    const stripeKey = await this.config.getStripeKey()
    this.stripeClient = this.stripe(stripeKey)
  }

  async chargeAdvertiser ({ customerId, amount, idempotencyKey }) {
    const amountInCents = amount / 1000 // Turn microcents into cents
    return this.stripeClient.customers.createBalanceTransaction(customerId, {
      amount: amountInCents, 
      currency: 'usd',
      description: `Flossbank advertising bill for: ${amount / 1000} cents`
    }, {
      // Use key so if fails on our end but actually succeeds, we dont charge advertiser twice
      idempotencyKey 
    })
  }
}

module.exports = Stripe
