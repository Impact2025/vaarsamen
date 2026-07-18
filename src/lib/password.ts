// Wachtwoord-hashing met Node's ingebouwde crypto.scrypt (geen externe dep).
import { randomBytes, scrypt, timingSafeEqual } from 'crypto'
import { promisify } from 'util'

const scryptAsync = promisify(scrypt)

// Hash een platte tekst-wachtwoord → "salt:hash" (beide hex).
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const buf = (await scryptAsync(password, salt, 64)) as Buffer
  return `${salt}:${buf.toString('hex')}`
}

// Verifieer een platte tekst tegen een opgeslagen "salt:hash".
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, key] = stored.split(':')
  if (!salt || !key) return false
  const keyBuf = Buffer.from(key, 'hex')
  const buf = (await scryptAsync(password, salt, 64)) as Buffer
  return keyBuf.length === buf.length && timingSafeEqual(keyBuf, buf)
}
