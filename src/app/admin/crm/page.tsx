import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getCrmContacts, getCrmPipeline } from '@/lib/db/queries/platform'

async function getSessionSafe() {
  try { return await auth() } catch { return null }
}

const FASES = ['alle', 'nieuw', 'gekwalificeerd', 'klant', 'verloren']
const FASE_KLEUR: Record<string, string> = {
  nieuw: 'bg-sky-400/10 text-sky-300',
  gekwalificeerd: 'bg-violet-400/10 text-violet-300',
  klant: 'bg-emerald-400/10 text-emerald-300',
  verloren: 'bg-red-400/10 text-red-300',
}

export default async function AdminCrmPage({
  searchParams,
}: {
  searchParams: Promise<{ fase?: string }>
}) {
  const session = await getSessionSafe()
  if (!session?.user?.isAdmin) redirect('/')

  const { fase } = await searchParams
  const [contacten, pipeline] = await Promise.all([
    getCrmContacts(fase),
    getCrmPipeline(),
  ])

  const totaal = Object.values(pipeline).reduce((a, b) => a + b, 0)

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-headline font-black text-2xl text-on-surface">Pro CRM</h1>
        <p className="font-body text-sm text-on-surface-variant mt-1">
          Platform-brede relatiegeschiedenis met alle zeilscholen en leads
        </p>
      </div>

      {/* Pipeline summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="glass-card rounded-2xl p-4 border border-white/5">
          <div className="font-headline font-black text-2xl text-on-surface">{totaal}</div>
          <p className="font-label text-xs text-on-surface-variant mt-1">Totaal contacten</p>
        </div>
        {(['nieuw', 'gekwalificeerd', 'klant', 'verloren'] as const).map(f => (
          <div key={f} className="glass-card rounded-2xl p-4 border border-white/5">
            <div className="font-headline font-black text-2xl text-on-surface">{pipeline[f] ?? 0}</div>
            <p className="font-label text-xs text-on-surface-variant mt-1 capitalize">{f}</p>
          </div>
        ))}
      </div>

      {/* Fase-filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        {FASES.map(f => (
          <Link
            key={f}
            href={f === 'alle' ? '/admin/crm' : `/admin/crm?fase=${f}`}
            className={`px-3 py-1.5 rounded-xl font-label text-xs border transition-colors ${
              (fase ?? 'alle') === f
                ? 'bg-primary/15 text-primary border-primary/30'
                : 'text-on-surface-variant border-white/10 hover:text-on-surface'
            }`}
          >
            {f === 'alle' ? 'Alle' : f}
          </Link>
        ))}
      </div>

      <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-on-surface-variant font-label text-xs">
                <th className="px-4 py-3">Naam</th>
                <th className="px-4 py-3">School</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Fase</th>
                <th className="px-4 py-3">Tags</th>
                <th className="px-4 py-3">AI-samenvatting</th>
              </tr>
            </thead>
            <tbody>
              {contacten.map(c => (
                <tr key={c.id} className="border-b border-white/5 hover:bg-surface-container-high/50">
                  <td className="px-4 py-3 font-label font-semibold text-on-surface">{c.naam}</td>
                  <td className="px-4 py-3 font-label text-xs text-on-surface-variant">{c.tenantNaam ?? '—'}</td>
                  <td className="px-4 py-3 font-label text-xs text-on-surface-variant">{c.email ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`font-label text-xs px-2 py-1 rounded-lg ${FASE_KLEUR[c.fase ?? 'nieuw'] ?? FASE_KLEUR.nieuw}`}>
                      {c.fase ?? 'nieuw'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(c.tags ?? []).map((t: string) => (
                        <span key={t} className="font-label text-[11px] px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant">{t}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-label text-xs text-on-surface-variant max-w-xs truncate">
                    {c.aiSamenvatting ?? '—'}
                  </td>
                </tr>
              ))}
              {contacten.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center font-label text-sm text-on-surface-variant">
                    Nog geen CRM-contacten in dit segment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
