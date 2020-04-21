const test = require('ava')
const sinon = require('sinon')
const Process = require('../../lib/process')

test.beforeEach((t) => {
  t.context.stripe = {
    chargeAdvertiser: sinon.stub().resolves()
  }
  t.context.db = {
    updateAdvertiserBalance: sinon.stub().resolves()
  }
  t.context.dynamo = {
    lockIdempotencyKey: sinon.stub().resolves({ locked_until: '1234' })
  }
  t.context.idempotencyKey = 'piedpiper'
  t.context.customerId = 'joepug-id'
  t.context.advertiserId = 'bogus-adv'
  t.context.amount = 500000 // 5 bucks in MC
  t.context.record = {
    body: JSON.stringify({
      idempotencyKey: t.context.idempotencyKey,
      advertiserId: t.context.advertiserId,
      amount: t.context.amount,
      customerId: t.context.customerId
    })
  }
})

test('processes an advertiser transaction', async (t) => {
  const log = sinon.stub()
  await Process.process({
    stripe: t.context.stripe,
    log,
    db: t.context.db,
    dynamo: t.context.dynamo,
    record: t.context.record
  })
  t.true(t.context.stripe.chargeAdvertiser.calledOnce)
  t.deepEqual(log.firstCall.args, [{
    advertiserId: t.context.advertiserId,
    customerId: t.context.customerId,
    amount: t.context.amount,
    idempotencyKey: t.context.idempotencyKey
  }]
  )
  t.deepEqual(log.secondCall.args, [{ lockInfo: { locked_until: '1234' } }])
  t.true(log.calledWith({
    customerId: t.context.customerId,
    amount: t.context.amount,
    advertiserId: t.context.advertiserId
  }))
})

test('updates advertisers balances | errors with stripe', async (t) => {
  t.context.stripe.chargeAdvertiser.rejects(new Error('blah happened'))
  const log = sinon.stub()
  try {
    await Process.process({
      stripe: t.context.stripe,
      log,
      db: t.context.db,
      dynamo: t.context.dynamo,
      record: t.context.record
    })
  } catch (e) {}
  t.false(t.context.db.updateAdvertiserBalance.calledOnce)
})

test('updates advertisers balances | idempotency key is locked', async (t) => {
  t.context.dynamo.lockIdempotencyKey.rejects(new Error('idempotency key is locked'))
  const log = sinon.stub()
  try {
    await Process.process({
      stripe: t.context.stripe,
      log,
      dynamo: t.context.dynamo,
      db: t.context.db,
      record: t.context.record
    })
  } catch (e) {}
  t.false(t.context.db.updateAdvertiserBalance.calledOnce)
})

test('updates advertisers balances | errors with mongo', async (t) => {
  t.context.db.updateAdvertiserBalance.rejects(new Error('mongo error happened'))
  const log = sinon.stub()
  try {
    await Process.process({
      stripe: t.context.stripe,
      log,
      db: t.context.db,
      dynamo: t.context.dynamo,
      record: t.context.record
    })
  } catch (e) {}
  t.false(log.calledWith({
    customerId: t.context.customerId,
    amount: t.context.amount,
    advertiserId: t.context.advertiserId
  }))
})
