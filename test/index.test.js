const test = require('ava')
const sinon = require('sinon')
const Stripe = require('../lib/stripe')
const Process = require('../lib/process')
const index = require('../')

test.before(() => {
  sinon.stub(Stripe.prototype, 'setup')
  sinon.stub(Process, 'process').resolves()
})

test.afterEach(() => {
  Stripe.prototype.setup.reset()
  Process.process.reset()
})

test.after.always(() => {
  sinon.restore()
})

test.serial('processes records', async (t) => {
  await index.handler()
  t.true(Process.process.calledOnce)
})

test.serial('throws on processing errors', async (t) => {
  Process.process.rejects()
  await t.throwsAsync(index.handler)
})
