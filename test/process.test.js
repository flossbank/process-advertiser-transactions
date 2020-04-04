const test = require('ava')
const sinon = require('sinon')
const Process = require('../lib/process')

test.beforeEach((t) => {
  t.context.stripe = {
    chargeAdvertiser: sinon.stub().resolves()
  }
  t.context.idempotencyKey = 'piedpiper'
  t.context.customerId = 'joepug-id'
  t.context.amount = 100000
})

test('updates advertisers balances', async (t) => {
  await Process.process({ 
    stripe: t.context.stripe, 
    log: () => {}, 
    idempotencyKey: t.context.idempotencyKey, 
    amount: t.context.amount,
    customerId: t.context.customerId,
  })
  t.true(t.context.stripe.chargeAdvertiser.calledOnce)
})

test('updates advertisers balances | errors with stripe', async (t) => {
  t.context.stripe.chargeAdvertiser.rejects(new Error('blah happened'))
  const log = sinon.stub()
  await Process.process({ 
    stripe: t.context.stripe, 
    log,
    idempotencyKey: t.context.idempotencyKey,
    amount: t.context.amount,
    customerId: t.context.customerId,
   })

  t.true(log.calledWith())
})
