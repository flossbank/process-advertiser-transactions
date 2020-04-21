exports.process = async ({ stripe, log, record, db, dynamo }) => {
  const {
    idempotencyKey,
    customerId,
    amount,
    advertiserId
  } = JSON.parse(record.body)

  log({ advertiserId, customerId, amount, idempotencyKey })
  // If another lambda has already picked up this transaction, it'll be locked on idempotency key
  // preventing us from double decrementing the advertiser amount owed. This will throw if it's locked
  const lockInfo = await dynamo.lockIdempotencyKey(idempotencyKey)
  log({ lockInfo })
  await stripe.chargeAdvertiser({ customerId, amount, idempotencyKey })
  await db.updateAdvertiserBalance({ amount, advertiserId })

  await dynamo.unlockIdempotencyKey(idempotencyKey)

  log({ customerId, amount, advertiserId })
}
