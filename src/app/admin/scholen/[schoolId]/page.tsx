import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  sailingSchools, schoolMemberships, schoolFleet, newsletterSubscribers, users,
} from '@/lib/db/schema'
import { eq, isNull, and, count, desc } from 'drizzle-orm'

async function getSessionSafe() {
  try { return await auth() } catch { return null }
}

export default async function AdminSchoolDetailPage({
  params,
}: {
  params: Promise<{ schoolId: string }>
}) {
  const session = await getSessionSafe()
  if (!session?.user?.isAdmin) redirect('/')

  const { schoolId } = await params

  const [school] = await db
    .select()
    .from(sailingSchools)
    .where(and(eq(sailingSchools.id, schoolId), isNull(sailingSchools.deletedAt)))
    .limit(1)
  if (!school) notFound()

  const [[leden], [vloot], [abonnees], recentLeden] = await Promise.all([
    db.select({ n: count() }).from(schoolMemberships)
      .where(and(eq(schoolMemberships.schoolId, schoolId), isNull(schoolMemberships.deletedAt))),
    db.select({ n: count() }).from(schoolFleet).where(eq(schoolFleet.schoolId, schoolId)),
    db.select({ n: count() }).from(newsletterSubscribers)
      .where(and(eq(newsletterSubscribers.schoolId, schoolId), eq(newsletterSubscribers.status, 'actief'))),
    db.select({
      id: schoolMemberships.id,
      naam: users.name,
      rol: schoolMemberships.role,
    })
      .from(schoolMemberships)
      .leftJoin(users, eq(schoolMemberships.userId, users.id))
      .where(and(eq(schoolMemberships.schoolId, schoolId), isNull(schoolMemberships.deletedAt)))
      .orderBy(desc(schoolMemberships.joinedAt))
      .limit(8),
  ])

  const kpis = [
    { label: 'Leden', value: leden.n, icon: 'group' },
    { label: 'Vloot', value: vloot.n, icon: 'sailing' },
    { label: 'Nieuwsbrief actief', value: abonnees.n, icon: 'campaign' },
  ]

  return (
    <div>
      <Link href="/admin/scholen" className="inline-flex items-center gap-1.5 font-label text-xs text-on-surface-variant hover:text-on-surface mb-4">
        <span className="material-symbols-outlined text-sm" aria-hidden="true">arrow_back</span>
        Terug naar zeilscholen
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <span className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-2xl text-primary" aria-hidden="true">sailing</span>
        </span>
        <div>
          <h1 className="font-headline font-black text-2xl text-on-surface">{school.name}</h1>
          <p className="font-label text-sm text-on-surface-variant">
            {school.city ?? '—'} · /{school.slug} · plan: {school.plan ?? 'basis'} · {school.accountStatus ?? 'actief'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {kpis.map(k => (
          <div key={k.label} className="glass-card rounded-2xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-base text-primary" aria-hidden="true">{k.icon}</span>
              <span className="font-label text-xs text-on-surface-variant">{k.label}</span>
            </div>
            <div className="font-headline font-black text-2xl text-on-surface">
              {Number(k.value).toLocaleString('nl-NL')}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass-card rounded-2xl p-5 border border-white/5">
          <h2 className="font-headline font-bold text-base text-on-surface mb-3">Recente leden</h2>
          <div className="space-y-2">
            {recentLeden.map(r => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <span className="font-label text-sm text-on-surface">{r.naam ?? 'Onbekend'}</span>
                <span className="font-label text-xs text-on-surface-variant px-2 py-0.5 rounded-lg bg-surface-container-high">{r.rol}</span>
              </div>
            ))}
            {recentLeden.length === 0 && (
              <p className="font-label text-sm text-on-surface-variant">Nog geen leden.</p>
            )}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-white/5">
          <h2 className="font-headline font-bold text-base text-on-surface mb-3">Snelkoppelingen</h2>
          <div className="space-y-2">
            <Link href={`/school/${schoolId}/dashboard`} className="flex items-center gap-2 p-3 rounded-xl border border-white/5 hover:border-primary/20 hover:bg-primary/5 font-label text-sm text-on-surface-variant hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined text-base" aria-hidden="true">dashboard</span>
              Open school-dashboard
            </Link>
            <Link href={`/admin/scholen/${schoolId}/crm`} className="flex items-center gap-2 p-3 rounded-xl border border-white/5 hover:border-primary/20 hover:bg-primary/5 font-label text-sm text-on-surface-variant hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined text-base" aria-hidden="true">contacts</span>
              School-CRM
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
