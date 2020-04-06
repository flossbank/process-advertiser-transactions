const test = require('ava')
const sinon = require('sinon')
const Process = require('../../lib/process')

test.beforeEach((t) => {
  t.context.stripe = {
    chargeAdvertiser: sinon.stub().resolves()
  }
  t.context.db = {
    updateAdvertiserBalance: sinon.stub().resolves(),
  }
  t.context.idempotencyKey = 'piedpiper'
  t.context.customerId = 'joepug-id'
  t.context.advertiserId = 'bogus-adv'
  t.context.amount = 500 // 5 bucks
  t.context.record = {
    body: JSON.stringify({
      idempotencyKey: t.context.idempotencyKey,
      advertiserId: t.context.advertiserId, 
      amount: t.context.amount,
      customerId: t.context.customerId,
    })
  }
})

test('processes an advertiser transaction', async (t) => {
  const log = sinon.stub()
  await Process.process({ 
    stripe: t.context.stripe, 
    log, 
    db: t.context.db,
    record: t.context.record
  })
  t.true(t.context.stripe.chargeAdvertiser.calledOnce)
  t.true(log.calledWith(
    'success, charged customer: %s, amount: %s, with mongo id: %s',
    t.context.customerId, 
    t.context.amount, 
    t.context.advertiserId,
  ))
})

test('updates advertisers balances | errors with stripe', async (t) => {
  t.context.stripe.chargeAdvertiser.rejects(new Error('blah happened'))
  const log = sinon.stub()
  try {
    await Process.process({ 
      stripe: t.context.stripe, 
      log,
      db: t.context.db,
      record: t.context.record,
    })
  } catch (e) {}
  t.true(log.calledWith(
    'error processing charge with idempotencyKey: %s, advertiserId: %s', 
    t.context.idempotencyKey, 
    t.context.advertiserId,
  ))
})

test('updates advertisers balances | errors with mongo', async (t) => {
  t.context.db.updateAdvertiserBalance.rejects(new Error('mongo error happened'))
  const log = sinon.stub()
  try {
    await Process.process({ 
      stripe: t.context.stripe, 
      log,
      db: t.context.db,
      record: t.context.record,
    })
  } catch (e) {}
  t.true(log.calledWith(
    'error processing charge with idempotencyKey: %s, advertiserId: %s', 
    t.context.idempotencyKey, 
    t.context.advertiserId,
  ))
})
