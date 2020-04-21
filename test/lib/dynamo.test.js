const test = require('ava')
const sinon = require('sinon')
const Dynamo = require('../../lib/dynamo')

test.before(() => {
  sinon.stub(Date, 'now').returns(1234)
})

test.after(() => {
  Date.now.restore()
})

test.beforeEach((t) => {
  t.context.dynamo = new Dynamo({
    docs: {
      update: sinon.stub().returns({
        promise: sinon.stub().resolves({ Attributes: { a: 1 } })
      }),
      delete: sinon.stub().returns({
        promise: sinon.stub().resolves()
      })
    }
  })
})

test('lockIdempotencyKey success', async (t) => {
  const info = await t.context.dynamo.lockIdempotencyKey('test-idempotency-key')
  t.true(t.context.dynamo.docs.update.calledWith({
    TableName: t.context.dynamo.LOCKS_TABLE,
    Key: { lock_key: 'test-idempotency-key' },
    UpdateExpression: 'SET locked_until = :lockTimeout',
    ConditionExpression: 'attribute_not_exists(locked_until) OR locked_until < :now',
    ExpressionAttributeValues: {
      ':lockTimeout': Date.now() + t.context.dynamo.LOCK_TIMEOUT,
      ':now': Date.now()
    },
    ReturnValues: 'ALL_NEW'
  }))
  t.deepEqual(info, { a: 1 })
})

test('lockIdempotencyKey failure', async (t) => {
  t.context.dynamo.docs.update().promise.throws(new Error('yikes'))
  await t.throwsAsync(t.context.dynamo.lockIdempotencyKey('test-idempotency-key'), {
    message: 'yikes'
  })
})

test('unlockIdempotencyKey success', async (t) => {
  const { dynamo } = t.context
  await dynamo.unlockIdempotencyKey('abc')
  t.true(dynamo.docs.delete.calledWith({
    TableName: dynamo.LOCKS_TABLE,
    Key: { lock_key: 'abc' }
  }))
})
