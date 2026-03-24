'use client'

import { useCallback, useMemo } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { CWO_ORDER, type CWOLevel } from '@/types'
import type { TochtMetPoster } from '@/lib/db/queries/tochten'
import {
  startOfWeek, endOfWeek, addWeeks, isWithinInterval,
  parseISO, isSameDay,
} from 'date-fns'

export type DatumFilter = 'alles' | 'deze_week' | 'dit_weekend' | 'volgende_week' | string
export type SorteerOp   = 'datum' | 'populair'
export type Weergave    = 'lijst' | 'kalender'

export interface FilterState {
  zoekterm:     string
  vaargebieden: string[]
  datumFilter:  DatumFilter
  bootType:     string
  cwoFilter:    'alle' | 'voor_mij'
  sorteer:      SorteerOp
  weergave:     Weergave
}

function fromURL(sp: URLSearchParams): FilterState {
  return {
    zoekterm:     sp.get('q') ?? '',
    vaargebieden: sp.get('g')?.split(',').filter(Boolean) ?? [],
    datumFilter:  (sp.get('d') ?? 'alles') as DatumFilter,
    bootType:     sp.get('b') ?? '',
    cwoFilter:    (sp.get('c') ?? 'alle') as 'alle' | 'voor_mij',
    sorteer:      (sp.get('s') ?? 'datum') as SorteerOp,
    weergave:     (sp.get('v') ?? 'lijst') as Weergave,
  }
}

function toURL(f: FilterState): string {
  const p = new URLSearchParams()
  if (f.zoekterm)                p.set('q', f.zoekterm)
  if (f.vaargebieden.length > 0) p.set('g', f.vaargebieden.join(','))
  if (f.datumFilter !== 'alles') p.set('d', f.datumFilter)
  if (f.bootType)                p.set('b', f.bootType)
  if (f.cwoFilter !== 'alle')    p.set('c', f.cwoFilter)
  if (f.sorteer !== 'datum')     p.set('s', f.sorteer)
  if (f.weergave !== 'lijst')    p.set('v', f.weergave)
  const str = p.toString()
  return str ? '?' + str : ''
}

export function useTochtenFilters(
  alleTochten: TochtMetPoster[],
  userCwoLevel: CWOLevel = 'geen',
  userSailingAreas: string[] = [],
) {
  const router      = useRouter()
  const pathname    = usePathname()
  const searchParams = useSearchParams()

  // Filter state komt altijd uit de URL — geen useState nodig
  const filters = useMemo(() => fromURL(searchParams), [searchParams])

  const pushFilters = useCallback((next: FilterState) => {
    router.replace(pathname + toURL(next), { scroll: false })
  }, [router, pathname])

  const setFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    pushFilters({ ...fromURL(searchParams), [key]: value })
  }, [searchParams, pushFilters])

  const toggleGebied = useCallback((id: string) => {
    const cur = fromURL(searchParams)
    const next = cur.vaargebieden.includes(id)
      ? cur.vaargebieden.filter(g => g !== id)
      : [...cur.vaargebieden, id]
    pushFilters({ ...cur, vaargebieden: next })
  }, [searchParams, pushFilters])

  const resetFilters = useCallback(() => {
    const cur = fromURL(searchParams)
    pushFilters({
      zoekterm: '', vaargebieden: [], datumFilter: 'alles',
      bootType: '', cwoFilter: 'alle', sorteer: 'datum',
      weergave: cur.weergave, // weergave bewaren
    })
  }, [searchParams, pushFilters])

  const activeFilterCount = useMemo(() => [
    filters.vaargebieden.length > 0,
    filters.datumFilter !== 'alles',
    filters.bootType !== '',
    filters.cwoFilter !== 'alle',
    filters.sorteer !== 'datum',
  ].filter(Boolean).length, [filters])

  const hasActiveFilters = activeFilterCount > 0 || filters.zoekterm !== ''

  // ── Datum helpers ──────────────────────────────────────────────────────────
  const datumRange = useMemo((): { van: Date; tot: Date } | null => {
    const nu = new Date()
    if (filters.datumFilter === 'alles') return null
    if (filters.datumFilter === 'deze_week')
      return { van: startOfWeek(nu, { weekStartsOn: 1 }), tot: endOfWeek(nu, { weekStartsOn: 1 }) }
    if (filters.datumFilter === 'volgende_week') {
      const vw = addWeeks(nu, 1)
      return { van: startOfWeek(vw, { weekStartsOn: 1 }), tot: endOfWeek(vw, { weekStartsOn: 1 }) }
    }
    if (filters.datumFilter === 'dit_weekend') {
      const zo = endOfWeek(nu, { weekStartsOn: 1 })
      const za = new Date(zo); za.setDate(zo.getDate() - 1)
      return { van: za, tot: zo }
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(filters.datumFilter)) {
      const d = parseISO(filters.datumFilter)
      return { van: d, tot: d }
    }
    return null
  }, [filters.datumFilter])

  // ── Gefilterde tochten ────────────────────────────────────────────────────
  const gefilterd = useMemo(() => {
    let result = [...alleTochten]

    const needle = filters.zoekterm.toLowerCase().trim()
    if (needle) {
      result = result.filter(({ tocht }) =>
        tocht.titel.toLowerCase().includes(needle) ||
        (tocht.beschrijving?.toLowerCase().includes(needle) ?? false) ||
        (tocht.locatie?.toLowerCase().includes(needle) ?? false)
      )
    }

    if (filters.vaargebieden.length > 0)
      result = result.filter(({ tocht }) => filters.vaargebieden.includes(tocht.vaargebied))

    if (datumRange) {
      result = result.filter(({ tocht }) => {
        const d = parseISO(tocht.datum as string)
        return /^\d{4}-\d{2}-\d{2}$/.test(filters.datumFilter) && datumRange.van === datumRange.tot
          ? isSameDay(d, datumRange.van)
          : isWithinInterval(d, { start: datumRange.van, end: datumRange.tot })
      })
    }

    if (filters.bootType)
      result = result.filter(({ tocht }) => tocht.bootType === filters.bootType)

    if (filters.cwoFilter === 'voor_mij') {
      const myLevel = CWO_ORDER[userCwoLevel]
      result = result.filter(({ tocht }) =>
        CWO_ORDER[(tocht.cwoMinimum as CWOLevel) ?? 'geen'] <= myLevel
      )
    }

    if (filters.sorteer === 'populair')
      result = result.sort((a, b) => b.aanmeldingen - a.aanmeldingen || (a.tocht.datum as string).localeCompare(b.tocht.datum as string))

    return result
  }, [alleTochten, filters, datumRange, userCwoLevel])

  // ── Personalized ─────────────────────────────────────────────────────────
  const voorJou = useMemo(() => {
    if (userSailingAreas.length === 0) return []
    const myLevel = CWO_ORDER[userCwoLevel]
    return alleTochten.filter(({ tocht }) =>
      userSailingAreas.includes(tocht.vaargebied) &&
      CWO_ORDER[(tocht.cwoMinimum as CWOLevel) ?? 'geen'] <= myLevel
    ).slice(0, 8)
  }, [alleTochten, userSailingAreas, userCwoLevel])

  // ── Deze week ─────────────────────────────────────────────────────────────
  const dezeWeek = useMemo(() => {
    const nu  = new Date()
    const tot = endOfWeek(nu, { weekStartsOn: 1 })
    return alleTochten.filter(({ tocht }) =>
      isWithinInterval(parseISO(tocht.datum as string), { start: nu, end: tot })
    )
  }, [alleTochten])

  // ── Kalender ──────────────────────────────────────────────────────────────
  const tochtenPerDag = useMemo(() => {
    const map = new Map<string, TochtMetPoster[]>()
    gefilterd.forEach(item => {
      const key = item.tocht.datum as string
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(item)
    })
    return map
  }, [gefilterd])

  return {
    filters, setFilter, toggleGebied, resetFilters,
    activeFilterCount, hasActiveFilters,
    gefilterd, voorJou, dezeWeek, tochtenPerDag,
  }
}
