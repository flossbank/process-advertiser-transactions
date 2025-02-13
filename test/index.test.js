const test = require('ava')
const sinon = require('sinon')
const Stripe = require('../lib/stripe')
const Db = require('../lib/mongo')
const Process = require('../lib/process')
const index = require('../')
const testEvent = require('./test_event.json')

test.before(() => {
  sinon.stub(Db.prototype, 'connect')
  sinon.stub(Db.prototype, 'close')
  sinon.stub(Stripe.prototype, 'setup')
  sinon.stub(Process, 'process').resolves('success baby')
})

test.afterEach(() => {
  Db.prototype.connect.reset()
  Db.prototype.close.reset()
  Stripe.prototype.setup.reset()
  Process.process.reset()
})

test.after.always(() => {
  sinon.restore()
})

test.serial('processes records', async (t) => {
  await index.handler(testEvent)
  t.true(Process.process.calledOnce)
  t.true(Db.prototype.close.calledOnce)
})

test.serial('throws on processing errors', async (t) => {
  Process.process.rejects()
  await t.throwsAsync(index.handler(testEvent))
  t.true(Db.prototype.close.calledOnce)
})
