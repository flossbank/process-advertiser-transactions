exports.process = async ({ stripe, log, advertiserId, customerId, idempotencyKey, amount, db }) => {
  log('charging stripe customer: %s, amount: %s, with idempotencyKey: %s', customerId, amount, idempotencyKey)

  try {
    await stripe.chargeAdvertiser({ customerId, amount, idempotencyKey })
    await db.updateAdvertiserBalance({ amount, advertiserId })
  } catch (e) {
    log('error processing charge with idempotencyKey: %s, advertiserId: %s', idempotencyKey, advertiserId)
    // Throw error so lambda fails and it gets put back in the queue
    throw e
  }
  log('success, charged customer: %s, amount: %s, with mongo id: %s', customerId, amount, advertiserId)
}
