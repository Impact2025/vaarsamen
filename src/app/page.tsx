import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { SiteNav } from '@/components/marketing/SiteNav'
import { AppMockup } from '@/components/marketing/AppMockup'
import { FaqAccordion, type FaqItem } from '@/components/marketing/FaqAccordion'

/**
 * Veilige variant van auth() voor openbaar toegankelijke pagina's.
 * Een corrupt/verlopen sessie-cookie (bijv. JWEInvalid / JWTSessionError)
 * mag nooit een publieke pagina laten crashen met een 500 — we vangen de
 * fout af en gaan uit van "geen sessie", zodat de pagina gewoon rendert.
 */
async function getSessionSafe() {
  try {
    return await auth()
  } catch {
    return null
  }
}

export const metadata: Metadata = {
  title: 'VaarSamen — Het complete platform voor jouw zeilschool',
  description:
    'VaarSamen digitaliseert je zeilschool: cursistenbeheer, CWO-voortgangsregistratie, lesplanning, vloot- en verhuurbeheer en AI-ondersteuning. Eén app voor school én cursist.',
  keywords: [
    'zeilschool software',
    'CWO voortgang',
    'zeilschool app',
    'lesplanning zeilen',
    'vlootbeheer',
    'zeilschool administratie',
  ],
  openGraph: {
    title: 'VaarSamen — Het complete platform voor jouw zeilschool',
    description:
      'Digitaliseer je zeilschool met cursistenbeheer, CWO-voortgang, planning en AI-ondersteuning.',
    type: 'website',
    locale: 'nl_NL',
  },
}

const PROBLEMS = [
  {
    icon: 'description',
    title: 'Papieren vorderingenstaten',
    body: 'Scores per les bijhouden in Excel of op papier kost tijd en raakt kwijt. Instructeurs weten nooit exact waar een cursist staat.',
    fix: 'Digitale AMRB-registratie per les, altijd up-to-date en met één klik printbaar voor het CWO-examen.',
  },
  {
    icon: 'event_busy',
    title: 'Rommelige lesplanning',
    body: 'Wie zit in welke boot, met welke wind? Dubbele bezetting en vergeten lessen zijn aan de orde van de dag.',
    fix: 'Overzichtelijke lesplanning met boot, cursist en weersomstandigheden — geen overlap meer.',
  },
  {
    icon: 'directions_boat',
    title: 'Onoverzichtelijke vloot',
    body: 'Boten die kapot gaan of dubbel verhuurd zijn, zonder dat iemand het doorheeft. Onderhoud kwijt in het hoofd.',
    fix: 'Volledig vlootbeheer: status, storingen en verhuur met goedkeuringsstroom in één dashboard.',
  },
  {
    icon: 'forum',
    title: 'Cursisten die je loslaat',
    body: 'Na de cursus hoor je ze nooit meer. Geen binding, geen vervolg en geen extra omzet uit verhuur of tochten.',
    fix: 'Cursisten blijven in de app voor tochten, verhuur en community — jouw school top of mind.',
  },
]

const FUNCTIONS = [
  {
    icon: 'groups',
    title: 'Cursistenbeheer',
    body: 'Voeg cursisten toe via unieke uitnodigingscodes per cursus. Rollen met eigen rechten: eigenaar, instructeur of cursist.',
  },
  {
    icon: 'insights',
    title: 'Voortgangsregistratie (AMRB)',
    body: 'Score per les per vaardigheid op Aangeboden, Matig, Redelijk, Beheerst — volledig afgestemd op de CWO-systematiek.',
  },
  {
    icon: 'calendar_month',
    title: 'Lesplanning',
    body: 'Plan lessen met datum, windrichting en Beaufort. Leg vast wie in welke boot zat en of er solo gevaren werd.',
  },
  {
    icon: 'directions_boat',
    title: 'Vlootbeheer',
    body: 'Beheer je bootpark met nummer, type en naam. Koppel boten aan lessen en houd storingen en onderhoud bij.',
  },
  {
    icon: 'handshake',
    title: 'Verhuurplanning',
    body: 'Cursisten vragen boten aan buiten lestijden. Jij keurt goed of af — met blokkering bij onderhoud of dubbele bezetting.',
  },
  {
    icon: 'auto_awesome',
    title: 'AI-lesvoorbereiding & analyse',
    body: 'Genereer automatisch lessamenvattingen en krijg AI-inzichten in voortgang. Herken zwakke vaardigheden en verbeterpunten.',
    ai: true,
  },
  {
    icon: 'print',
    title: 'Vorderingenstaat afdrukken',
    body: 'Genereer met één klik een print-klare vorderingenstaat per cursist — inclusief alle lessen, scores en notities.',
  },
  {
    icon: 'chat',
    title: 'Berichten & tochten',
    body: 'Real-time chat tussen school, instructeur en cursist. Plaats tochten en bemanningsoproepen voor de hele community.',
  },
]

const PRICING = [
  {
    name: 'Basis',
    price: '€0',
    period: '',
    desc: 'Ideaal voor kleine scholen die willen starten met digitale voortgangsregistratie.',
    cta: 'Gratis starten',
    href: '/registreer',
    features: [
      '1 actieve cursus',
      'Tot 20 cursisten',
      'AMRB-voortgangsregistratie',
      'Lesplanning en aanwezigheid',
      'Uitnodigingscodes per cursus',
    ],
  },
  {
    name: 'School',
    price: '€39',
    period: '/ maand',
    desc: 'Voor groeiende scholen met meerdere cursussen, een eigen vloot en verhuuractiviteiten.',
    cta: 'Start nu',
    href: '/registreer',
    popular: true,
    features: [
      'Onbeperkt cursussen en cursisten',
      'Volledig vlootbeheer',
      'Verhuurplanning met goedkeuring',
      'Onderhoud en storingen bijhouden',
      'Vorderingenstaat als PDF',
      'Meerdere instructeursrollen',
    ],
  },
  {
    name: 'School Pro',
    price: '€79',
    period: '/ maand',
    desc: 'Voor professionele scholen die AI-ondersteuning en geavanceerde rapportage willen inzetten.',
    cta: 'Neem contact op',
    href: 'mailto:info@vaarsamen.nl',
    features: [
      'AI-lesvoorbereiding per les',
      'AI-voortgangsanalyse per cursist',
      'Geavanceerde dashboard-statistieken',
      'Prioriteits-ondersteuning',
      'Onboarding & implementatiehulp',
      'Alles uit School',
    ],
  },
]

const FAQ: FaqItem[] = [
  {
    q: 'Is VaarSamen alleen voor zeilscholen of ook voor zeilers?',
    a: 'Beide. VaarSamen is één platform met twee kanten: zeilscholen gebruiken het als beheer- en lesomgeving, hun cursisten gebruiken dezelfde app om voortgang te zien, boten te huren en tochten te vinden. Zo blijft je cursist verbonden aan jouw school in plaats van naar een losse community te vertrekken.',
  },
  {
    q: 'Wat kost VaarSamen voor mijn zeilschool?',
    a: 'Je kunt gratis beginnen met het Basis-pakket (1 cursus, 20 cursisten, volledige voortgangsregistratie). Het School-pakket kost €39 per maand en ontsluit onbeperkte cursussen, vlootbeheer en verhuur. School Pro (€79 p/m) voegt AI-ondersteuning en geavanceerde rapportage toe. Geen opstartkosten, maandelijks opzegbaar.',
  },
  {
    q: 'Hoe werkt de voortgangsregistratie precies?',
    a: 'Instructeurs scoren per les per vaardigheid op het AMRB-systeem: Aangeboden, Matig, Redelijk, Beheerst. Dit is volledig afgestemd op de CWO-systematiek. De voortgang van elke cursist is altijd live inzichtelijk en met één klik als vorderingenstaat te printen voor het CWO-examen.',
  },
  {
    q: 'Kan ik mijn eigen lesplanning en vloot beheren?',
    a: 'Ja. Je plant lessen met datum, windrichting en Beaufort-schaal en koppelt per les cursisten aan boten. Het vlootbeheer houdt van elke boot de status, storingen en onderhoud bij, zodat je nooit een kapotte boot dubbel inplant.',
  },
  {
    q: 'Hoe werkt verhuur van boten buiten lestijden?',
    a: 'Cursisten vragen een boot aan via de app. Jij of een instructeur keurt de aanvraag goed of af. Bij onderhoud of een al geplande les wordt de boot automatisch geblokkeerd, zodat dubbele bezetting onmogelijk is.',
  },
  {
    q: 'Moeten mijn cursisten de app ook gebruiken?',
    a: 'Niet verplicht, maar wel de bedoeling. Je nodigt ze uit via een code; daarna zien zij hun voortgang, kunnen ze boten huren en tochten vinden. Hoe meer cursisten meedoen, hoe meer binding en vervolgomzet voor jouw school.',
  },
  {
    q: 'Is de data van mijn school veilig en AVG-proof?',
    a: 'Ja. Alle data staat in een beveiligde Europese database (AVG/GDPR-compliant) en is alleen toegankelijk voor de medewerkers die jij via rollen toegang geeft. Je kunt op elk moment data exporteren of laten verwijderen.',
  },
  {
    q: 'Werkt het ook op tablet en desktop, of alleen mobiel?',
    a: 'Overal. De app is geoptimaliseerd voor mobiel, maar het schooldashboard werkt uitstekend op tablet en desktop in de browser. Instructeurs scoren op het water via de telefoon, jij beheert de school achter je laptop.',
  },
  {
    q: 'Hoe onboarden mijn cursisten en instructeurs?',
    a: 'Je deelt per cursus een unieke uitnodigingscode. Cursisten en instructeurs registreren zich met die code en zitten direct in de juiste cursus met de juiste rechten. Binnen vijf minuten ben je live — geen installatie op jouw kantoor nodig.',
  },
  {
    q: 'Kan ik een vorderingenstaat printen voor het CWO-examen?',
    a: 'Ja. Per cursist genereer je met één klik een print-klare vorderingenstaat met alle lessen, scores en notities van de instructeur. Klaar om mee te nemen naar het examen of op te sturen naar de CWO-organisatie.',
  },
  {
    q: 'Wat doet de AI-functie precies?',
    a: 'In School Pro genereert de AI automatisch lessamenvattingen en analyseert het de voortgang per cursist. Je ziet direct welke vaardigheden aandacht nodig hebben en krijgt concrete verbeterpunten voor de volgende les — geen uren analysewerk meer.',
  },
  {
    q: 'Kan ik van pakket wisselen of opzeggen?',
    a: 'Altijd. Je upgrade of downgrade maandelijks vanuit je dashboard en zegt op wanneer je wilt — geen contract voor vast. Je data blijft beschikbaar tot het einde van de periode en is daarna exportbaar.',
  },
  {
    q: 'Is er een koppeling met mijn eigen website of email?',
    a: 'De uitnodigingscodes en inschrijfflow zijn zo te delen via je eigen site of nieuwsbrief. Uitgebreide API-koppelingen en white-label opties bespreken we graag in het School Pro-traject.',
  },
  {
    q: 'Vanaf hoeveel cursisten loont VaarSamen?',
    a: 'Eigenlijk direct. Al vanaf je eerste cursus bespaar je tijd op administratie en krijg je een professionele uitstraling naar cursisten. Scholen met meerdere cursussen en een vloot halen het meeste uit het School-pakket.',
  },
]

const STATS = [
  { num: '15+', label: 'Jaar bestuurservaring' },
  { num: '2025', label: 'Opgericht' },
  { num: '2-in-1', label: 'School én community' },
  { num: 'NL', label: 'Gemaakt voor Nederland' },
]

export default async function LandingPage() {
  const session = await getSessionSafe()
  if (session?.user) {
    redirect('/ontdekken')
  }

  return (
    <div className="min-h-screen bg-surface">
      <SiteNav />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-secondary/5 blur-3xl" />
        </div>

        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 font-label text-xs font-bold uppercase tracking-wider text-primary">
              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>sailing</span>
              Voor zeilscholen
            </span>

            <h1 className="mt-6 font-headline text-4xl font-black leading-[1.02] tracking-tight text-on-surface sm:text-5xl lg:text-6xl">
              Het complete platform voor{' '}
              <span className="text-primary">jouw zeilschool</span>
            </h1>

            <p className="mt-6 max-w-xl font-body text-lg leading-relaxed text-on-surface-variant">
              Van eerste les tot CWO-examen: VaarSamen digitaliseert je cursistenbeheer,
              voortgang, planning en vloot in één app. Voor school én cursist.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/registreer"
                className="rounded-full gradient-primary px-7 py-4 font-headline text-base font-extrabold text-on-primary shadow-glow transition-transform active:scale-95"
              >
                Gratis starten
              </Link>
              <a
                href="#prijzen"
                className="rounded-full glass-card border border-black/5 px-7 py-4 font-headline text-base font-bold text-on-surface transition-colors hover:text-primary"
              >
                Bekijk prijzen
              </a>
            </div>

            <p className="mt-6 font-label text-sm text-on-surface-variant">
              Geen creditcard nodig · In 5 minuten live · Een product van{' '}
              <a href="https://weareimpact.nl" target="_blank" rel="noopener noreferrer" className="font-bold text-primary hover:underline">
                WeAreImpact
              </a>
            </p>
          </div>

          <div className="flex justify-center">
            <AppMockup />
          </div>
        </div>
      </section>

      {/* ── STATS / TRUST ── */}
      <section className="border-y border-black/5 bg-surface-container-low">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 py-10 sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-headline text-3xl font-black tracking-tight text-primary sm:text-4xl">
                {s.num}
              </div>
              <div className="mt-1 font-label text-xs font-semibold text-on-surface-variant">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── OPLOSSING ── */}
      <section id="oplossing" className="mx-auto max-w-6xl px-5 py-20 lg:py-28">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 font-label text-sm font-bold uppercase tracking-wider text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Wat wij oplossen
          </div>
          <h2 className="mt-4 font-headline text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
            Weg met papierwerk. Terug naar het water.
          </h2>
          <p className="mt-4 font-body text-lg leading-relaxed text-on-surface-variant">
            Zeilscholen worstelen met dezelfde rompslomp. VaarSamen pakt de vier grootste
            administratieve ergernissen aan — en geeft je tijd terug voor waar het om draait: lesgeven.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {PROBLEMS.map((p) => (
            <div key={p.title} className="glass-card rounded-3xl border border-black/5 p-7">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-error/10">
                  <span className="material-symbols-outlined text-xl text-error" style={{ fontVariationSettings: "'FILL' 1" }}>{p.icon}</span>
                </span>
                <h3 className="font-headline text-lg font-bold text-on-surface">{p.title}</h3>
              </div>
              <p className="mt-4 font-body text-sm leading-relaxed text-on-surface-variant">{p.body}</p>
              <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-primary/5 px-4 py-3">
                <span className="material-symbols-outlined mt-0.5 text-[18px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <p className="font-body text-sm font-medium text-on-surface">{p.fix}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FUNCTIES ── */}
      <section id="functies" className="bg-surface-container-low py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-5">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 font-label text-sm font-bold uppercase tracking-wider text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Functies van de app
            </div>
            <h2 className="mt-4 font-headline text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
              Alles voor jouw school in één dashboard
            </h2>
            <p className="mt-4 font-body text-lg leading-relaxed text-on-surface-variant">
              Van het eerste invitatiecode tot de definitieve vorderingenstaat — VaarSamen
              digitaliseert het volledige proces van je zeilschool.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FUNCTIONS.map((f) => (
              <div
                key={f.title}
                className={`relative rounded-3xl border p-7 transition-shadow ${
                  f.ai
                    ? 'border-primary/30 bg-gradient-to-br from-primary/5 to-transparent'
                    : 'glass-card border-black/5'
                }`}
              >
                {f.ai && (
                  <span className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 font-label text-[10px] font-bold uppercase tracking-wide text-primary">
                    <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    AI
                  </span>
                )}
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                  <span className="material-symbols-outlined text-2xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>{f.icon}</span>
                </span>
                <h3 className="mt-5 font-headline text-lg font-bold text-on-surface">{f.title}</h3>
                <p className="mt-2 font-body text-sm leading-relaxed text-on-surface-variant">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRIJZEN ── */}
      <section id="prijzen" className="mx-auto max-w-6xl px-5 py-20 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex items-center justify-center gap-2 font-label text-sm font-bold uppercase tracking-wider text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Transparante prijzen
          </div>
          <h2 className="mt-4 font-headline text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
            Begin gratis, schaal wanneer je wilt
          </h2>
          <p className="mt-4 font-body text-lg leading-relaxed text-on-surface-variant">
            Geen verborgen kosten, geen creditcard. Upgrade pas als je meer nodig hebt.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {PRICING.map((t) => (
            <div
              key={t.name}
              className={`relative flex flex-col rounded-3xl border p-8 ${
                t.popular
                  ? 'border-primary shadow-glow ring-1 ring-primary'
                  : 'glass-card border-black/5'
              }`}
            >
              {t.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full gradient-primary px-4 py-1 font-label text-xs font-bold text-on-primary shadow-glow">
                  Meest gekozen
                </span>
              )}
              <h3 className="font-label text-sm font-bold uppercase tracking-wider text-on-surface-variant">
                {t.name}
              </h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-headline text-4xl font-black tracking-tight text-on-surface">
                  {t.price}
                </span>
                {t.period && (
                  <span className="font-label text-sm font-semibold text-on-surface-variant">
                    {t.period}
                  </span>
                )}
              </div>
              <p className="mt-3 font-body text-sm leading-relaxed text-on-surface-variant">
                {t.desc}
              </p>

              <Link
                href={t.href}
                className={`mt-6 block rounded-full px-6 py-3.5 text-center font-headline text-sm font-bold transition-transform active:scale-95 ${
                  t.popular
                    ? 'gradient-primary text-on-primary shadow-glow'
                    : 'glass-card border border-primary/30 text-primary hover:bg-primary/5'
                }`}
              >
                {t.cta}
              </Link>

              <ul className="mt-7 flex flex-col gap-3">
                {t.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined mt-0.5 shrink-0 text-[18px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span className="font-body text-sm text-on-surface">{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── WIE ZIJN WIJ ── */}
      <section id="over-ons" className="bg-surface-container-low py-20 lg:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-2">
          <div>
            <div className="flex items-center gap-2 font-label text-sm font-bold uppercase tracking-wider text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Wie zijn wij
            </div>
            <h2 className="mt-4 font-headline text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
              Innovatie met een sociaal hart
            </h2>
            <p className="mt-5 font-body text-lg leading-relaxed text-on-surface-variant">
              VaarSamen is een product van{' '}
              <a href="https://weareimpact.nl" target="_blank" rel="noopener noreferrer" className="font-bold text-primary hover:underline">
                WeAreImpact
              </a>{' '}
              — een innovatiebureau dat technologie bouwt die mensen écht verbindt. Wij
              geloven dat de beste software ontstaat als je de werkvloer begrijpt én de
              technologie beheerst.
            </p>
            <p className="mt-4 font-body text-lg leading-relaxed text-on-surface-variant">
              We bouwen VaarSamen voor de Nederlandse zeilersgemeenschap: van de
              weekend-zeiler die een maatje zoekt, tot de professionele zeilschool die haar
              cursusadministratie wil moderniseren.
            </p>

            <div className="mt-8 flex flex-col gap-4">
              {[
                { icon: 'groups', t: 'Gemeenschap voorop', b: 'Elk feature-besluit begint met: maakt dit het varen veiliger, leuker of makkelijker?' },
                { icon: 'shield', t: 'Veiligheid en vertrouwen', b: 'Verificatie, beoordelingen en een meldingssysteem zorgen dat je weet met wie je vaart.' },
                { icon: 'bolt', t: 'Technologie die werkt', b: 'Slimme AI, real-time communicatie en een interface gebouwd door mensen die de bestuurstafel én de code kennen.' },
              ].map((v) => (
                <div key={v.t} className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <span className="material-symbols-outlined text-lg text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>{v.icon}</span>
                  </span>
                  <div>
                    <p className="font-headline text-sm font-bold text-on-surface">{v.t}</p>
                    <p className="font-body text-sm text-on-surface-variant">{v.b}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] bg-[#071325] p-8 text-white">
            <div aria-hidden="true" className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/15 blur-3xl" />
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary">
              <span className="material-symbols-outlined text-2xl text-on-primary" style={{ fontVariationSettings: "'FILL' 1" }}>sailing</span>
            </span>
            <p className="mt-6 font-headline text-xl font-bold italic leading-snug text-[#d7e3fc]">
              &ldquo;Ik spreek de taal van de bestuurder, maar ik kan ook zelf de technische
              oplossingen bouwen.&rdquo;
            </p>
            <div className="mt-6 border-t border-white/10 pt-6">
              <p className="font-headline font-bold text-white">Vincent van Munster</p>
              <p className="font-label text-sm text-[#d7e3fc]/55">Oprichter &amp; CEO, WeAreImpact</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="mx-auto max-w-6xl px-5 py-20 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex items-center justify-center gap-2 font-label text-sm font-bold uppercase tracking-wider text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Veelgestelde vragen
          </div>
          <h2 className="mt-4 font-headline text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
            Alles wat je wilt weten
          </h2>
          <p className="mt-4 font-body text-lg leading-relaxed text-on-surface-variant">
            Staat je vraag er niet bij? Mail ons op{' '}
            <a href="mailto:info@vaarsamen.nl" className="font-bold text-primary hover:underline">
              info@vaarsamen.nl
            </a>
            .
          </p>
        </div>

        <div className="mt-12">
          <FaqAccordion items={FAQ} />
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative overflow-hidden bg-[#071325] py-20 lg:py-28">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_700px_400px_at_50%_100%,rgba(70,241,197,.10),transparent)]" />
        <div className="relative mx-auto max-w-3xl px-5 text-center">
          <h2 className="font-headline text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Klaar om je zeilschool te digitaliseren?
          </h2>
          <p className="mt-4 font-body text-lg text-[#d7e3fc]/60">
            Maak vandaag nog een gratis account aan. Geen creditcard, geen verborgen kosten.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/registreer"
              className="rounded-full gradient-primary px-8 py-4 font-headline text-base font-extrabold text-on-primary shadow-glow transition-transform active:scale-95"
            >
              Start gratis als zeilschool
            </Link>
            <a
              href="mailto:info@vaarsamen.nl"
              className="rounded-full border border-white/20 px-8 py-4 font-headline text-base font-bold text-[#d7e3fc] transition-colors hover:border-white/50 hover:text-white"
            >
              Neem contact op
            </a>
          </div>
          <p className="mt-6 font-label text-xs text-[#d7e3fc]/30">
            Een product van WeAreImpact · Made in Nederland
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#040d1a] px-5 py-14 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl gradient-primary">
                <span className="material-symbols-outlined text-[20px] text-on-primary" style={{ fontVariationSettings: "'FILL' 1" }}>sailing</span>
              </span>
              <span className="font-headline text-lg font-extrabold">VaarSamen</span>
            </Link>
            <p className="mt-4 max-w-xs font-body text-sm leading-relaxed text-white/35">
              Het complete platform voor de Nederlandse zeilschool — van les tot examen.
            </p>
          </div>

          <div>
            <p className="font-label text-xs font-bold uppercase tracking-wider text-white/35">Platform</p>
            <div className="mt-4 flex flex-col gap-2.5">
              <a href="#oplossing" className="font-body text-sm text-white/55 hover:text-primary">Wat wij oplossen</a>
              <a href="#functies" className="font-body text-sm text-white/55 hover:text-primary">Functies</a>
              <a href="#prijzen" className="font-body text-sm text-white/55 hover:text-primary">Prijzen</a>
              <a href="#over-ons" className="font-body text-sm text-white/55 hover:text-primary">Wie zijn wij</a>
            </div>
          </div>

          <div>
            <p className="font-label text-xs font-bold uppercase tracking-wider text-white/35">Zeilschool</p>
            <div className="mt-4 flex flex-col gap-2.5">
              <a href="#functies" className="font-body text-sm text-white/55 hover:text-primary">Cursistenbeheer</a>
              <a href="#functies" className="font-body text-sm text-white/55 hover:text-primary">Voortgang (CWO)</a>
              <a href="#functies" className="font-body text-sm text-white/55 hover:text-primary">Vloot & verhuur</a>
              <a href="#faq" className="font-body text-sm text-white/55 hover:text-primary">FAQ</a>
            </div>
          </div>

          <div>
            <p className="font-label text-xs font-bold uppercase tracking-wider text-white/35">Contact</p>
            <div className="mt-4 flex flex-col gap-2.5">
              <a href="mailto:info@vaarsamen.nl" className="font-body text-sm text-white/55 hover:text-primary">info@vaarsamen.nl</a>
              <a href="https://weareimpact.nl" target="_blank" rel="noopener noreferrer" className="font-body text-sm text-white/55 hover:text-primary">WeAreImpact</a>
              <a href="#" className="font-body text-sm text-white/55 hover:text-primary">LinkedIn</a>
              <a href="#" className="font-body text-sm text-white/55 hover:text-primary">Privacy & voorwaarden</a>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-12 flex max-w-6xl flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 sm:flex-row">
          <span className="font-label text-xs text-white/25">© 2025 VaarSamen. Alle rechten voorbehouden.</span>
          <span className="font-label text-xs text-white/25">
            Een product van{' '}
            <a href="https://weareimpact.nl" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              WeAreImpact
            </a>
          </span>
        </div>
      </footer>
    </div>
  )
}
