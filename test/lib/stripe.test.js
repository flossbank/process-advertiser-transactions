const test = require('ava')
const sinon = require('sinon')
const Stripe = require('../../lib/stripe')

test.beforeEach((t) => {
  t.context.config = {
    getStripeKey: sinon.stub()
  }
  t.context.stripe = new Stripe({
    config: t.context.config
  })
  t.context.balanceResult = 'poo'
  t.context.stripe.stripeClient = { customers: { createBalanceTransaction: sinon.stub().resolves(t.context.balanceResult) } }
  t.context.stripe.stripe = sinon.stub().returns({ customers: { createBalanceTransaction: sinon.stub().resolves(t.context.balanceResult) } })
  t.context.idempotencyKey = 'piedpiper'
  t.context.customerId = 'joepug-id'
  t.context.amount = 500 // 5 bucks
})

test('setup', async (t) => {
  await t.context.stripe.setup()
  t.true(t.context.stripe.stripe.calledOnce)
})

test('chargeAdvertiser', async (t) => {
  const result = await t.context.stripe.chargeAdvertiser({
    idempotencyKey: t.context.idempotencyKey,
    amount: t.context.amount,
    customerId: t.context.customerId
  })
  t.true(t.context.stripe.stripeClient.customers.createBalanceTransaction.calledWith(t.context.customerId, {
    amount: t.context.amount / 1000,
    currency: 'usd',
    description: `Flossbank advertising bill for: ${t.context.amount / 1000} cents`
  }, {
    idempotencyKey: t.context.idempotencyKey
  }))
  t.deepEqual(result, 'poo')
})

test('chargeAdvertiser | throws', async (t) => {
  t.context.stripe.stripeClient.customers.createBalanceTransaction = async () => {
    throw new Error('fake error')
  }
  await t.throwsAsync(t.context.stripe.chargeAdvertiser({
    idempotencyKey: t.context.idempotencyKey,
    amount: t.context.amount,
    customerId: t.context.customerId
  }))
})
