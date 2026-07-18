'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { NL_TEMPLATES, NL_MERGE_TAGS, type NlTemplate } from '@/lib/newsletter-templates'

interface Props {
  schoolId: string
  initialTitel: string
  initialSubject: string
  initialInhoud: string
  initialTemplate?: string
  onSave: (v: { titel: string; subject: string; inhoud: string; template?: string }) => Promise<void> | void
  saving: boolean
  onClose: () => void
}

const TOOLS: { cmd: string; icon: string; title: string; val?: string }[] = [
  { cmd: 'bold', icon: 'format_bold', title: 'Vet' },
  { cmd: 'italic', icon: 'format_italic', title: 'Cursief' },
  { cmd: 'underline', icon: 'format_underlined', title: 'Onderstreept' },
  { cmd: 'insertUnorderedList', icon: 'format_list_bulleted', title: 'Lijst' },
  { cmd: 'insertOrderedList', icon: 'format_list_numbered', title: 'Genummerde lijst' },
  { cmd: 'formatBlock', icon: 'title', title: 'Kop', val: 'H3' },
  { cmd: 'formatBlock', icon: 'title', title: 'Subkop', val: 'H4' },
  { cmd: 'formatBlock', icon: 'horizontal_rule', title: 'Lijn', val: 'P' },
  { cmd: 'createLink', icon: 'link', title: 'Link' },
  { cmd: 'insertImage', icon: 'image', title: 'Afbeelding' },
]

// veilige preview: render de HTML in een sandbox-achtige container
function Preview({ inhoud, schoolNaam }: { inhoud: string; schoolNaam: string }) {
  const sample = inhoud
    .replace(/\{\{naam\}\}/g, 'Voorbeeld Lid')
    .replace(/\{\{school_naam\}\}/g, schoolNaam)
    .replace(/\{\{maand\}\}/g, new Date().toLocaleDateString('nl-NL', { month: 'long' }))
    .replace(/\{\{seizoen\}\}/g, 'seizoen')
    .replace(/\{\{activiteit_naam\}\}/g, 'Zomerclinic')
    .replace(/\{\{web_url\}\}/g, '#')
    .replace(/\{\{uitschrijf_url\}\}/g, '#')
  return (
    <div
      className="prose-nl max-w-none font-body text-sm text-on-surface leading-relaxed [&_h2]:font-headline [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-3 [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:text-on-surface [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_li]:my-0.5"
      dangerouslySetInnerHTML={{ __html: sample }}
    />
  )
}

export function NieuwsbriefEditor({
  schoolId, initialTitel, initialSubject, initialInhoud, initialTemplate,
  onSave, saving, onClose,
}: Props) {
  const [titel, setTitel]         = useState(initialTitel)
  const [subject, setSubject]       = useState(initialSubject)
  const [inhoud, setInhoud]       = useState(initialInhoud)
  const [template, setTemplate]     = useState(initialTemplate ?? '')
  const [tab, setTab]              = useState<'bewerk' | 'preview'>('bewerk')
  const [showTpl, setShowTpl]     = useState(false)
  const [aiBusy, setAiBusy]       = useState(false)
  const [aiMsg, setAiMsg]         = useState('')
  const [abSubject, setAbSubject] = useState('')   // A/B-variant onderwerp
  const editorRef                   = useRef<HTMLDivElement>(null)
  const [schoolNaam]               = useState('jouw zeilschool')

  // synchroniseer contentEditable met state (alleen bij mount / externe wijziging)
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== inhoud) {
      editorRef.current.innerHTML = inhoud
    }
  }, [inhoud])

  const emit = useCallback(() => {
    if (editorRef.current) setInhoud(editorRef.current.innerHTML)
  }, [])

  const exec = useCallback((cmd: string, val?: string) => {
    editorRef.current?.focus()
    if (cmd === 'createLink') {
      const url = window.prompt('Link-URL:', 'https://')
      if (!url) return
      document.execCommand('createLink', false, url)
    } else if (cmd === 'insertImage') {
      const url = window.prompt('Afbeelding-URL:', 'https://')
      if (!url) return
      document.execCommand('insertImage', false, url)
    } else {
      document.execCommand(cmd, false, val)
    }
    emit()
  }, [emit])

  const insertTag = useCallback((tag: string) => {
    editorRef.current?.focus()
    document.execCommand('insertText', false, tag)
    emit()
  }, [emit])

  const pickTemplate = useCallback((t: NlTemplate) => {
    setTitel(t.titel)
    setSubject(t.subject)
    setInhoud(t.inhoud)
    setTemplate(t.id)
    if (editorRef.current) editorRef.current.innerHTML = t.inhoud
    setShowTpl(false)
  }, [])

  // AI-assistent: genereer onderwerp + opening + A/B via de server-route
  const runAi = useCallback(async () => {
    const ctx = window.prompt(
      'Waar gaat de nieuwsbrief over? (bijv. "Open dag zaterdag, 20% korting op zomerclinics")',
      '',
    )
    if (ctx === null) return
    if (!ctx.trim()) { setAiMsg('Geef wat context voor de AI.'); return }

    setAiBusy(true); setAiMsg('')
    try {
      const res = await fetch(`/api/school/${schoolId}/newsletter/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: ctx }),
      })
      if (!res.ok) {
        setAiMsg(`AI mislukt (${res.status}).`)
        return
      }
      const text = await res.text()
      // Parse ONDERWERP / A/B-ONDERWERP / BODY uit de stream
      const onderwerpMatch = text.match(/ONDERWERP:\s*(.+)/i)
      const abMatch        = text.match(/A\/B-ONDERWERP:\s*(.+)/i)
      const bodyMatch      = text.match(/BODY:\s*([\s\S]+)/i)

      if (onderwerpMatch) setSubject(onderwerpMatch[1].trim())
      if (abMatch)        setAbSubject(abMatch[1].trim())
      if (bodyMatch) {
        const body = bodyMatch[1].trim()
        setInhoud(body)
        if (editorRef.current) editorRef.current.innerHTML = body
      }
      setAiMsg('AI-concept ingevuld. Controleer en pas aan waar nodig.')
    } catch (e) {
      setAiMsg('Fout: ' + (e as Error).message)
    } finally {
      setAiBusy(false)
    }
  }, [schoolId])

  const save = useCallback(async () => {
    if (editorRef.current) setInhoud(editorRef.current.innerHTML)
    await onSave({ titel, subject, inhoud, template: template || undefined })
  }, [titel, subject, inhoud, template, onSave])

  return (
    <form
      onSubmit={e => { e.preventDefault(); save() }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-surface-container rounded-3xl border border-white/10 p-5 space-y-4 max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg text-primary" aria-hidden="true">edit_note</span>
            </span>
            <div>
              <h3 className="font-headline font-bold text-lg text-on-surface">
                {titel ? 'Campagne bewerken' : 'Nieuwe campagne'}
              </h3>
              <p className="font-label text-[11px] text-on-surface-variant">
                {template ? `Template: ${NL_TEMPLATES.find(t => t.id === template)?.naam ?? template}` : 'Lege brief'}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Sluiten"
            className="p-1.5 rounded-lg text-on-surface-variant/50 hover:text-on-surface hover:bg-white/5">
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>

        {/* Template-kiesser */}
        {showTpl && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-2xl bg-surface-container-high border border-white/5">
            {NL_TEMPLATES.map(t => (
              <button type="button" key={t.id} onClick={() => pickTemplate(t)}
                className="flex items-start gap-2.5 p-3 rounded-xl border border-white/5 hover:border-primary/40 hover:bg-primary/5 text-left transition-colors">
                <span className="material-symbols-outlined text-lg text-primary mt-0.5" aria-hidden="true">{t.icon}</span>
                <span>
                  <span className="block font-label text-sm font-semibold text-on-surface">{t.naam}</span>
                  <span className="block font-label text-[11px] text-on-surface-variant">{t.beschrijving}</span>
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <input value={titel} onChange={e => setTitel(e.target.value)} required placeholder="Titel (intern)"
            className="flex-1 min-w-[180px] px-4 py-2.5 rounded-xl bg-surface border border-white/10 text-on-surface font-body text-sm focus:outline-none focus:border-primary/60" />
          <input value={subject} onChange={e => setSubject(e.target.value)} required placeholder="Onderwerp e-mail"
            className="flex-1 min-w-[180px] px-4 py-2.5 rounded-xl bg-surface border border-white/10 text-on-surface font-body text-sm focus:outline-none focus:border-primary/60" />
        </div>
        {abSubject && (
          <input value={abSubject} onChange={e => setAbSubject(e.target.value)} placeholder="A/B-variant onderwerp"
            className="w-full px-4 py-2.5 rounded-xl bg-surface-container-high border border-white/10 text-on-surface font-body text-sm focus:outline-none focus:border-primary/40" />
        )}
        {aiMsg && (
          <div className="rounded-xl bg-surface-container-high border border-white/5 p-2 font-label text-xs text-on-surface-variant">
            {aiMsg}
          </div>
        )}

        {/* Tab-switch */}
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => { emit(); setTab('bewerk') }}
            className={['px-3 py-1.5 rounded-xl font-label text-xs', tab === 'bewerk' ? 'bg-primary/15 text-primary' : 'text-on-surface-variant hover:text-on-surface'].join(' ')}>
            Bewerken
          </button>
          <button type="button" onClick={() => { emit(); setTab('preview') }}
            className={['px-3 py-1.5 rounded-xl font-label text-xs', tab === 'preview' ? 'bg-primary/15 text-primary' : 'text-on-surface-variant hover:text-on-surface'].join(' ')}>
            Voorbeeld
          </button>
          <span className="flex-1" />
          <button type="button" onClick={() => setShowTpl(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-label text-xs text-on-surface-variant hover:text-on-surface border border-white/10">
            <span className="material-symbols-outlined text-sm" aria-hidden="true">auto_awesome</span>
            Template kiezen
          </button>
          <button type="button" onClick={runAi} disabled={aiBusy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-label text-xs text-primary border border-primary/30 hover:bg-primary/10 disabled:opacity-40">
            <span className="material-symbols-outlined text-sm" aria-hidden="true">auto_awesome</span>
            {aiBusy ? 'AI schrijft…' : 'AI ✨'}
          </button>
        </div>

        {tab === 'bewerk' ? (
          <>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-1.5 rounded-xl bg-surface-container-high border border-white/5">
              {TOOLS.map(t => (
                <button key={t.title} type="button" title={t.title}
                  onMouseDown={e => { e.preventDefault(); exec(t.cmd, t.val) }}
                  className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors">
                  <span className="material-symbols-outlined text-base" aria-hidden="true">{t.icon}</span>
                </button>
              ))}
            </div>

            {/* Editor */}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={emit}
              onBlur={emit}
              className="min-h-[240px] max-h-[320px] overflow-y-auto rounded-2xl bg-surface border border-white/10 p-4 font-body text-sm text-on-surface leading-relaxed focus:outline-none focus:border-primary/60 [&_h2]:font-headline [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-2 [&_h3]:font-semibold [&_h3]:mt-2 [&_ul]:list-disc [&_ul]:pl-5"
            />

            {/* Merge-tags */}
            <details className="rounded-xl bg-surface-container-high border border-white/5 p-2">
              <summary className="cursor-pointer font-label text-xs text-on-surface-variant px-2 py-1">
                Invoegen: persoonlijke velden (&#123;&#123;tags&#125;&#125;)
              </summary>
              <div className="flex flex-wrap gap-1.5 p-2">
                {NL_MERGE_TAGS.map(m => (
                  <button key={m.tag} type="button" onClick={() => insertTag(m.tag)}
                    title={m.label}
                    className="px-2 py-1 rounded-lg bg-surface border border-white/10 font-mono text-[11px] text-primary hover:bg-primary/10">
                    {m.tag}
                  </button>
                ))}
              </div>
            </details>
          </>
        ) : (
          <div className="min-h-[240px] rounded-2xl bg-surface border border-white/10 p-5">
            <Preview inhoud={inhoud} schoolNaam={schoolNaam} />
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-surface-container-high font-label text-sm text-on-surface-variant hover:text-on-surface transition-colors">
            Annuleren
          </button>
          <button type="submit" disabled={saving}
            className="px-4 py-2.5 rounded-xl gradient-primary font-label text-sm font-semibold text-on-primary shadow-glow disabled:opacity-50">
            {saving ? 'Opslaan…' : (titel ? 'Bijwerken' : 'Opslaan als concept')}
          </button>
        </div>
      </div>
    </form>
  )
}
