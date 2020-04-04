class Config {
  constructor ({ kms }) {
    this.kms = kms
  }

  async decrypt (data) {
    return this.kms.decrypt({
      CiphertextBlob: Buffer.from(data, 'base64')
    }).promise().then(decrypted => decrypted.Plaintext.toString())
  }

  async getStripeKey () {
    return this.decrypt(process.env.STRIPE_SECRET_KEY)
  }
}

module.exports = Config
