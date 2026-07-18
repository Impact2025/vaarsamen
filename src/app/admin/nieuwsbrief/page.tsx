import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { newsletterCampaigns, sailingSchools } from '@/lib/db/schema'
import { eq, desc, sql } from 'drizzle-orm'

async function getSessionSafe() {
  try { return await auth() } catch { return null }
}

export default async function AdminNieuwsbriefPage() {
  const session = await getSessionSafe()
  if (!session?.user?.isAdmin) redirect('/')

  const campagnes = await db
    .select({
      id: newsletterCampaigns.id,
      schoolId: newsletterCampaigns.schoolId,
      titel: newsletterCampaigns.titel,
      subject: newsletterCampaigns.subject,
      status: newsletterCampaigns.status,
      ontvangers: newsletterCampaigns.ontvangers,
      opens: newsletterCampaigns.opens,
      kliks: newsletterCampaigns.kliks,
      verzondenAt: newsletterCampaigns.verzondenAt,
      schoolNaam: sailingSchools.name,
    })
    .from(newsletterCampaigns)
    .leftJoin(sailingSchools, eq(newsletterCampaigns.schoolId, sailingSchools.id))
    .orderBy(desc(newsletterCampaigns.createdAt))
    .limit(100)

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-headline font-black text-2xl text-on-surface">Nieuwsbrief</h1>
        <p className="font-body text-sm text-on-surface-variant mt-1">
          Alle campagnes over alle zeilscholen · geopend-percentage en klikken
        </p>
      </div>

      <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-on-surface-variant font-label text-xs">
                <th className="px-4 py-3">School</th>
                <th className="px-4 py-3">Campagne</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ontvangers</th>
                <th className="px-4 py-3 text-right">Open %</th>
                <th className="px-4 py-3 text-right">Klik %</th>
                <th className="px-4 py-3">Verzonden</th>
              </tr>
            </thead>
            <tbody>
              {campagnes.map(c => {
                const openPct = c.ontvangers ? Math.round((Number(c.opens) / Number(c.ontvangers)) * 100) : 0
                const klikPct = c.ontvangers ? Math.round((Number(c.kliks) / Number(c.ontvangers)) * 100) : 0
                return (
                  <tr key={c.id} className="border-b border-white/5 hover:bg-surface-container-high/50">
                    <td className="px-4 py-3 font-label text-xs text-on-surface-variant">{c.schoolNaam ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="font-label font-semibold text-on-surface block">{c.titel}</span>
                      <span className="font-label text-[11px] text-on-surface-variant">{c.subject}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-label text-xs px-2 py-1 rounded-lg ${
                        c.status === 'verzonden'
                          ? 'bg-emerald-400/10 text-emerald-300'
                          : c.status === 'gepland'
                          ? 'bg-amber-400/10 text-amber-300'
                          : 'bg-surface-container-high text-on-surface-variant'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-label text-on-surface">{Number(c.ontvangers) || 0}</td>
                    <td className="px-4 py-3 text-right font-label text-on-surface-variant">{openPct}%</td>
                    <td className="px-4 py-3 text-right font-label text-on-surface-variant">{klikPct}%</td>
                    <td className="px-4 py-3 font-label text-xs text-on-surface-variant">
                      {c.verzondenAt ? new Date(c.verzondenAt).toLocaleDateString('nl-NL') : '—'}
                    </td>
                  </tr>
                )
              })}
              {campagnes.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center font-label text-sm text-on-surface-variant">
                    Nog geen campagnes verzonden.
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
