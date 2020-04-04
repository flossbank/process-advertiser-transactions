exports.process = async ({ stripe, log, customerId, idempotencyKey, amount }) => {
  log('charging stripe customer: %s, amount: %s, with idempotencyKey: %s', customerId, amount, idempotencyKey)

  try {
    await stripe.chargeAdvertiser({ customerId, amount, idempotencyKey })
  } catch (e) {
    log('error charging with idempotencyKey: %s', idempotencyKey)
    // Throw error so lambda fails and it gets put back in the queue
    throw e
  }
  log('success, charged customer: %s, amount: %s', customerId, amount)
}
