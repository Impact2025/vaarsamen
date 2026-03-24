'use client'

import { useState, useEffect, useCallback } from 'react'

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export type PushState = 'unsupported' | 'denied' | 'granted' | 'default'

export function usePushNotifications() {
  const [state, setState]   = useState<PushState>('default')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported')
      return
    }
    setState(Notification.permission as PushState)
  }, [])

  const subscribe = useCallback(async () => {
    if (!VAPID_PUBLIC || !('serviceWorker' in navigator)) return
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC) as unknown as Uint8Array<ArrayBuffer>,
      })
      await fetch('/api/push/subscribe', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(sub.toJSON()),
      })
      setState('granted')
    } catch {
      setState(Notification.permission as PushState)
    } finally {
      setLoading(false)
    }
  }, [])

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return
    const result = await Notification.requestPermission()
    setState(result as PushState)
    if (result === 'granted') await subscribe()
  }, [subscribe])

  return { state, loading, requestPermission }
}
