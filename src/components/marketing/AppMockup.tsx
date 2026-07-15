'use client'

import { useState } from 'react'

const TABS = [
  { id: 'vorderingen', label: 'Vorderingen', icon: 'insights' },
  { id: 'vloot', label: 'Vloot', icon: 'sailing' },
  { id: 'tochten', label: 'Tochten', icon: 'map' },
] as const

type TabId = (typeof TABS)[number]['id']

export function AppMockup() {
  const [tab, setTab] = useState<TabId>('vorderingen')

  return (
    <div className="relative mx-auto w-full max-w-[300px]">
      {/* glow */}
      <div
        aria-hidden="true"
        className="absolute -inset-6 -z-10 rounded-[3rem] bg-primary/10 blur-3xl"
      />
      {/* phone */}
      <div className="relative aspect-[300/600] w-full overflow-hidden rounded-[2.75rem] border border-white/10 bg-[#0a1929] shadow-[0_40px_80px_rgba(0,0,0,.45)]">
        {/* notch */}
        <div className="absolute left-1/2 top-0 z-10 h-5 w-20 -translate-x-1/2 rounded-b-2xl bg-[#0a1929]" />

        {/* statusbar */}
        <div className="flex items-center justify-between px-6 pt-7 text-[10px] font-semibold text-[#d7e3fc]/60">
          <span>9:41</span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>wifi</span>
            <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>battery_full</span>
          </span>
        </div>

        {/* header */}
        <div className="px-5 pb-3 pt-4">
          <p className="font-label text-[10px] uppercase tracking-widest text-primary/80">Zeilschool</p>
          <h4 className="font-headline text-[17px] font-extrabold text-white">De Zwaluw</h4>
        </div>

        {/* tabs */}
        <div className="flex gap-1.5 px-5">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex flex-1 items-center justify-center gap-1 rounded-xl py-2 font-label text-[10px] font-bold transition-colors ${
                tab === t.id
                  ? 'bg-primary text-[#00382b]'
                  : 'bg-white/5 text-[#d7e3fc]/50'
              }`}
            >
              <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* body */}
        <div className="px-5 py-4">
          {tab === 'vorderingen' && <VorderingenBody />}
          {tab === 'vloot' && <VlootBody />}
          {tab === 'tochten' && <TochtenBody />}
        </div>

        {/* bottom nav */}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-around border-t border-white/5 bg-[#0a1929] py-3">
          {['groups', 'calendar_month', 'sailing', 'chat', 'person'].map((ic, i) => (
            <span
              key={ic}
              className={`material-symbols-outlined text-[18px] ${
                i === 2 ? 'text-primary' : 'text-[#d7e3fc]/35'
              }`}
              style={{ fontVariationSettings: "'FILL' 1" }}
              aria-hidden="true"
            >
              {ic}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function VorderingenBody() {
  const rows = [
    { name: 'Sven', skill: 'Op- en afschepen', score: 'B' },
    { name: 'Femke', skill: 'Overstag gaan', score: 'R' },
    { name: 'Joep', skill: 'Ankeren', score: 'A' },
    { name: 'Lisa', skill: 'Manoeuvreren', score: 'M' },
  ]
  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-2xl bg-gradient-to-br from-[#1a3a5c] to-[#0d2140] p-4">
        <p className="font-label text-[10px] text-[#d7e3fc]/60">Cursusvoortgang</p>
        <p className="font-headline text-2xl font-black text-white">78%</p>
        <p className="font-label text-[10px] text-primary">CWO I — 12 van 16 vaardigheden</p>
      </div>
      {rows.map((r) => (
        <div key={r.name} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2.5">
          <div>
            <p className="font-label text-[11px] font-bold text-white">{r.name}</p>
            <p className="font-label text-[9px] text-[#d7e3fc]/50">{r.skill}</p>
          </div>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20 font-headline text-[13px] font-extrabold text-primary">
            {r.score}
          </span>
        </div>
      ))}
    </div>
  )
}

function VlootBody() {
  const boats = [
    { n: 'V12', t: 'Laser', status: 'Beschikbaar' },
    { n: 'V07', t: 'Catalina', status: 'In les' },
    { n: 'V03', t: 'Optimist', status: 'Onderhoud' },
  ]
  return (
    <div className="flex flex-col gap-2">
      {boats.map((b) => (
        <div key={b.n} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
              <span className="material-symbols-outlined text-[16px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>sailing</span>
            </span>
            <div>
              <p className="font-label text-[11px] font-bold text-white">{b.t}</p>
              <p className="font-label text-[9px] text-[#d7e3fc]/50">Boot {b.n}</p>
            </div>
          </div>
          <span className={`rounded-full px-2 py-0.5 font-label text-[9px] font-bold ${
            b.status === 'Beschikbaar'
              ? 'bg-primary/20 text-primary'
              : b.status === 'In les'
                ? 'bg-amber-400/20 text-amber-300'
                : 'bg-red-400/20 text-red-300'
          }`}>
            {b.status}
          </span>
        </div>
      ))}
    </div>
  )
}

function TochtenBody() {
  const trips = [
    { t: 'Spiegelplas — CWO II', d: 'Za 12 jul · 09:00', crew: '3/4' },
    { t: 'IJsselmeer tocht', d: 'Wo 16 jul · 13:30', crew: '2/5' },
  ]
  return (
    <div className="flex flex-col gap-2">
      {trips.map((x) => (
        <div key={x.t} className="rounded-xl bg-white/5 px-3 py-3">
          <p className="font-label text-[11px] font-bold text-white">{x.t}</p>
          <div className="mt-1 flex items-center justify-between">
            <p className="font-label text-[9px] text-[#d7e3fc]/50">{x.d}</p>
            <span className="rounded-full bg-primary/20 px-2 py-0.5 font-label text-[9px] font-bold text-primary">
              Crew {x.crew}
            </span>
          </div>
        </div>
      ))}
      <div className="mt-1 flex items-center justify-center gap-1 rounded-xl border border-dashed border-primary/30 py-3 font-label text-[10px] font-bold text-primary">
        <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
        Nieuwe tocht plaatsen
      </div>
    </div>
  )
}
