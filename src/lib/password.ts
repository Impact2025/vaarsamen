// Wachtwoord-hashing met de Web Crypto API (crypto.subtle).
// Werkt op ZOWEL de Edge runtime (middleware) als de Node runtime (route handlers),
// in tegenstelling tot node:crypto/scrypt dat Edge niet ondersteunt.
//
// Formaat: "pbkdf2$<salt-hex>$<iterations>$<hash-hex>"

const ITERATIONS = 100_000
const KEYLEN = 64 // bytes

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function fromHex(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2)
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.substr(i * 2, 2), 16)
  }
  return out
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const enc = new TextEncoder().encode(password) as BufferSource
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc, { name: 'PBKDF2' }, false, ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial, KEYLEN * 8,
  )
  const hash = toHex(bits)
  return `pbkdf2$${toHex(salt.buffer)}${ITERATIONS}$${hash}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$')
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false
  const [, saltHex, iterStr, hashHex] = parts
  const salt = fromHex(saltHex) as BufferSource
  const iterations = parseInt(iterStr, 10)
  const enc = new TextEncoder().encode(password) as BufferSource
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc, { name: 'PBKDF2' }, false, ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial, KEYLEN * 8,
  )
  const computed = toHex(bits)
  // Constant-time vergelijking
  if (computed.length !== hashHex.length) return false
  let diff = 0
  for (let i = 0; i < computed.length; i++) {
    diff |= computed.charCodeAt(i) ^ hashHex.charCodeAt(i)
  }
  return diff === 0
}
