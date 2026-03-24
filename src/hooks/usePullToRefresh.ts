'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export function usePullToRefresh(onRefresh: () => void, threshold = 72) {
  const [pulling, setPulling]     = useState(false)
  const [pullY, setPullY]         = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef<number | null>(null)

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setTimeout(() => setRefreshing(false), 600)
    }
  }, [onRefresh])

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (startY.current === null || window.scrollY > 0) return
      const delta = e.touches[0].clientY - startY.current
      if (delta > 0) {
        setPulling(true)
        setPullY(Math.min(delta * 0.4, threshold * 1.5))
      }
    }

    const onTouchEnd = () => {
      if (pulling && pullY >= threshold) {
        handleRefresh()
      }
      setPulling(false)
      setPullY(0)
      startY.current = null
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove', onTouchMove, { passive: true })
    document.addEventListener('touchend', onTouchEnd)

    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [pulling, pullY, threshold, handleRefresh])

  return { pulling, pullY, refreshing }
}
