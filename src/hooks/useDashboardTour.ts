'use client'

import { useEffect, useState } from 'react'

const KEYS = {
  school:  'vaarsamen_school_tour_v1',
  cursist: 'vaarsamen_cursist_tour_v1',
} as const

type TourType = keyof typeof KEYS

export function useDashboardTour(type: TourType) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // sessionStorage: reset automatisch bij uitloggen / nieuw tabblad
    if (!sessionStorage.getItem(KEYS[type])) {
      const t = setTimeout(() => setShow(true), 900)
      return () => clearTimeout(t)
    }
  }, [type])

  const dismiss = () => {
    sessionStorage.setItem(KEYS[type], '1')
    setShow(false)
  }

  return { show, dismiss }
}
