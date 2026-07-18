import { hashPassword } from '@/lib/password'

async function main() {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  console.log('salt.length =', salt.length)
  const hexSalt = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('')
  console.log('hexSalt =', hexSalt, '| len', hexSalt.length)
  const iter = 100_000
  console.log('iter =', iter, '| String =', String(iter))
  const full = `pbkdf2$${hexSalt}${iter}$X`
  console.log('TEMPLATE =', full)
  process.exit(0)
}
main().catch(e => { console.error('FOUT:', e); process.exit(1) })
