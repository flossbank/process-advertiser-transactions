const test = require('ava')
const sinon = require('sinon')
const Stripe = require('../lib/stripe')
const Process = require('../lib/process')
const index = require('../')
const testEvent = require('./test_event.json')

test.before(() => {
  sinon.stub(Stripe.prototype, 'setup')
  sinon.stub(Process, 'process').resolves('success baby')
})

test.afterEach(() => {
  Stripe.prototype.setup.reset()
  Process.process.reset()
})

test.after.always(() => {
  sinon.restore()
})

test.serial('processes records', async (t) => {
  const res = await index.handler(testEvent)
  t.deepEqual(res.length, 1)
  t.deepEqual(await res[0], 'success baby')
  t.true(Process.process.calledOnce)
})

test.serial('throws on processing errors', async (t) => {
  Process.process.rejects()
  await t.throwsAsync(index.handler(testEvent))
})
