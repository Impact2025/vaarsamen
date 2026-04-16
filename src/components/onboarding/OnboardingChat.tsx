'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { PostcodeVeld, type PostcodeResult } from '@/components/ui/PostcodeVeld'
import {
  CWO_LABELS, SAILING_AREAS, SKILL_TAGS, BOAT_LABELS,
  ROLE_LABELS, ROLE_EMOJI, LOOKING_FOR_LABELS,
  type CWOLevel, type BoatType, type SailingRole, type LookingFor,
} from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 'naam' | 'foto' | 'locatie' | 'niveau' | 'rol' | 'boot' | 'gebieden' | 'bio' | 'preview' | 'klaar'
type FontSize = 'normal' | 'large' | 'xl'
interface Msg { id: string; from: 'lars' | 'user'; text: string }

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS: Step[] = ['naam', 'foto', 'locatie', 'niveau', 'rol', 'boot', 'gebieden', 'bio', 'preview', 'klaar']

const CWO_OPTIONS: { level: CWOLevel; desc: string }[] = [
  { level: 'geen',          desc: 'Beginner of leerbereid' },
  { level: 'cwo1',          desc: 'Basiszeilen binnenwater' },
  { level: 'cwo2',          desc: 'Zelfstandig zeilen' },
  { level: 'cwo3',          desc: 'Gevorderd, buitenwater' },
  { level: 'cwo4',          desc: 'Expert niveau' },
  { level: 'cwo_kielboot1', desc: 'Basis kielboot' },
  { level: 'cwo_kielboot2', desc: 'Gevorderd kielboot' },
  { level: 'cwo_kielboot3', desc: 'Expert kielboot' },
]

const BOAT_OPTIONS: { type: BoatType; emoji: string }[] = [
  { type: 'valk',        emoji: '⛵' }, { type: 'polyvalk',    emoji: '⛵' },
  { type: 'laser',       emoji: '🏄' }, { type: 'laser_pico',  emoji: '🏄' },
  { type: 'rs_feva',     emoji: '🏄' }, { type: 'kajuitjacht', emoji: '🛥️' },
  { type: 'catamaran',   emoji: '⛵' }, { type: 'anders',      emoji: '🚢' },
]

const ROLES: SailingRole[] = ['schipper', 'bemanning', 'beide']
const LF_OPTS: LookingFor[] = ['dagje_varen', 'weekend', 'regatta', 'zeilvakantie', 'alles']

let _msgId = 0
const uid = () => `m${++_msgId}-${Date.now()}`

// ─── Main component ───────────────────────────────────────────────────────────

export function OnboardingChat() {
  const router = useRouter()

  // Chat
  const [messages, setMessages] = useState<Msg[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [step, setStep]         = useState<Step>('naam')
  const [fontSize, setFontSize] = useState<FontSize>('normal')

  // Collected data
  const [displayName,  setDisplayName]  = useState('')
  const [photoUrl,     setPhotoUrl]     = useState<string | null>(null)
  const [location,     setLocation]     = useState<PostcodeResult | null>(null)
  const [homePort,     setHomePort]     = useState('')
  const [cwoLevel,     setCwoLevel]     = useState<CWOLevel | null>(null)
  const [sailingRole,  setSailingRole]  = useState<SailingRole | null>(null)
  const [lookingFor,   setLookingFor]   = useState<LookingFor[]>([])
  const [hasBoat,      setHasBoat]      = useState<boolean | null>(null)
  const [boatTypes,    setBoatTypes]    = useState<BoatType[]>([])
  const [sailingAreas, setSailingAreas] = useState<string[]>([])
  const [skillTags,    setSkillTags]    = useState<string[]>([])
  const [bio,          setBio]          = useState('')

  // Temp input state
  const [nameInput,     setNameInput]     = useState('')
  const [isUploading,   setIsUploading]   = useState(false)
  const [homePortInput, setHomePortInput] = useState('')
  const [bioInput,      setBioInput]      = useState('')

  // Submit
  const [isSaving,  setIsSaving]  = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Refs
  const chatRef    = useRef<HTMLElement>(null)
  const inputRef   = useRef<HTMLInputElement>(null)
  const timersRef  = useRef<ReturnType<typeof setTimeout>[]>([])

  // ─── Font size (persisted) ─────────────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem('vs_font_size') as FontSize | null
    if (stored) setFontSize(stored)
  }, [])

  const cycleFontSize = () => {
    const order: FontSize[] = ['normal', 'large', 'xl']
    const next = order[(order.indexOf(fontSize) + 1) % 3]
    setFontSize(next)
    localStorage.setItem('vs_font_size', next)
  }

  // ─── Scroll to bottom on new message ──────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      if (chatRef.current) {
        chatRef.current.scrollTop = chatRef.current.scrollHeight
      }
    }, 80)
    return () => clearTimeout(t)
  }, [messages, isTyping])

  // ─── Lars message scheduler ────────────────────────────────────────────────
  const showLarsMessages = (msgs: string[]) => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    setIsTyping(false)

    let delay = 0
    msgs.forEach((msg, i) => {
      const typingMs = Math.min(300 + msg.length * 14, 1600)
      const t1 = setTimeout(() => setIsTyping(true),  delay)
      delay += typingMs
      const t2 = setTimeout(() => {
        setIsTyping(false)
        setMessages(prev => [...prev, { id: uid(), from: 'lars', text: msg }])
      }, delay)
      if (i < msgs.length - 1) delay += 400
      timersRef.current.push(t1, t2)
    })
  }

  useEffect(() => () => timersRef.current.forEach(clearTimeout), [])

  // ─── Initial messages ──────────────────────────────────────────────────────
  useEffect(() => {
    showLarsMessages([
      'Hoi! Ik ben Lars, jouw gids bij VaarSamen. 👋',
      'We zijn zo klaar — echt maar 5 minuten. Wat is jouw voornaam?',
    ])
    const t = setTimeout(() => inputRef.current?.focus(), 1800)
    timersRef.current.push(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const addUser = (text: string) =>
    setMessages(prev => [...prev, { id: uid(), from: 'user', text }])

  const goTo = (nextStep: Step, msgs: string[]) => {
    setStep(nextStep)
    showLarsMessages(msgs)
  }

  // ─── Step handlers ─────────────────────────────────────────────────────────

  const confirmNaam = () => {
    const name = nameInput.trim()
    if (name.length < 2) return
    setDisplayName(name)
    addUser(name)
    goTo('foto', [
      `${name}, wat leuk!`,
      'Wil je een foto toevoegen? Zeilers met een foto krijgen veel meer reacties.',
    ])
  }

  const confirmFoto = (skipped: boolean) => {
    addUser(skipped ? 'Geen foto nu' : 'Foto toegevoegd')
    goTo('locatie', ['Vanwaar kom je? We vinden zeilers bij jou in de buurt.'])
  }

  const confirmLocatie = () => {
    if (!location) return
    setHomePort(homePortInput)
    addUser(`${location.city}${homePortInput ? ` · ${homePortInput}` : ''}`)
    goTo('niveau', ['Wat is je CWO-niveau?'])
  }

  const confirmNiveau = (level: CWOLevel) => {
    setCwoLevel(level)
    addUser(CWO_LABELS[level])
    goTo('rol', [
      'Ben je schipper, bemanning, of allebei?',
      'En wat voor vaartochten zoek je?',
    ])
  }

  const confirmRol = () => {
    if (!sailingRole) return
    addUser(ROLE_LABELS[sailingRole])
    goTo('boot', ['Heb je een eigen boot?'])
  }

  const confirmBoot = () => {
    if (hasBoat === null) return
    addUser(
      hasBoat
        ? `Ja · ${boatTypes.map(t => BOAT_LABELS[t]).join(', ') || 'type volgt'}`
        : 'Nee, ik zoek een schipper'
    )
    goTo('gebieden', [
      'Waar vaar je het liefst? Kies je favoriete gebieden.',
      'Je kunt er meerdere kiezen. Welke vaardigheden heb je?',
    ])
  }

  const confirmGebieden = () => {
    addUser(
      sailingAreas.length
        ? sailingAreas.map(id => SAILING_AREAS.find(a => a.id === id)?.label ?? id).join(', ')
        : 'Nog geen voorkeur'
    )
    goTo('bio', [
      'Bijna klaar!',
      'Schrijf een korte bio — iets over jezelf als zeiler. Mag ook één zin zijn.',
    ])
  }

  const confirmBio = (skipped: boolean) => {
    const text = skipped ? '' : bioInput.trim()
    setBio(text)
    addUser(text || '(geen bio)')
    goTo('preview', [
      'Zo ziet jouw profiel eruit!',
      'Ziet er goed uit? Dan zijn we klaar voor het water!',
    ])
  }

  const handleSubmit = async () => {
    setIsSaving(true)
    setSaveError(null)
    try {
      // lookingFor: schema verwacht een enkele waarde, niet een array
      const singleLookingFor = lookingFor.includes('alles') || lookingFor.length === 0
        ? 'alles'
        : lookingFor[0]

      const res = await fetch('/api/profiles', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          displayName,
          photoUrl,
          postcode:    location?.postcode,
          city:        location?.city,
          lat:         location?.lat,
          lng:         location?.lng,
          homePort:    homePort || undefined,
          cwoLevel:    cwoLevel!,
          sailingRole: sailingRole!,
          lookingFor:  singleLookingFor,
          sailingAreas,
          skillTags,
          bio:         bio || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        // data.error kan een string of een Zod-flatten object zijn
        const msg = typeof data.error === 'string'
          ? data.error
          : 'Validatie mislukt — controleer je gegevens'
        throw new Error(msg)
      }
      if (hasBoat && boatTypes.length) {
        await Promise.all(boatTypes.map(type =>
          fetch('/api/boats', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ type }),
          })
        ))
      }
      await fetch('/api/profiles/complete', { method: 'POST' })
      setStep('klaar')
      setTimeout(() => router.push('/ontdekken'), 3500)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Er ging iets mis')
    } finally {
      setIsSaving(false)
    }
  }

  // ─── Font-size derived classes ─────────────────────────────────────────────
  const fsBody  = fontSize === 'normal' ? 'text-base'  : fontSize === 'large' ? 'text-lg'   : 'text-xl'
  const fsLabel = fontSize === 'normal' ? 'text-sm'    : fontSize === 'large' ? 'text-base'  : 'text-lg'
  const fsSmall = fontSize === 'normal' ? 'text-xs'    : fontSize === 'large' ? 'text-sm'    : 'text-base'

  const stepIdx  = STEPS.indexOf(step)
  const progress = Math.round((stepIdx / (STEPS.length - 1)) * 100)

  // ─── Confetti screen ───────────────────────────────────────────────────────
  if (step === 'klaar') return <KlaarScherm name={displayName} />

  // ─── Main render ───────────────────────────────────────────────────────────
  return (
    <div className={`min-h-dvh bg-surface flex flex-col`}>
      {/* ── Header ── */}
      <header className="flex-none px-4 pt-4 pb-3 bg-surface/95 backdrop-blur-sm sticky top-0 z-10 border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center shadow-glow flex-shrink-0" aria-hidden="true">
              <span className="material-symbols-outlined text-on-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>sailing</span>
            </div>
            <div>
              <p className={`font-label font-bold text-on-surface leading-none ${fsLabel}`}>Lars</p>
              <p className={`font-body text-on-surface-variant leading-none mt-0.5 ${fsSmall}`}>Jouw VaarSamen gids</p>
            </div>
          </div>

          {/* Font size toggle */}
          <button
            onClick={cycleFontSize}
            className="flex items-end gap-0.5 px-3 py-2 rounded-full bg-surface-container border border-white/10 hover:border-primary/30 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={`Lettergrootte: ${fontSize === 'normal' ? 'normaal' : fontSize === 'large' ? 'groot' : 'extra groot'}. Klik om te wisselen.`}
          >
            {(['normal', 'large', 'xl'] as FontSize[]).map((fs, i) => (
              <span
                key={fs}
                className="font-headline font-black text-primary leading-none transition-opacity"
                style={{ fontSize: 9 + i * 3, opacity: fontSize === fs ? 1 : 0.35 }}
                aria-hidden="true"
              >
                A
              </span>
            ))}
          </button>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between mb-1">
            <span className={`font-label text-on-surface-variant ${fsSmall}`}>
              Stap {Math.min(stepIdx + 1, STEPS.length - 1)} van {STEPS.length - 1}
            </span>
            <span className={`font-label text-primary ${fsSmall}`}>{progress}%</span>
          </div>
          <div
            className="h-1.5 bg-surface-container-high rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Voortgang registratie"
          >
            <motion.div
              className="h-full gradient-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      </header>

      {/* ── Chat messages ── */}
      <main
        ref={chatRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
        aria-live="polite"
        aria-label="Gesprek met Lars"
      >
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className={`flex gap-2 ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.from === 'lars' && (
                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center flex-shrink-0 mt-1 shadow-glow" aria-hidden="true">
                  <span className="material-symbols-outlined text-on-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>sailing</span>
                </div>
              )}
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl ${fsBody} ${
                  msg.from === 'lars'
                    ? 'bg-surface-container-high text-on-surface rounded-tl-sm'
                    : 'gradient-primary text-on-primary rounded-tr-sm'
                }`}
              >
                <p className="font-body leading-snug">{msg.text}</p>
              </div>
            </motion.div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-end gap-2"
              aria-label="Lars is aan het typen…"
            >
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center flex-shrink-0 shadow-glow" aria-hidden="true">
                <span className="material-symbols-outlined text-on-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>sailing</span>
              </div>
              <div className="px-4 py-3.5 rounded-2xl rounded-tl-sm bg-surface-container-high flex gap-1.5 items-center">
                {[0, 1, 2].map(i => (
                  <motion.span
                    key={i}
                    className="w-2 h-2 rounded-full bg-on-surface-variant"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.18 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* ── Input footer ── */}
      <footer className="flex-none bg-surface/95 backdrop-blur-sm border-t border-white/5 px-4 pt-4 pb-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            {step === 'naam' && (
              <NaamInput
                value={nameInput}
                onChange={setNameInput}
                onConfirm={confirmNaam}
                inputRef={inputRef}
                fsBody={fsBody}
              />
            )}
            {step === 'foto' && (
              <FotoInput
                photoUrl={photoUrl}
                isUploading={isUploading}
                setIsUploading={setIsUploading}
                setPhotoUrl={setPhotoUrl}
                onConfirm={confirmFoto}
                fsBody={fsBody}
                fsLabel={fsLabel}
              />
            )}
            {step === 'locatie' && (
              <LocatieInput
                location={location}
                setLocation={setLocation}
                homePortInput={homePortInput}
                setHomePortInput={setHomePortInput}
                onConfirm={confirmLocatie}
                fsBody={fsBody}
              />
            )}
            {step === 'niveau' && (
              <NiveauInput
                onSelect={confirmNiveau}
                fsBody={fsBody}
                fsSmall={fsSmall}
              />
            )}
            {step === 'rol' && (
              <RolInput
                sailingRole={sailingRole}
                setSailingRole={setSailingRole}
                lookingFor={lookingFor}
                setLookingFor={setLookingFor}
                onConfirm={confirmRol}
                fsBody={fsBody}
                fsSmall={fsSmall}
              />
            )}
            {step === 'boot' && (
              <BootInput
                hasBoat={hasBoat}
                setHasBoat={setHasBoat}
                boatTypes={boatTypes}
                setBoatTypes={setBoatTypes}
                onConfirm={confirmBoot}
                fsBody={fsBody}
                fsSmall={fsSmall}
              />
            )}
            {step === 'gebieden' && (
              <GebiedenInput
                sailingAreas={sailingAreas}
                setSailingAreas={setSailingAreas}
                skillTags={skillTags}
                setSkillTags={setSkillTags}
                onConfirm={confirmGebieden}
                fsBody={fsBody}
                fsLabel={fsLabel}
                fsSmall={fsSmall}
              />
            )}
            {step === 'bio' && (
              <BioInput
                value={bioInput}
                onChange={setBioInput}
                onConfirm={confirmBio}
                fsBody={fsBody}
                fsLabel={fsLabel}
                fsSmall={fsSmall}
              />
            )}
            {step === 'preview' && (
              <PreviewInput
                displayName={displayName}
                photoUrl={photoUrl}
                city={location?.city}
                homePort={homePort}
                cwoLevel={cwoLevel}
                sailingAreas={sailingAreas}
                bio={bio}
                isSaving={isSaving}
                saveError={saveError}
                onSubmit={handleSubmit}
                fsBody={fsBody}
                fsLabel={fsLabel}
                fsSmall={fsSmall}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </footer>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function NaamInput({
  value, onChange, onConfirm, inputRef, fsBody,
}: {
  value: string; onChange: (v: string) => void; onConfirm: () => void
  inputRef: React.RefObject<HTMLInputElement | null>; fsBody: string
}) {
  return (
    <div className="flex gap-2">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onConfirm()}
        placeholder="Jouw voornaam…"
        maxLength={50}
        autoComplete="given-name"
        aria-label="Voornaam invoeren"
        className={`flex-1 px-4 py-4 bg-surface-container-high rounded-2xl
          text-on-surface placeholder:text-on-surface-variant/40
          border border-white/10 focus:border-primary/50 ${fsBody} font-body
          focus:outline-none focus-visible:ring-1 focus-visible:ring-primary`}
      />
      <button
        onClick={onConfirm}
        disabled={value.trim().length < 2}
        aria-label="Naam bevestigen"
        className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center
                   shadow-glow disabled:opacity-40 active:scale-95 transition-all flex-shrink-0
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span className="material-symbols-outlined text-on-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
          arrow_forward
        </span>
      </button>
    </div>
  )
}

function FotoInput({
  photoUrl, isUploading, setIsUploading, setPhotoUrl, onConfirm, fsBody, fsLabel,
}: {
  photoUrl: string | null; isUploading: boolean
  setIsUploading: (v: boolean) => void; setPhotoUrl: (url: string | null) => void
  onConfirm: (skipped: boolean) => void; fsBody: string; fsLabel: string
}) {
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res  = await fetch('/api/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (data.url) setPhotoUrl(data.url)
    } catch {
      // silent — user can skip
    } finally {
      setIsUploading(false)
    }
  }

  if (photoUrl) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 border border-primary/30">
          <Image src={photoUrl} alt="Profielfoto preview" width={64} height={64} className="object-cover w-full h-full" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-label font-bold text-on-surface ${fsBody}`}>Foto toegevoegd!</p>
          <label htmlFor="foto-opnieuw" className={`font-body text-primary underline cursor-pointer ${fsLabel}`}>
            Andere foto kiezen
          </label>
          <input id="foto-opnieuw" type="file" accept="image/*" className="sr-only" onChange={handleUpload} />
        </div>
        <button
          onClick={() => onConfirm(false)}
          className="px-5 py-3.5 rounded-2xl gradient-primary text-on-primary font-headline font-extrabold
                     shadow-glow active:scale-95 transition-all flex-shrink-0
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Verder →
        </button>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <label
        htmlFor="foto-upload"
        className={`flex-1 py-4 rounded-2xl bg-surface-container-high border border-white/10
          hover:border-primary/40 flex items-center justify-center gap-2 cursor-pointer
          transition-all focus-within:ring-1 focus-within:ring-primary ${fsBody}`}
      >
        <span
          className={`material-symbols-outlined text-primary ${isUploading ? 'animate-spin' : ''}`}
          style={{ fontVariationSettings: "'FILL' 1" }}
          aria-hidden="true"
        >
          {isUploading ? 'progress_activity' : 'add_a_photo'}
        </span>
        <span className="font-label font-bold text-on-surface">
          {isUploading ? 'Uploaden…' : 'Foto toevoegen'}
        </span>
        <input id="foto-upload" type="file" accept="image/*" capture="user" className="sr-only" onChange={handleUpload} disabled={isUploading} />
      </label>
      <button
        onClick={() => onConfirm(true)}
        className={`px-4 py-4 rounded-2xl bg-surface-container border border-white/10
          text-on-surface-variant font-label font-bold hover:border-white/20 transition-all
          focus:outline-none focus-visible:ring-2 focus-visible:ring-primary flex-shrink-0 ${fsLabel}`}
      >
        Later
      </button>
    </div>
  )
}

function LocatieInput({
  location, setLocation, homePortInput, setHomePortInput, onConfirm, fsBody,
}: {
  location: PostcodeResult | null
  setLocation: (r: PostcodeResult | null) => void
  homePortInput: string; setHomePortInput: (v: string) => void
  onConfirm: () => void; fsBody: string
}) {
  return (
    <div className="space-y-3">
      <PostcodeVeld onResolved={setLocation} onClear={() => setLocation(null)} />
      <input
        type="text"
        value={homePortInput}
        onChange={e => setHomePortInput(e.target.value)}
        placeholder="Thuishaven (optioneel) — bijv. WSV De Pelikaan"
        maxLength={100}
        aria-label="Thuishaven (optioneel)"
        className={`w-full px-4 py-4 bg-surface-container-high rounded-2xl
          text-on-surface placeholder:text-on-surface-variant/40
          border border-white/10 focus:border-primary/50 ${fsBody} font-body
          focus:outline-none focus-visible:ring-1 focus-visible:ring-primary`}
      />
      <button
        onClick={onConfirm}
        disabled={!location}
        className="w-full py-4 rounded-2xl gradient-primary text-on-primary
                   font-headline font-extrabold shadow-glow text-lg
                   disabled:opacity-40 active:scale-95 transition-all
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        Verder →
      </button>
    </div>
  )
}

function NiveauInput({
  onSelect, fsBody, fsSmall,
}: {
  onSelect: (level: CWOLevel) => void; fsBody: string; fsSmall: string
}) {
  return (
    <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar" role="radiogroup" aria-label="CWO niveau kiezen — tik om te selecteren">
      {CWO_OPTIONS.map(({ level, desc }) => (
        <button
          key={level}
          role="radio"
          aria-checked={false}
          onClick={() => onSelect(level)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/10
            bg-surface-container hover:border-primary/40 hover:bg-primary/5 active:scale-[0.98]
            transition-all text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
        >
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 0" }} aria-hidden="true">anchor</span>
          <div className="flex-1 min-w-0">
            <p className={`font-label font-bold text-on-surface ${fsBody}`}>{CWO_LABELS[level]}</p>
            <p className={`font-body text-on-surface-variant ${fsSmall}`}>{desc}</p>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant/30 text-sm flex-shrink-0" aria-hidden="true">chevron_right</span>
        </button>
      ))}
    </div>
  )
}

function RolInput({
  sailingRole, setSailingRole, lookingFor, setLookingFor, onConfirm, fsBody, fsSmall,
}: {
  sailingRole: SailingRole | null; setSailingRole: (r: SailingRole) => void
  lookingFor: LookingFor[]; setLookingFor: (lf: LookingFor[]) => void
  onConfirm: () => void; fsBody: string; fsSmall: string
}) {
  const toggleLF = (lf: LookingFor) => {
    if (lf === 'alles') { setLookingFor(['alles']); return }
    const without = lookingFor.filter((x: LookingFor) => x !== 'alles')
    if (without.includes(lf)) {
      setLookingFor(without.filter((x: LookingFor) => x !== lf))
    } else {
      setLookingFor([...without, lf])
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Rol kiezen">
        {ROLES.map(r => (
          <button
            key={r}
            role="radio"
            aria-checked={sailingRole === r}
            onClick={() => setSailingRole(r)}
            className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border transition-all
              focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
              ${sailingRole === r
                ? 'border-primary/60 bg-primary/10'
                : 'border-white/10 bg-surface-container hover:border-white/20'}`}
          >
            <span className="text-2xl" aria-hidden="true">{ROLE_EMOJI[r]}</span>
            <span className={`font-label font-bold text-center leading-tight ${sailingRole === r ? 'text-primary' : 'text-on-surface'} ${fsSmall}`}>
              {ROLE_LABELS[r]}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Wat zoek je?">
        {LF_OPTS.map(lf => {
          const sel = lookingFor.includes(lf)
          return (
            <button
              key={lf}
              aria-pressed={sel}
              onClick={() => toggleLF(lf)}
              className={`px-3 py-2 rounded-full border font-label font-bold transition-all
                focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${fsSmall}
                ${sel
                  ? 'border-primary/60 bg-primary/10 text-primary'
                  : 'border-white/10 bg-surface-container text-on-surface-variant hover:border-white/20'}`}
            >
              {LOOKING_FOR_LABELS[lf]}
            </button>
          )
        })}
      </div>

      <button
        onClick={onConfirm}
        disabled={!sailingRole}
        className="w-full py-4 rounded-2xl gradient-primary text-on-primary
                   font-headline font-extrabold text-lg shadow-glow
                   disabled:opacity-40 active:scale-95 transition-all
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        Verder →
      </button>
    </div>
  )
}

function BootInput({
  hasBoat, setHasBoat, boatTypes, setBoatTypes, onConfirm, fsBody, fsSmall,
}: {
  hasBoat: boolean | null; setHasBoat: (v: boolean) => void
  boatTypes: BoatType[]; setBoatTypes: (types: BoatType[]) => void
  onConfirm: () => void; fsBody: string; fsSmall: string
}) {
  const toggle = (type: BoatType) =>
    setBoatTypes(boatTypes.includes(type) ? boatTypes.filter(t => t !== type) : [...boatTypes, type])

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {[{ value: true, label: 'Ja, ik heb een boot' }, { value: false, label: 'Nee' }].map(({ value, label }) => (
          <button
            key={String(value)}
            aria-pressed={hasBoat === value}
            onClick={() => setHasBoat(value)}
            className={`flex-1 py-4 px-3 rounded-2xl border font-label font-bold transition-all text-center
              focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${fsBody}
              ${hasBoat === value
                ? 'border-primary/60 bg-primary/10 text-primary'
                : 'border-white/10 bg-surface-container text-on-surface-variant hover:border-white/20'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {hasBoat && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-2 pt-1" role="group" aria-label="Boottype kiezen">
              {BOAT_OPTIONS.map(({ type, emoji }) => {
                const sel = boatTypes.includes(type)
                return (
                  <button
                    key={type}
                    aria-pressed={sel}
                    onClick={() => toggle(type)}
                    className={`flex items-center gap-2 px-3 py-3 rounded-2xl border transition-all text-left
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
                      ${sel
                        ? 'border-primary/60 bg-primary/10'
                        : 'border-white/10 bg-surface-container hover:border-white/20'}`}
                  >
                    <span className="text-xl" aria-hidden="true">{emoji}</span>
                    <span className={`font-label font-bold ${sel ? 'text-primary' : 'text-on-surface'} ${fsSmall}`}>
                      {BOAT_LABELS[type]}
                    </span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={onConfirm}
        disabled={hasBoat === null}
        className="w-full py-4 rounded-2xl gradient-primary text-on-primary
                   font-headline font-extrabold text-lg shadow-glow
                   disabled:opacity-40 active:scale-95 transition-all
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        Verder →
      </button>
    </div>
  )
}

function GebiedenInput({
  sailingAreas, setSailingAreas, skillTags, setSkillTags, onConfirm, fsBody, fsLabel, fsSmall,
}: {
  sailingAreas: string[]; setSailingAreas: (a: string[]) => void
  skillTags: string[]; setSkillTags: (s: string[]) => void
  onConfirm: () => void; fsBody: string; fsLabel: string; fsSmall: string
}) {
  const toggleArea  = (id: string) =>
    setSailingAreas(sailingAreas.includes(id) ? sailingAreas.filter(a => a !== id) : [...sailingAreas, id])
  const toggleSkill = (s: string) =>
    setSkillTags(skillTags.includes(s) ? skillTags.filter(x => x !== s) : [...skillTags, s])

  return (
    <div className="space-y-4 max-h-72 overflow-y-auto no-scrollbar">
      <div>
        <p className={`font-label font-semibold text-on-surface mb-2 ${fsLabel}`}>Vaargebieden</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Vaargebieden (meerdere mogelijk)">
          {SAILING_AREAS.map(({ id, label }) => {
            const sel = sailingAreas.includes(id)
            return (
              <button
                key={id}
                aria-pressed={sel}
                onClick={() => toggleArea(id)}
                className={`px-3 py-2.5 rounded-full border font-label font-bold transition-all
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${fsSmall}
                  ${sel
                    ? 'border-primary/60 bg-primary/10 text-primary'
                    : 'border-white/10 bg-surface-container text-on-surface-variant hover:border-white/20'}`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <p className={`font-label font-semibold text-on-surface mb-2 ${fsLabel}`}>
          Vaardigheden <span className="text-on-surface-variant font-normal">(optioneel)</span>
        </p>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Vaardigheden (optioneel)">
          {SKILL_TAGS.map(skill => {
            const sel = skillTags.includes(skill)
            return (
              <button
                key={skill}
                aria-pressed={sel}
                onClick={() => toggleSkill(skill)}
                className={`px-3 py-2 rounded-xl border font-label font-semibold transition-all
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${fsSmall}
                  ${sel
                    ? 'border-secondary/60 bg-secondary/10 text-secondary'
                    : 'border-white/10 bg-surface-container text-on-surface-variant hover:border-white/20'}`}
              >
                {skill}
              </button>
            )
          })}
        </div>
      </div>

      <button
        onClick={onConfirm}
        className="w-full py-4 rounded-2xl gradient-primary text-on-primary
                   font-headline font-extrabold text-lg shadow-glow
                   active:scale-95 transition-all
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        Verder →
      </button>
    </div>
  )
}

function BioInput({
  value, onChange, onConfirm, fsBody, fsLabel, fsSmall,
}: {
  value: string; onChange: (v: string) => void
  onConfirm: (skipped: boolean) => void; fsBody: string; fsLabel: string; fsSmall: string
}) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Bijv: Zeils al 20 jaar op het IJsselmeer. Zoek iemand voor weekendtochten en regattas…"
          rows={3}
          maxLength={300}
          aria-label="Bio — vertel iets over jezelf"
          className={`w-full px-4 py-4 bg-surface-container-high rounded-2xl
            text-on-surface placeholder:text-on-surface-variant/40 resize-none
            border border-white/10 focus:border-primary/50 ${fsBody} font-body
            focus:outline-none focus-visible:ring-1 focus-visible:ring-primary`}
        />
        <span className={`absolute bottom-2.5 right-3 font-label text-on-surface-variant/50 pointer-events-none ${fsSmall}`}>
          {value.length}/300
        </span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onConfirm(true)}
          className={`flex-none px-4 py-4 rounded-2xl bg-surface-container border border-white/10
            text-on-surface-variant font-label font-bold hover:border-white/20 transition-all
            focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${fsLabel}`}
        >
          Overslaan
        </button>
        <button
          onClick={() => onConfirm(false)}
          className="flex-1 py-4 rounded-2xl gradient-primary text-on-primary
                     font-headline font-extrabold text-lg shadow-glow
                     active:scale-95 transition-all
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Verder →
        </button>
      </div>
    </div>
  )
}

function PreviewInput({
  displayName, photoUrl, city, homePort, cwoLevel, sailingAreas, bio,
  isSaving, saveError, onSubmit, fsBody, fsLabel, fsSmall,
}: {
  displayName: string; photoUrl: string | null; city?: string; homePort: string
  cwoLevel: CWOLevel | null; sailingAreas: string[]; bio: string
  isSaving: boolean; saveError: string | null; onSubmit: () => void
  fsBody: string; fsLabel: string; fsSmall: string
}) {
  return (
    <div className="space-y-3">
      {/* Profile card preview */}
      <div className="bg-surface-container-high rounded-3xl overflow-hidden border border-white/10">
        <div className="flex items-start gap-3 p-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-surface-container flex-shrink-0 border border-white/10">
            {photoUrl
              ? <Image src={photoUrl} alt={displayName} width={64} height={64} className="object-cover w-full h-full" />
              : <div className="w-full h-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 0" }}>person</span>
                </div>
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-headline font-black text-on-surface ${fsBody}`}>{displayName}</p>
            {city && (
              <p className={`font-body text-on-surface-variant mt-0.5 ${fsSmall}`}>
                📍 {city}{homePort ? ` · ${homePort}` : ''}
              </p>
            )}
            {cwoLevel && (
              <span className={`inline-flex items-center gap-1 mt-1.5 px-2.5 py-1 rounded-full
                bg-primary/15 border border-primary/25 font-label font-bold text-primary ${fsSmall}`}>
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">anchor</span>
                {CWO_LABELS[cwoLevel]}
              </span>
            )}
          </div>
        </div>

        {bio && (
          <p className={`px-4 pb-3 font-body text-on-surface-variant ${fsSmall}`}>{bio}</p>
        )}

        {sailingAreas.length > 0 && (
          <div className="px-4 pb-4 flex flex-wrap gap-1.5">
            {sailingAreas.slice(0, 4).map(id => {
              const area = SAILING_AREAS.find(a => a.id === id)
              return area ? (
                <span key={id} className={`px-2.5 py-1 rounded-full bg-surface-container border border-white/10 font-label font-semibold text-on-surface-variant ${fsSmall}`}>
                  {area.label}
                </span>
              ) : null
            })}
            {sailingAreas.length > 4 && (
              <span className={`px-2.5 py-1 rounded-full bg-surface-container border border-white/10 font-label text-on-surface-variant ${fsSmall}`}>
                +{sailingAreas.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {saveError && (
        <div role="alert" className="p-3 rounded-2xl bg-error/10 border border-error/20">
          <p className={`font-label text-error ${fsSmall}`}>{saveError}</p>
        </div>
      )}

      <button
        onClick={onSubmit}
        disabled={isSaving}
        className="w-full py-5 rounded-2xl gradient-primary text-on-primary
                   font-headline font-extrabold text-lg shadow-glow-lg
                   disabled:opacity-50 active:scale-95 transition-all
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {isSaving ? 'Even geduld…' : 'Aan boord! Laten we varen'}
      </button>
    </div>
  )
}

// ─── Confetti / klaar scherm ──────────────────────────────────────────────────

const CONFETTI_COLORS = ['#46f1c5', '#adc8f5', '#fbbf24', '#fb7185', '#a78bfa', '#34d399']

// Deterministic confetti so no hydration mismatch
const PIECES = Array.from({ length: 40 }, (_, i) => ({
  id:    i,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  left:  `${(i * 2.5) % 100}%`,
  delay: (i * 0.07) % 1.2,
  size:  6 + (i % 5) * 2,
  dur:   2.2 + (i % 4) * 0.5,
  rot:   i % 2 === 0 ? 360 : -360,
}))

function KlaarScherm({ name }: { name: string }) {
  const router = useRouter()

  useEffect(() => {
    const t = setTimeout(() => router.push('/ontdekken'), 3500)
    return () => clearTimeout(t)
  }, [router])

  return (
    <div className="min-h-dvh bg-surface flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Confetti */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {PIECES.map(p => (
          <motion.div
            key={p.id}
            className="absolute rounded-sm"
            style={{ left: p.left, top: -12, width: p.size, height: p.size, backgroundColor: p.color }}
            animate={{ y: '110vh', rotate: p.rot, opacity: [1, 1, 0] }}
            transition={{ duration: p.dur, delay: p.delay, ease: 'linear' }}
          />
        ))}
      </div>

      {/* Content */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 14, stiffness: 200 }}
        className="text-center z-10"
      >
        <motion.div
          className="w-28 h-28 rounded-full gradient-primary flex items-center justify-center shadow-glow-lg mx-auto mb-6"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="material-symbols-outlined text-on-primary" style={{ fontSize: 52, fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
            sailing
          </span>
        </motion.div>

        <h1 className="font-headline font-black text-4xl text-on-surface mb-3">
          Welkom aan boord,<br />{name}!
        </h1>
        <p className="font-body text-on-surface-variant text-lg mb-1">
          Je profiel is klaar. Tijd om te varen!
        </p>
        <p className="font-body text-on-surface-variant/50 text-sm">
          Je wordt automatisch doorgestuurd…
        </p>
      </motion.div>
    </div>
  )
}
