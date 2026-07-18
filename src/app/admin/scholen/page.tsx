import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getPlatformScholen } from '@/lib/db/queries/platform'
import { db } from '@/lib/db'
import { sailingSchools } from '@/lib/db/schema'
import { eq, isNull } from 'drizzle-orm'

async function getSessionSafe() {
  try { return await auth() } catch { return null }
}

const PLAN_LABEL: Record<string, string> = {
  basis: 'Basis', school: 'School', school_pro: 'School Pro',
}
const STATUS_KLEUR: Record<string, string> = {
  actief: 'bg-emerald-400/10 text-emerald-300',
  gepauzeerd: 'bg-amber-400/10 text-amber-300',
  geblokkeerd: 'bg-red-400/10 text-red-300',
}

export default async function AdminScholenPage() {
  const session = await getSessionSafe()
  if (!session?.user?.isAdmin) redirect('/')

  const scholen = await getPlatformScholen()

  return (
    <div>
      <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-headline font-black text-2xl text-on-surface">Zeilscholen</h1>
          <p className="font-body text-sm text-on-surface-variant mt-1">
            Totaaloverzicht van alle {scholen.length} aangesloten zeilscholen
          </p>
        </div>
        <Link
          href="/admin/scholen/nieuw"
          className="px-4 py-2.5 rounded-xl gradient-primary font-label text-sm font-semibold text-on-primary shadow-glow"
        >
          + Nieuwe school
        </Link>
      </div>

      <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-on-surface-variant font-label text-xs">
                <th className="px-4 py-3">School</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3 text-right">Leden</th>
                <th className="px-4 py-3 text-right">Vloot</th>
                <th className="px-4 py-3 text-right">Abonnees</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Laatste activiteit</th>
              </tr>
            </thead>
            <tbody>
              {scholen.map(s => (
                <tr key={s.id} className="border-b border-white/5 hover:bg-surface-container-high/50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/admin/scholen/${s.id}`} className="flex items-center gap-2 group">
                      <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-base text-primary" aria-hidden="true">sailing</span>
                      </span>
                      <span>
                        <span className="block font-label font-semibold text-on-surface group-hover:text-primary transition-colors">
                          {s.naam}
                        </span>
                        <span className="block font-label text-[11px] text-on-surface-variant">
                          {s.stad ?? '—'} · /{s.slug}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-label text-xs px-2 py-1 rounded-lg bg-primary/10 text-primary">
                      {PLAN_LABEL[s.plan ?? 'basis'] ?? s.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-headline font-bold text-on-surface">
                    {Number(s.leden).toLocaleString('nl-NL')}
                  </td>
                  <td className="px-4 py-3 text-right font-label text-on-surface-variant">
                    {Number(s.vloot).toLocaleString('nl-NL')}
                  </td>
                  <td className="px-4 py-3 text-right font-label text-on-surface-variant">
                    {Number(s.abonnees).toLocaleString('nl-NL')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-label text-xs px-2 py-1 rounded-lg ${STATUS_KLEUR[s.accountStatus ?? 'actief'] ?? STATUS_KLEUR.actief}`}>
                      {s.accountStatus ?? 'actief'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-label text-xs text-on-surface-variant">
                    {s.laatsteActiviteitOp
                      ? new Date(s.laatsteActiviteitOp).toLocaleDateString('nl-NL')
                      : '—'}
                  </td>
                </tr>
              ))}
              {scholen.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center font-label text-sm text-on-surface-variant">
                    Nog geen zeilscholen aangesloten.
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
