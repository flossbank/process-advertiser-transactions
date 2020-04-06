const { MongoClient, ObjectId } = require('mongodb')
const MONGO_DB = 'flossbank_db'
const ADVERTISER_COLLECTION = 'advertisers'

class Mongo {
  constructor ({ config }) {
    this.config = config
    this.db = null
    this.mongoClient = null
  }

  async connect () {
    const mongoUri = await this.config.getMongoUri()
    this.mongoClient = new MongoClient(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    await this.mongoClient.connect()

    this.db = this.mongoClient.db(MONGO_DB)
  }

  async close () {
    if (this.mongoClient) return this.mongoClient.close()
  }

  async updateAdvertiserBalance ({ advertiserId, amount }) {
    return this.db.collection(ADVERTISER_COLLECTION).updateOne({ _id: ObjectId(advertiserId) }, { $inc: { 'billingInfo.amountOwed': -amount*1000 } })
  }
}

module.exports = Mongo
