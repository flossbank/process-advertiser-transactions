const test = require('ava')
const sinon = require('sinon')
const Stripe = require('../lib/stripe')

test.beforeEach((t) => {
  t.context.config = {
    getStripeKey: sinon.stub()
  }
  t.context.limiter = {
    schedule: async (cb) => cb()
  }
  t.context.stripe = new Stripe({
    config: t.context.config,
    limiter: t.context.limiter
  })
  t.context.stripe.stripeClient = { customers: { createBalanceTransaction: sinon.stub().resolves() } }
  t.context.stripe.stripe = sinon.stub().returns({ customers: { createBalanceTransaction: sinon.stub().resolves() } })
})

test('setup', async (t) => {
  await t.context.stripe.setup()
  t.true(t.context.stripe.stripe.calledOnce)
})

test('chargeAdvertiser', async (t) => {
  const result = await t.context.stripe.chargeAdvertiser(advertisers)
  t.deepEqual(result.advertisersBilled, expectedBilledAdvertisers)
})

test('chargeAdvertiser | throws', async (t) => {
  t.context.stripe.stripeClient.customers.createBalanceTransaction = async () => {
    throw new Error('fake error')
  }
  const result = await t.context.stripe.chargeAdvertiser(advertisers)
})
