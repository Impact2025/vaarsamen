import fs from 'node:fs'
import { execSync } from 'node:child_process'

const envText = fs.readFileSync('.env.local', 'utf8')
for (const line of envText.split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) { let v = m[2].trim(); if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); process.env[m[1]] = v }
}
try {
  execSync('npx next build', { encoding: 'utf8', stdio: 'inherit', maxBuffer: 50 * 1024 * 1024 })
  console.log('BUILD_OK')
} catch (e) { console.error('BUILD_FAILED'); process.exit(1) }
