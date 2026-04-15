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

  return (
    <div className="px-4 pt-6 pb-28">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-headline font-black text-2xl text-on-surface">Profiel</h1>
        <Link
          href="/profiel/bewerken"
          className="flex items-center gap-1.5 px-4 py-2 glass-card rounded-full border border-white/10
                     font-label text-sm font-bold text-on-surface hover:border-primary/30 transition-all
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Profiel bewerken"
        >
          <span className="material-symbols-outlined text-sm text-primary" aria-hidden="true">edit</span>
          Bewerken
        </Link>
      </div>

      {/* ── Identiteitskaart ───────────────────────────────────── */}
      <div className="glass-card rounded-card p-5 mb-4">

        {/* Foto + naam + rol */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-surface-container-high flex-shrink-0">
            {profile.photoUrl ? (
              <Image
                src={profile.photoUrl}
                alt="Jouw profielfoto"
                width={56}
                height={56}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center"
                   style={{ background: 'linear-gradient(160deg, #0c4a6e 0%, #065f46 100%)' }}>
                <span className="font-headline font-black text-xl text-white/90 select-none leading-none">
                  {profile.displayName.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="font-headline font-black text-xl text-on-surface leading-tight truncate">
              {profile.displayName}
            </h2>
            <p className="font-label text-xs text-on-surface-variant mt-0.5">
              {ROLE_LABELS[profile.sailingRole ?? 'beide']}
              {profile.homePort && (
                <> · <span>{profile.homePort}</span></>
              )}
            </p>
            {profile.cwoLevel && profile.cwoLevel !== 'geen' && (
              <div className="flex items-center gap-1 mt-1">
                <span
                  className="material-symbols-outlined text-[11px] text-primary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                  aria-hidden="true"
                >
                  {profile.cwoVerified ? 'verified' : 'school'}
                </span>
                <span className="font-label text-[11px] text-primary font-semibold">
                  {CWO_LABELS[profile.cwoLevel]}
                  {!profile.cwoVerified && <span className="text-on-surface-variant font-normal"> (niet geverifieerd)</span>}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Credential pills */}
        {profile.averageRating && (
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-card border border-white/10">
              <span
                className="material-symbols-outlined text-xs text-yellow-400"
                style={{ fontVariationSettings: "'FILL' 1" }}
                aria-hidden="true"
              >star</span>
              <span className="font-label text-xs font-bold text-on-surface">{profile.averageRating.toFixed(1)}</span>
              <span className="font-label text-xs text-on-surface-variant">
                ({profile.reviewCount} {profile.reviewCount === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Bio ────────────────────────────────────────────────── */}
      {profile.bio && (
        <section className="glass-card rounded-card p-5 mb-4">
          <h3 className="font-label text-[11px] font-bold text-primary uppercase tracking-widest border-l-2 border-primary pl-3 mb-3">
            Over mij
          </h3>
          <p className="font-body text-sm text-on-surface/80 leading-relaxed">{profile.bio}</p>
        </section>
      )}

      {/* ── Oproepen ───────────────────────────────────────────── */}
      <section className="glass-card rounded-card p-5 mb-4" aria-labelledby="oproepen-heading">
        <div className="flex items-center justify-between mb-3">
          <h3 id="oproepen-heading" className="font-label text-[11px] font-bold text-primary uppercase tracking-widest border-l-2 border-primary pl-3">
            Mijn oproepen
          </h3>
          <Link
            href="/tochten/nieuw"
            className="flex items-center gap-1 font-label text-xs text-primary hover:underline"
          >
            <span className="material-symbols-outlined text-sm" aria-hidden="true">add</span>
            Nieuw
          </Link>
        </div>

        {myTochten.length === 0 ? (
          <div className="text-center py-4">
            <span className="material-symbols-outlined text-2xl text-on-surface-variant mb-2 block" aria-hidden="true">directions_boat</span>
            <p className="font-body text-sm text-on-surface-variant mb-3">Nog geen oproepen geplaatst</p>
            <Link
              href="/tochten/nieuw"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full gradient-primary text-on-primary font-label text-sm font-bold shadow-glow active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-sm" aria-hidden="true">add</span>
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
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all
                      ${isPast ? 'opacity-50 border-white/5 bg-surface-container/50' : 'border-white/5 bg-surface-container hover:border-primary/20'}`}
                  >
                    <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: kleur }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-label text-[10px] font-black capitalize mb-0.5" style={{ color: isPast ? undefined : kleur }}>
                        {datumLabel} · {gebied}
                      </p>
                      <p className="font-headline font-bold text-sm text-on-surface line-clamp-1">{tocht.titel}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {aanmeldingen > 0 ? (
                        <span className="px-2.5 py-0.5 rounded-full font-label text-xs font-bold"
                          style={{ backgroundColor: kleur + '22', color: kleur }}>
                          {aanmeldingen} aanm.
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high font-label text-[10px] text-on-surface-variant">
                          0 aanm.
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full font-label text-[10px] font-semibold
                        ${tocht.status === 'open' ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
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

      {/* ── Boten ──────────────────────────────────────────────── */}
      {profileBoats.length > 0 && (
        <section className="glass-card rounded-card p-5 mb-4" aria-labelledby="boten-heading">
          <h3 id="boten-heading" className="font-label text-[11px] font-bold text-primary uppercase tracking-widest border-l-2 border-primary pl-3 mb-3">
            Mijn boten
          </h3>
          <ul className="space-y-2">
            {profileBoats.map(boat => (
              <li key={boat.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl border-l-2 border-primary bg-surface-container"
              >
                <span className="material-symbols-outlined text-base text-primary" aria-hidden="true">sailing</span>
                <div>
                  <p className="font-label text-sm font-bold text-on-surface">
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

      {/* ── Vaargebieden ───────────────────────────────────────── */}
      {profile.sailingAreas && profile.sailingAreas.length > 0 && (
        <section className="glass-card rounded-card p-5 mb-4" aria-labelledby="gebieden-heading">
          <h3 id="gebieden-heading" className="font-label text-[11px] font-bold text-primary uppercase tracking-widest border-l-2 border-primary pl-3 mb-3">
            Vaargebieden
          </h3>
          <div className="flex flex-wrap gap-2">
            {profile.sailingAreas.map(area => {
              const kleur = GEBIED_COLOR_HEX[area]
              const label = SAILING_AREAS.find(a => a.id === area)?.label ?? area
              return (
                <span key={area}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label text-xs font-semibold"
                  style={kleur ? { backgroundColor: kleur + '22', borderColor: kleur + '44', color: kleur, border: '1px solid' } : {}}
                >
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: kleur }} aria-hidden="true" />
                  {label}
                </span>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Reviews ────────────────────────────────────────────── */}
      {profileReviews.length > 0 && (
        <section className="glass-card rounded-card p-5 mb-4" aria-labelledby="reviews-heading">
          <h3 id="reviews-heading" className="font-label text-[11px] font-bold text-primary uppercase tracking-widest border-l-2 border-primary pl-3 mb-3">
            Reviews
          </h3>
          <ul className="space-y-4">
            {profileReviews.map(review => (
              <li key={review.id} className="border-b border-white/5 last:border-0 pb-4 last:pb-0">
                <div className="flex items-center gap-0.5 mb-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className="material-symbols-outlined text-sm"
                      style={{
                        fontVariationSettings: `'FILL' ${i < review.rating ? 1 : 0}`,
                        color: i < review.rating ? '#46f1c5' : '#85948d',
                      }}
                      aria-hidden="true"
                    >
                      star
                    </span>
                  ))}
                </div>
                {review.text && (
                  <p className="font-body text-sm text-on-surface/75">{review.text}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Zeilschool ─────────────────────────────────────────── */}
      <section className="glass-card rounded-card p-5 mb-4" aria-labelledby="school-heading">
        <div className="flex items-center justify-between mb-3">
          <h3 id="school-heading" className="font-label text-[11px] font-bold text-primary uppercase tracking-widest border-l-2 border-primary pl-3">
            Zeilschool
          </h3>
          {mySchools.length === 0 && (
            <Link
              href="/school/nieuw"
              className="flex items-center gap-1 font-label text-xs text-primary hover:underline"
            >
              <span className="material-symbols-outlined text-sm" aria-hidden="true">add</span>
              Aanmelden
            </Link>
          )}
        </div>

        {mySchools.length === 0 ? (
          <div className="text-center py-3">
            <p className="font-body text-sm text-on-surface-variant mb-3">
              Nog geen zeilschool gekoppeld.
            </p>
            <Link
              href="/school/nieuw"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary/10 text-primary font-label text-sm font-semibold hover:bg-primary/20 transition-colors"
            >
              <span className="material-symbols-outlined text-sm" aria-hidden="true">school</span>
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
                    className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-surface-container hover:border-primary/20 hover:bg-surface-container-high transition-all"
                  >
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-primary text-base" aria-hidden="true">{icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-label text-sm font-semibold text-on-surface truncate">{school.name}</p>
                      <p className="font-label text-xs text-on-surface-variant">
                        {roleLabel}{school.city ? ` · ${school.city}` : ''}
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-sm text-on-surface-variant flex-shrink-0" aria-hidden="true">chevron_right</span>
                  </Link>
                </li>
              )
            })}

            {mySchools.some(s => s.role === 'cursist') && (
              <li>
                <Link
                  href="/mijn-vorderingen"
                  className="flex items-center gap-3 p-3 rounded-xl border border-primary/15 bg-primary/5 hover:bg-primary/10 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary text-base" aria-hidden="true">trending_up</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-label text-sm font-semibold text-primary">Mijn vorderingen bekijken</p>
                    <p className="font-label text-xs text-on-surface-variant">Jouw vorderingenstaat per cursus</p>
                  </div>
                  <span className="material-symbols-outlined text-sm text-primary flex-shrink-0" aria-hidden="true">chevron_right</span>
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
            className="flex items-center gap-1.5 font-label text-xs text-on-surface/40 hover:text-error transition-colors
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-error rounded px-2 py-1"
            aria-label="Uitloggen"
          >
            <span className="material-symbols-outlined text-sm" aria-hidden="true">logout</span>
            Uitloggen
          </button>
        </form>
      </div>

    </div>
  )
}
