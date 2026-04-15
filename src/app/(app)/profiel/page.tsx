import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getProfileByUserId } from '@/lib/db/queries/profiles'
import { getMyTochten } from '@/lib/db/queries/tochten'
import { getMySchools } from '@/lib/db/queries/school'
import { db } from '@/lib/db'
import { boats, reviews } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import Image from 'next/image'
import Link from 'next/link'
import { CWO_LABELS, BOAT_LABELS, ROLE_LABELS, SAILING_AREAS, GEBIED_COLOR_HEX } from '@/types'
import { signOut } from '@/lib/auth'
import { format, parseISO, isToday, isTomorrow } from 'date-fns'
import { nl } from 'date-fns/locale'

export default async function ProfielPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const profile = await getProfileByUserId(session.user.id)
  if (!profile) redirect('/onboarding')

  const [profileBoats, profileReviews, myTochten, mySchools] = await Promise.all([
    db.select().from(boats).where(eq(boats.profileId, profile.id)),
    db.select().from(reviews).where(eq(reviews.revieweeId, profile.id)).orderBy(desc(reviews.createdAt)).limit(5),
    getMyTochten(profile.id),
    getMySchools(session.user.id),
  ])

  const initials = profile.displayName
    .split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()

  return (
    <div className="px-4 pt-6 pb-28">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-headline font-black text-2xl text-on-surface">Profiel</h1>
        <Link
          href="/profiel/bewerken"
          className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-outline/20
                     font-label text-sm font-semibold text-on-surface-variant
                     hover:border-primary/30 hover:text-on-surface
                     transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Profiel bewerken"
        >
          <span className="material-symbols-outlined text-[16px] text-primary" aria-hidden="true">edit</span>
          Bewerken
        </Link>
      </div>

      {/* ── Hero identiteitskaart (Airbnb host-stijl) ──────────── */}
      <div className="glass-card rounded-card p-5 mb-4">

        {/* Avatar + naam */}
        <div className="flex items-start gap-4 mb-4">
          {/* Avatar 88px met premium rand */}
          <div className="relative flex-shrink-0">
            <div
              className="w-[88px] h-[88px] rounded-2xl overflow-hidden"
              style={{ boxShadow: '0 0 0 2px var(--color-primary, #007a62), 0 0 0 4px rgba(0,122,98,0.12)' }}
            >
              {profile.photoUrl ? (
                <Image
                  src={profile.photoUrl}
                  alt="Jouw profielfoto"
                  width={88}
                  height={88}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(160deg, #0c4a6e 0%, #065f46 100%)' }}
                >
                  <span className="font-headline font-black text-3xl text-white/90 select-none leading-none">
                    {initials}
                  </span>
                </div>
              )}
            </div>
            {/* Verified dot */}
            {profile.cwoVerified && (
              <div
                className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-primary
                           flex items-center justify-center ring-2 ring-surface"
                aria-label="CWO geverifieerd"
              >
                <span
                  className="material-symbols-outlined text-[14px] text-on-primary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                  aria-hidden="true"
                >verified</span>
              </div>
            )}
          </div>

          {/* Naam + rol */}
          <div className="flex-1 min-w-0 pt-1">
            <h2 className="font-headline font-black text-2xl text-on-surface leading-tight">
              {profile.displayName}
            </h2>
            <p className="font-label text-sm text-on-surface-variant mt-1">
              {ROLE_LABELS[profile.sailingRole ?? 'beide']}
              {profile.homePort && (
                <span className="text-on-surface-variant/60"> · {profile.homePort}</span>
              )}
            </p>

            {/* Gemiddelde beoordeling */}
            {profile.averageRating && (
              <div className="flex items-center gap-1.5 mt-2">
                <span
                  className="material-symbols-outlined text-[16px] text-yellow-500"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                  aria-hidden="true"
                >star</span>
                <span className="font-label text-sm font-bold text-on-surface">
                  {profile.averageRating.toFixed(1)}
                </span>
                <span className="font-label text-xs text-on-surface-variant">
                  ({profile.reviewCount} {profile.reviewCount === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* CWO-badge — zoals Airbnb "Superhost" */}
        {profile.cwoLevel && profile.cwoLevel !== 'geen' && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-primary/8 border border-primary/15">
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
              <span
                className="material-symbols-outlined text-[20px] text-primary"
                style={{ fontVariationSettings: "'FILL' 1" }}
                aria-hidden="true"
              >
                {profile.cwoVerified ? 'verified' : 'school'}
              </span>
            </div>
            <div>
              <p className="font-label text-sm font-bold text-on-surface">
                {CWO_LABELS[profile.cwoLevel]}
              </p>
              <p className="font-label text-xs text-on-surface-variant">
                {profile.cwoVerified ? 'Geverifieerd vaarbewijs' : 'Vaarbewijs (niet geverifieerd)'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Bio ────────────────────────────────────────────────── */}
      {profile.bio && (
        <section className="glass-card rounded-card p-5 mb-4" aria-labelledby="bio-heading">
          <h3 id="bio-heading" className="font-label text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">
            Over mij
          </h3>
          <p className="font-body text-[15px] text-on-surface leading-relaxed">{profile.bio}</p>
        </section>
      )}

      {/* ── Vaargebieden ───────────────────────────────────────── */}
      {profile.sailingAreas && profile.sailingAreas.length > 0 && (
        <section className="glass-card rounded-card p-5 mb-4" aria-labelledby="gebieden-heading">
          <h3 id="gebieden-heading" className="font-label text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">
            Vaargebieden
          </h3>
          <div className="flex flex-wrap gap-2">
            {profile.sailingAreas.map(area => {
              const kleur = GEBIED_COLOR_HEX[area]
              const label = SAILING_AREAS.find(a => a.id === area)?.label ?? area
              return (
                <span key={area}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label text-sm font-medium"
                  style={kleur ? { backgroundColor: kleur + '1a', borderColor: kleur + '50', color: kleur, border: '1px solid' } : {}}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: kleur }} aria-hidden="true" />
                  {label}
                </span>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Boten ──────────────────────────────────────────────── */}
      {profileBoats.length > 0 && (
        <section className="glass-card rounded-card p-5 mb-4" aria-labelledby="boten-heading">
          <h3 id="boten-heading" className="font-label text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">
            Mijn boten
          </h3>
          <ul className="space-y-2">
            {profileBoats.map(boat => (
              <li key={boat.id}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-surface-container-high"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">sailing</span>
                </div>
                <div>
                  <p className="font-label text-sm font-semibold text-on-surface">
                    {boat.name ?? BOAT_LABELS[boat.type]}
                  </p>
                  {boat.homePort && (
                    <p className="font-label text-xs text-on-surface-variant">{boat.homePort}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Oproepen ───────────────────────────────────────────── */}
      <section className="glass-card rounded-card p-5 mb-4" aria-labelledby="oproepen-heading">
        <div className="flex items-center justify-between mb-3">
          <h3 id="oproepen-heading" className="font-label text-xs font-bold text-on-surface-variant uppercase tracking-widest">
            Mijn oproepen
          </h3>
          <Link
            href="/tochten/nieuw"
            className="flex items-center gap-1 font-label text-xs font-semibold text-primary
                       hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">add</span>
            Nieuw
          </Link>
        </div>

        {myTochten.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-2xl text-on-surface-variant" aria-hidden="true">directions_boat</span>
            </div>
            <p className="font-body text-sm text-on-surface-variant mb-4">Nog geen oproepen geplaatst</p>
            <Link
              href="/tochten/nieuw"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full gradient-primary
                         text-on-primary font-label text-sm font-bold shadow-glow active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">add</span>
              Oproep plaatsen
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {myTochten.map(({ tocht, aanmeldingen }) => {
              const datum      = parseISO(tocht.datum as string)
              const datumLabel = isToday(datum) ? 'Vandaag'
                : isTomorrow(datum) ? 'Morgen'
                : format(datum, 'EEE d MMM', { locale: nl })
              const kleur      = GEBIED_COLOR_HEX[tocht.vaargebied] ?? '#46f1c5'
              const gebied     = SAILING_AREAS.find(a => a.id === tocht.vaargebied)?.label ?? tocht.vaargebied
              const isPast     = new Date(tocht.datum as string) < new Date(new Date().toISOString().slice(0,10))

              return (
                <li key={tocht.id}>
                  <Link
                    href={`/tochten/${tocht.id}`}
                    className={`flex items-center gap-3 p-3 rounded-2xl transition-all
                      ${isPast
                        ? 'opacity-50 bg-surface-container-high'
                        : 'bg-surface-container-high hover:bg-surface-container'}`}
                  >
                    <div className="w-1.5 self-stretch rounded-full flex-shrink-0 min-h-[2rem]" style={{ backgroundColor: kleur }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-label text-[11px] font-bold capitalize mb-0.5" style={{ color: isPast ? undefined : kleur }}>
                        {datumLabel} · {gebied}
                      </p>
                      <p className="font-label text-sm font-semibold text-on-surface line-clamp-1">{tocht.titel}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {aanmeldingen > 0 ? (
                        <span className="px-2.5 py-0.5 rounded-full font-label text-xs font-bold"
                          style={{ backgroundColor: kleur + '22', color: kleur }}>
                          {aanmeldingen} aanm.
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-surface-container font-label text-[10px] text-on-surface-variant">
                          0 aanm.
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full font-label text-[10px] font-semibold
                        ${tocht.status === 'open' ? 'bg-primary/10 text-primary' : 'bg-surface-container text-on-surface-variant'}`}>
                        {tocht.status}
                      </span>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* ── Reviews ────────────────────────────────────────────── */}
      {profileReviews.length > 0 && (
        <section className="glass-card rounded-card p-5 mb-4" aria-labelledby="reviews-heading">
          <h3 id="reviews-heading" className="font-label text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">
            Reviews
          </h3>
          <ul className="space-y-4">
            {profileReviews.map(review => (
              <li key={review.id} className="border-b border-outline/10 last:border-0 pb-4 last:pb-0">
                <div className="flex items-center gap-0.5 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className="material-symbols-outlined text-[15px]"
                      style={{
                        fontVariationSettings: `'FILL' ${i < review.rating ? 1 : 0}`,
                        color: i < review.rating ? '#eab308' : 'var(--color-outline)',
                      }}
                      aria-hidden="true"
                    >
                      star
                    </span>
                  ))}
                </div>
                {review.text && (
                  <p className="font-body text-[14px] text-on-surface/80 leading-relaxed">{review.text}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Zeilschool ─────────────────────────────────────────── */}
      <section className="glass-card rounded-card p-5 mb-4" aria-labelledby="school-heading">
        <div className="flex items-center justify-between mb-3">
          <h3 id="school-heading" className="font-label text-xs font-bold text-on-surface-variant uppercase tracking-widest">
            Zeilschool
          </h3>
          {mySchools.length === 0 && (
            <Link
              href="/school/nieuw"
              className="flex items-center gap-1 font-label text-xs font-semibold text-primary hover:underline"
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">add</span>
              Aanmelden
            </Link>
          )}
        </div>

        {mySchools.length === 0 ? (
          <div className="text-center py-4">
            <p className="font-body text-sm text-on-surface-variant mb-3">
              Nog geen zeilschool gekoppeld.
            </p>
            <Link
              href="/school/nieuw"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-primary/10
                         text-primary font-label text-sm font-semibold hover:bg-primary/15 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">school</span>
              School aanmelden
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {mySchools.map(school => {
              const href = school.role === 'cursist'
                ? '/mijn-vorderingen'
                : `/school/${school.id}/dashboard`
              const icon = school.role === 'eigenaar'    ? 'star'
                         : school.role === 'instructeur' ? 'person_check'
                         : 'school'
              const roleLabel = school.role === 'eigenaar'    ? 'Eigenaar'
                              : school.role === 'instructeur' ? 'Instructeur'
                              : 'Cursist'
              return (
                <li key={school.id}>
                  <Link
                    href={href}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-surface-container-high
                               hover:bg-surface-container transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-primary text-[18px]" aria-hidden="true">{icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-label text-sm font-semibold text-on-surface truncate">{school.name}</p>
                      <p className="font-label text-xs text-on-surface-variant">
                        {roleLabel}{school.city ? ` · ${school.city}` : ''}
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant/50 flex-shrink-0" aria-hidden="true">chevron_right</span>
                  </Link>
                </li>
              )
            })}

            {mySchools.some(s => s.role === 'cursist') && (
              <li>
                <Link
                  href="/mijn-vorderingen"
                  className="flex items-center gap-3 p-3 rounded-2xl border border-primary/15 bg-primary/5
                             hover:bg-primary/10 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary text-[18px]" aria-hidden="true">trending_up</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-label text-sm font-semibold text-primary">Mijn vorderingen</p>
                    <p className="font-label text-xs text-on-surface-variant">Jouw vorderingenstaat per cursus</p>
                  </div>
                  <span className="material-symbols-outlined text-[18px] text-primary/60 flex-shrink-0" aria-hidden="true">chevron_right</span>
                </Link>
              </li>
            )}
          </ul>
        )}
      </section>

      {/* ── Uitloggen ──────────────────────────────────────────── */}
      <div className="flex justify-center pb-4">
        <form action={async () => {
          'use server'
          await signOut({ redirectTo: '/' })
        }}>
          <button
            type="submit"
            className="flex items-center gap-1.5 font-label text-xs text-on-surface-variant/50
                       hover:text-error transition-colors
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-error rounded px-3 py-1.5"
            aria-label="Uitloggen"
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">logout</span>
            Uitloggen
          </button>
        </form>
      </div>

    </div>
  )
}
