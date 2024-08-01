import crypto from 'crypto'

const key = crypto.randomBytes(64).toString('hex')
console.log(key)