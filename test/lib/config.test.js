const test = require('ava')
const Config = require('../../lib/config')

test('getStripeKey decrypts with kms', async (t) => {
  const config = new Config({
    kms: {
      decrypt: () => ({
        promise: async () => ({
          Plaintext: Buffer.from('solitaire')
        })
      })
    }
  })

  process.env.STRIPE_SECRET_KEY = Buffer.from('solitaire').toString('base64')
  const stripeKey = await config.getStripeKey()
  t.deepEqual(stripeKey, 'solitaire')
})
