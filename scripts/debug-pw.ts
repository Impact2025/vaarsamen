import { hashPassword } from '@/lib/password'

async function main() {
  const h = await hashPassword('Demo1234!')
  const parts = h.split('$')
  console.log('parts:', parts.length, parts[0])
  console.log('saltHex:', parts[1])
  console.log('iter:', parts[2])
  console.log('hashHex:', parts[3].slice(0, 16), '... len=', parts[3].length)

  // handmatig opnieuw deriveren met zelfde params
  const salt = new Uint8Array(parts[1].match(/.{2}/g)!.map(b => parseInt(b, 16)))
  const enc = new TextEncoder().encode('Demo1234!')
  const km = await crypto.subtle.importKey('raw', enc, { name: 'PBKDF2' }, false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: parseInt(parts[2], 10), hash: 'SHA-256' },
    km, 64 * 8,
  )
  const manual = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('')
  console.log('manual == stored?', manual === parts[3])
  console.log('manual:', manual.slice(0, 16))
  process.exit(0)
}
main().catch(e => { console.error('FOUT:', e); process.exit(1) })
