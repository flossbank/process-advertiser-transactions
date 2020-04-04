const AWS = require('aws-sdk')
const Config = require('./lib/config')
const Stripe = require('./lib/stripe')
const Process = require('./lib/process')

const kms = new AWS.KMS({ region: 'us-west-2' })

exports.handler = async (event) => {
  const config = new Config({ kms })
  const stripe = new Stripe({ config })
  const log = console.log

  await stripe.setup()
  event.Records.map(record => Process.process(record, { 
    stripe, log, 
    amount: event.amount, 
    event: event.customerId, 
    idempotencyKey: event.idempotencyKey,
  }))
}
