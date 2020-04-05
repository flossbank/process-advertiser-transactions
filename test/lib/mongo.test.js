const test = require('ava')
const sinon = require('sinon')
const { MongoClient, ObjectId } = require('mongodb')
const Mongo = require('../../lib/mongo')

test.beforeEach((t) => {
  t.context.mongo = new Mongo({
    config: {
      getMongoUri: async () => 'mongodb+srv://0.0.0.0/test',
      getQueueUrl: async () => 'sqsurl.com',
    }
  })
  t.context.mongo.db = {
    collection: sinon.stub().returns({
      find: sinon.stub().returns({
        updateOne: sinon.stub().resolves({
          modifiedCount: 1
        })
      })
    })
  }
})

test('connect', async (t) => {
  sinon.stub(MongoClient.prototype, 'connect')
  sinon.stub(MongoClient.prototype, 'db')

  await t.context.mongo.connect()
  t.true(MongoClient.prototype.connect.calledOnce)

  MongoClient.prototype.connect.restore()
  MongoClient.prototype.db.restore()
})

test('close', async (t) => {
  await t.context.mongo.close()
  t.context.mongo.mongoClient = { close: sinon.stub() }
  await t.context.mongo.close()
  t.true(t.context.mongo.mongoClient.close.calledOnce)
})

test('update advertiser balance', async (t) => {
  const result = await await t.context.mongo.updateAdvertiserBalance('aaaaaaaaaaaaaaaaaaaaaaaa', 10000)
  t.deepEqual(result, {
    modifiedCount: 1
  })
})