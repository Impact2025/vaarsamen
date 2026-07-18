'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  postId?: string
  initialTitel: string
  initialSlug: string
  initialExcerpt: string
  initialInhoud: string
  initialStatus: string
  onSaved?: (id: string) => void
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

export function BlogEditor({
  postId, initialTitel, initialSlug, initialExcerpt, initialInhoud, initialStatus, onSaved,
}: Props) {
  const router = useRouter()
  const [titel, setTitel]         = useState(initialTitel)
  const [slug, setSlug]           = useState(initialSlug)
  const [excerpt, setExcerpt]     = useState(initialExcerpt)
  const [inhoud, setInhoud]       = useState(initialInhoud)
  const [status, setStatus]       = useState(initialStatus)
  const [tab, setTab]              = useState<'bewerk' | 'preview'>('bewerk')
  const [saving, setSaving]       = useState(false)
  const [seo, setSeo]             = useState<null | {
    seoTitel?: string; slug?: string; metaDescription?: string;
    focusKeyword?: string; readabilityScore?: number; verbeterTip?: string; internalLinks?: string[]
  }>(null)
  const [seoBusy, setSeoBusy]     = useState(false)
  const [seoMsg, setSeoMsg]       = useState('')
  const editorRef                  = useRef<HTMLDivElement>(null)

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

  const save = useCallback(async (doPublish = false) => {
    if (editorRef.current) setInhoud(editorRef.current.innerHTML)
    setSaving(true)
    try {
      const res = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: postId, titel, slug, excerpt, inhoud,
          status: doPublish ? 'gepubliceerd' : status,
        }),
      })
      const data = await res.json()
      if (data.post?.id) {
        if (!postId) router.replace(`/admin/blog/${data.post.id}`)
        onSaved?.(data.post.id)
      }
    } finally {
      setSaving(false)
    }
  }, [postId, titel, slug, excerpt, inhoud, status, router, onSaved])

  const runSeo = useCallback(async () => {
    if (editorRef.current) setInhoud(editorRef.current.innerHTML)
    setSeoBusy(true); setSeoMsg('')
    try {
      const res = await fetch(`/api/admin/blog/${postId ?? ''}/ai-seo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titel, inhoud }),
      })
      const data = await res.json()
      if (data.seo) {
        setSeo(data.seo)
        if (data.seo.seoTitel) setTitel(data.seo.seoTitel)
        if (data.slug) setSlug(data.slug)
        setSeoMsg('SEO-pakket gegenereerd en opgeslagen.')
      } else {
        setSeoMsg(data.error ?? 'AI SEO mislukt.')
      }
    } catch (e) {
      setSeoMsg('Fout: ' + (e as Error).message)
    } finally {
      setSeoBusy(false)
    }
  }, [postId, titel, inhoud])

  return (
    <div className="space-y-4">
      {/* Velden */}
      <div className="grid gap-2 md:grid-cols-2">
        <input value={titel} onChange={e => setTitel(e.target.value)} required placeholder="Titel"
          className="px-4 py-2.5 rounded-xl bg-surface border border-white/10 text-on-surface font-body text-sm focus:outline-none focus:border-primary/60" />
        <input value={slug} onChange={e => setSlug(e.target.value)} required placeholder="slug (kebab-case)"
          className="px-4 py-2.5 rounded-xl bg-surface border border-white/10 text-on-surface font-body text-sm focus:outline-none focus:border-primary/60 font-mono" />
      </div>
      <input value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="Excerpt / samenvatting (optioneel)"
        className="w-full px-4 py-2.5 rounded-xl bg-surface border border-white/10 text-on-surface font-body text-sm focus:outline-none focus:border-primary/60" />

      {/* Tabs */}
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
        <button type="button" onClick={runSeo} disabled={seoBusy || !postId}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-label text-xs text-primary border border-primary/30 hover:bg-primary/10 disabled:opacity-40">
          <span className="material-symbols-outlined text-sm" aria-hidden="true">auto_awesome</span>
          {seoBusy ? 'AI analyseert…' : 'AI SEO-tool'}
        </button>
      </div>

      {/* Editor / preview */}
      {tab === 'bewerk' ? (
        <div className="flex flex-wrap items-center gap-1 p-1.5 rounded-xl bg-surface-container-high border border-white/5">
          {TOOLS.map(t => (
            <button key={t.title} type="button" title={t.title}
              onMouseDown={e => { e.preventDefault(); exec(t.cmd, t.val) }}
              className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-base" aria-hidden="true">{t.icon}</span>
            </button>
          ))}
          <input value={inhoud.length > 0 ? '' : ''} readOnly hidden />
        </div>
      ) : null}

      {tab === 'bewerk' ? (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={emit}
          onBlur={emit}
          className="min-h-[320px] max-h-[480px] overflow-y-auto rounded-2xl bg-surface border border-white/10 p-4 font-body text-sm text-on-surface leading-relaxed focus:outline-none focus:border-primary/60 [&_h2]:font-headline [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-2 [&_h3]:font-semibold [&_h3]:mt-2 [&_ul]:list-disc [&_ul]:pl-5"
        />
      ) : (
        <div
          className="min-h-[320px] rounded-2xl bg-surface border border-white/10 p-5 prose-nl max-w-none font-body text-sm text-on-surface leading-relaxed [&_h2]:font-headline [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-3 [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:text-on-surface [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-0.5"
          dangerouslySetInnerHTML={{ __html: inhoud }}
        />
      )}

      {/* AI SEO resultaat */}
      {seoMsg && (
        <div className="rounded-xl bg-surface-container-high border border-white/5 p-3 font-label text-xs text-on-surface-variant">
          {seoMsg}
        </div>
      )}
      {seo && (
        <div className="glass-card rounded-2xl p-4 border border-primary/20 space-y-2">
          <h3 className="font-headline font-bold text-sm text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-primary" aria-hidden="true">auto_awesome</span>
            AI SEO-rapport
          </h3>
          {seo.readabilityScore !== undefined && (
            <div className="flex items-center gap-2">
              <span className="font-label text-xs text-on-surface-variant">Leesbaarheid</span>
              <span className="font-headline font-bold text-on-surface">{seo.readabilityScore}/100</span>
            </div>
          )}
          {seo.focusKeyword && (
            <p className="font-label text-xs text-on-surface-variant">Focus-keyword: <span className="text-primary">{seo.focusKeyword}</span></p>
          )}
          {seo.metaDescription && (
            <p className="font-label text-xs text-on-surface-variant">Meta: <span className="text-on-surface">{seo.metaDescription}</span></p>
          )}
          {seo.verbeterTip && (
            <p className="font-label text-xs text-on-surface-variant">Tip: {seo.verbeterTip}</p>
          )}
        </div>
      )}

      {/* Acties */}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={() => save(false)} disabled={saving}
          className="px-4 py-2.5 rounded-xl bg-surface-container-high font-label text-sm text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-50">
          {saving ? 'Opslaan…' : 'Opslaan als concept'}
        </button>
        <button type="button" onClick={() => save(true)} disabled={saving}
          className="px-4 py-2.5 rounded-xl gradient-primary font-label text-sm font-semibold text-on-primary shadow-glow disabled:opacity-50">
          Publiceren
        </button>
      </div>
    </div>
  )
}
