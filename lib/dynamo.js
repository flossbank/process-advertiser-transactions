class Dynamo {
  constructor ({ docs }) {
    this.docs = docs
    this.LOCKS_TABLE = 'flossbank_locks'
    this.LOCK_TIMEOUT = 180 * 1000 // 3mins in ms, same as max execution time of lambda
  }

  async lockIdempotencyKey (idempotencyKey) {
    // get lock info from flossbank_lambda_locks table
    // and also lock on the idempotency key for processing
    const { Attributes: lockInfo } = await this.docs.update({
      TableName: this.LOCKS_TABLE,
      Key: { lock_key: idempotencyKey },
      UpdateExpression: 'SET locked_until = :lockTimeout',
      ConditionExpression: 'attribute_not_exists(locked_until) OR locked_until < :now',
      ExpressionAttributeValues: {
        ':lockTimeout': Date.now() + this.LOCK_TIMEOUT,
        ':now': Date.now()
      },
      ReturnValues: 'ALL_NEW'
    }).promise()
    return lockInfo
  }
}

module.exports = Dynamo
