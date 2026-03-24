'use client'

import { useEffect, useState } from 'react'

const TOUR_KEY = 'vaarsamen_tour_v1'

export function useWelcomeTour() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(TOUR_KEY)) {
      // Kleine vertraging zodat de pagina eerst laadt
      const t = setTimeout(() => setShow(true), 600)
      return () => clearTimeout(t)
    }
  }, [])

  const dismiss = () => {
    localStorage.setItem(TOUR_KEY, '1')
    setShow(false)
  }

  return { show, dismiss }
}
