import fs from 'node:fs'
const envText = fs.readFileSync('.env.local', 'utf8')
const ENV = {}
for (const line of envText.split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) { let v = m[2].trim(); if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); ENV[m[1]] = v }
}
for (const [k, v] of Object.entries(ENV)) process.env[k] = v
const BASE = 'https://www.vaarsamen.nl'

function capture(res, jar) {
  const arr = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get('set-cookie')].filter(Boolean)
  for (const c of arr) { const n = c.split('=')[0].trim(); const i = c.indexOf('='); const v = c.slice(i + 1).split(';')[0].trim(); if (v && v !== '""') jar[n] = v }
}
const cookieHeader = jar => Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ')

async function login(provider, email, pw) {
  const jar = {}
  const cr = await fetch(`${BASE}/api/auth/csrf`); capture(cr, jar)
  const csrf = jar['__Host-authjs.csrf-token']
  const r = await fetch(`${BASE}/api/auth/callback/${provider}`, {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', cookie: cookieHeader(jar) },
    body: new URLSearchParams({ csrfToken: csrf, email, password: pw, callbackUrl: BASE + '/admin', json: 'true' }),
    redirect: 'manual',
  })
  capture(r, jar)
  const sess = await (await fetch(`${BASE}/api/auth/session`, { headers: { cookie: cookieHeader(jar) } })).json()
  return { status: r.status, sess }
}

async function main() {
  // 1) admin creds via admin-password provider
  const admin = await login('admin-password', 'chat@weareimpact.nl', 'Demo1234!')
  console.log('admin-password + admin creds  ->', admin.sess?.user?.email, '| isAdmin:', admin.sess?.user?.isAdmin)

  // 2) school-owner creds via admin-password provider (should FAIL: not admin)
  const schoolOnAdmin = await login('admin-password', 'eigenaar.demo@vaarsamen.nl', 'Demo1234!')
  console.log('admin-password + school creds  ->', schoolOnAdmin.sess?.user ? 'INGELOGD (FOUT!)' : 'geweigerd (goed)')

  // 3) school-owner creds via school-password provider (should SUCCEED)
  const school = await login('school-password', 'eigenaar.demo@vaarsamen.nl', 'Demo1234!')
  console.log('school-password + school creds ->', school.sess?.user?.email, '| isAdmin:', school.sess?.user?.isAdmin)

  // 4) admin creds via school-password provider (should FAIL: isAdmin excluded)
  const adminOnSchool = await login('school-password', 'chat@weareimpact.nl', 'Demo1234!')
  console.log('school-password + admin creds  ->', adminOnSchool.sess?.user ? 'INGELOGD (FOUT!)' : 'geweigerd (goed)')
}
main().catch(e => { console.error('ERR', e); process.exit(1) })
