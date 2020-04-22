const AWS = require('aws-sdk')
const Config = require('./lib/config')
const Stripe = require('./lib/stripe')
const Db = require('./lib/mongo')
const Dynamo = require('./lib/dynamo')
const Process = require('./lib/process')

const kms = new AWS.KMS({ region: 'us-west-2' })
const docs = new AWS.DynamoDB.DocumentClient({ region: 'us-west-2' })

/**
 * Event contains an array of records to be processed.
 * We have currently specified only 1 record to come in at a time.
 * This is specified in the template.yml BatchSize field.
 * the single record that comes in will have a body with a JSON stringified
 * interface of:
 * {
 *   amount: int // amount that the advertiser owes in MICROCENTS, must be converted to cents for stripe
 *   idempotencyKey: string // idempotent key for stripe to not make duplicate transactions
 *   customerId: string // stripe customer id
 *   advertiserId: string // mongo id to update the mongo advertiser with their new balance
 * }
 * On receiving of an event, lock the advertiser to ensure more than one lambda doesn't pick up
 * the same sqs message.
 */

exports.handler = async (event) => {
  const dynamo = new Dynamo({ docs })
  const config = new Config({ kms })
  const db = new Db({ config })
  await db.connect()

  const stripe = new Stripe({ config })
  const log = console.log

  try {
    await stripe.setup()
    await Promise.all(event.Records.map(record => Process.process({ record, stripe, log, db, dynamo })))
  } finally {
    db.close()
  }
}
