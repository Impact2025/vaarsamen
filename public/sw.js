const CACHE_NAME = 'vaarsamen-v1'

// App shell — altijd offline beschikbaar
const PRECACHE_URLS = [
  '/',
  '/ontdekken',
  '/matches',
  '/profiel',
  '/offline',
]

// ─── INSTALL ──────────────────────────────────────────────────────────────────
// Cache de app shell direct bij installatie
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  )
  self.skipWaiting()
})

// ─── ACTIVATE ─────────────────────────────────────────────────────────────────
// Verwijder oude caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

// ─── FETCH ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Sla non-GET requests en externe URLs altijd over
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  // API calls: altijd netwerk, nooit cache (echte data vereist)
  if (url.pathname.startsWith('/api/')) return

  // _next/static assets: cache first (content-hash = veilig voor altijd cachen)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached ?? fetch(request).then((res) => {
          const clone = res.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          return res
        })
      )
    )
    return
  }

  // Foto's van Vercel Blob: stale-while-revalidate
  if (url.hostname.includes('blob.vercel-storage.com')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request)
        const fetchPromise = fetch(request).then((res) => {
          cache.put(request, res.clone())
          return res
        })
        return cached ?? fetchPromise
      })
    )
    return
  }

  // Overige pagina's: network first, dan cache, dan offline fallback
  event.respondWith(
    fetch(request)
      .then((res) => {
        const clone = res.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        return res
      })
      .catch(async () => {
        const cached = await caches.match(request)
        return cached ?? caches.match('/offline')
      })
  )
})

// ─── PUSH NOTIFICATIES ────────────────────────────────────────────────────────
// Wordt getriggerd door de server bij een nieuw match of bericht
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()

  event.waitUntil(
    self.registration.showNotification(data.title ?? 'VaarSamen', {
      body:    data.body ?? 'Je hebt een nieuw bericht',
      icon:    '/icons/192',
      badge:   '/icons/192',
      vibrate: [100, 50, 100],
      data:    { url: data.url ?? '/matches' },
    })
  )
})

// ─── NOTIFICATIE KLIK ─────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = event.notification.data?.url ?? '/matches'

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(target)
          return client.focus()
        }
      }
      return self.clients.openWindow(target)
    })
  )
})
