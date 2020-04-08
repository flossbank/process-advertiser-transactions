const AWS = require('aws-sdk')
const Config = require('./lib/config')
const Stripe = require('./lib/stripe')
const Db = require('./lib/mongo')
const Process = require('./lib/process')

const kms = new AWS.KMS({ region: 'us-west-2' })

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
 */

exports.handler = async (event) => {
  const config = new Config({ kms })
  const db = new Db({ config })
  const stripe = new Stripe({ config })
  const log = console.log

  await stripe.setup()
  return Promise.all(event.Records.map(record => Process.process({ 
    stripe, 
    log, 
    db,
    amount: record.amount, 
    event: record.customerId,
    advertiserId: record.advertiserId, 
    idempotencyKey: record.idempotencyKey,
  })))
}
