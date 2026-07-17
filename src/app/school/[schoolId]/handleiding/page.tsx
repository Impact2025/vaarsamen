import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getSchoolMembership } from '@/lib/db/queries/school'
import type { SchoolRole } from '@/lib/db/schema'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Handleiding · VaarSamen Zeilschool',
}

interface Props {
  params: Promise<{ schoolId: string }>
}

export default async function HandleidingPage({ params }: Props) {
  const session = await auth()
  if (!session?.user?.id) redirect('/school/login')

  const { schoolId } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership) redirect('/')

  const isEigenaar    = membership.role === 'eigenaar'
  const isInstructeur = membership.role === 'eigenaar' || membership.role === 'instructeur'

  return (
    <div className="max-w-2xl mx-auto space-y-10 pb-16">

      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
          <span className="material-symbols-outlined text-sm text-primary" aria-hidden="true">menu_book</span>
          <span className="font-label text-[11px] font-black uppercase tracking-widest text-primary">Handleiding</span>
        </div>
        <h1 className="font-headline font-black text-3xl text-on-surface">
          VaarSamen Zeilschool
        </h1>
        <p className="font-body text-on-surface-variant text-sm leading-relaxed">
          Alles wat je nodig hebt om je school te beheren — lessen, vloot, verhuur en meer.
        </p>
      </div>

      {/* Inhoudsopgave */}
      <nav
        className="bg-surface-container rounded-2xl border border-white/5 p-4 space-y-1"
        aria-label="Inhoudsopgave"
      >
        <p className="font-label text-[11px] uppercase tracking-widest text-on-surface-variant mb-3">Inhoudsopgave</p>
        {[
          { href: '#dashboard',      label: 'Dashboard & overzicht'         },
          { href: '#lessen',         label: 'Lessen & cursussen beheren'    },
          { href: '#lesdag',         label: 'Lesdag registreren'            },
          { href: '#cursisten',      label: 'Cursisten & vorderingen'       },
          ...(isInstructeur ? [
            { href: '#berichten', label: 'Berichten & mededelingen' },
            { href: '#nieuwsbrief', label: 'Nieuwsbrief versturen' },
          ] : []),
          ...(isEigenaar ? [
            { href: '#team',         label: 'Team & uitnodigingen'          },
            { href: '#vloot',        label: 'Vloot & beschikbaarheid'       },
            { href: '#verhuur',      label: 'Bootverhuur'                   },
            { href: '#meldingen',    label: 'Meldingen & onderhoud'         },
            { href: '#financieel',   label: 'Financieel overzicht'          },
            { href: '#instellingen', label: 'Instellingen & tarieven'       },
          ] : []),
        ].map(item => (
          <a
            key={item.href}
            href={item.href}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-on-surface-variant hover:text-on-surface
                       hover:bg-surface-container-high font-body text-sm transition-colors"
          >
            <span className="text-primary/60">→</span>
            {item.label}
          </a>
        ))}
      </nav>

      {/* ── 1. Dashboard ───────────────────────────────────────────────────── */}
      <Section id="dashboard" icon="dashboard" title="Dashboard & overzicht">
        <p>
          Het dashboard is het startpunt van je school. Bovenin zie je vier kerncijfers:{' '}
          <strong>cursisten</strong>, <strong>instructeurs</strong>, <strong>lessen</strong> en{' '}
          <strong>cursussen</strong> — altijd actueel.
        </p>
        <p>
          Onder de cijfers staat de <strong>tabbalk</strong>. Via de tabs bereik je alle modules:
          Lessen, Team, Berichten, Vloot, Verhuur, Meldingen en Instellingen.
        </p>
        <Tip>
          Als instructeur zie je alleen de tabs Lessen, Cursisten en Berichten.
          De overige tabs zijn voorbehouden aan de schooleigenaar.
        </Tip>
      </Section>

      {/* ── 2. Lessen & cursussen ──────────────────────────────────────────── */}
      <Section id="lessen" icon="calendar_today" title="Lessen & cursussen beheren">
        <p>
          Open de tab <strong>Lessen</strong> om je cursusplanning te beheren.
          Een <em>cursus</em> is de container (bijv. "Kielboot II 2026") waaronder meerdere <em>lesdagen</em> vallen.
        </p>

        <SubSection title="Nieuwe cursus aanmaken">
          <ol className="list-decimal list-inside space-y-1.5 text-on-surface-variant">
            <li>Tik op <Kbd>+ Nieuwe cursus</Kbd> rechtsboven in de Lessen-tab.</li>
            <li>Vul de naam in (bijv. "Blok A — Ma/Wo 2026").</li>
            <li>Kies het <strong>CWO-niveau</strong> via het keuzemenu.</li>
            <li>Stel optioneel een start- en einddatum in.</li>
            <li>Tik op <Kbd>Opslaan</Kbd>.</li>
          </ol>
        </SubSection>

        <SubSection title="Nieuwe lesdag toevoegen">
          <ol className="list-decimal list-inside space-y-1.5 text-on-surface-variant">
            <li>Klik op de cursus om hem open te klappen.</li>
            <li>Tik op <Kbd>+ Les toevoegen</Kbd>.</li>
            <li>Kies de datum en sla op.</li>
            <li>Open de lesdag via <Kbd>Les openen</Kbd> om aanwezigheid en vorderingen in te vullen.</li>
          </ol>
        </SubSection>

        <Tip>
          Recente lesdagen verschijnen direct onderaan de Lessen-tab als snelkoppeling,
          zodat je de meest actuele les altijd direct kunt openen.
        </Tip>
      </Section>

      {/* ── 3. Lesdag registreren ─────────────────────────────────────────── */}
      <Section id="lesdag" icon="edit_note" title="Lesdag registreren">
        <p>
          Elke lesdag heeft een eigen pagina waarop je per cursist de <strong>aanwezigheid</strong>,{' '}
          <strong>boot</strong>, <strong>solovaren</strong> en <strong>vorderingen</strong> bijhoudt.
        </p>

        <SubSection title="Aanwezigheid & boot instellen">
          <ol className="list-decimal list-inside space-y-1.5 text-on-surface-variant">
            <li>Open de lesdag via het dashboard.</li>
            <li>Selecteer een cursist via de tabbladen bovenin.</li>
            <li>Kies de <strong>boot</strong> (bootnummer) waarop de cursist die dag gevaren heeft.</li>
            <li>Vink <strong>Solo gevaren</strong> aan als de cursist zelfstandig heeft gevaren.</li>
            <li>Tik op <Kbd>Opslaan</Kbd> — er verschijnt een groen vinkje bij het bewaard is.</li>
          </ol>
        </SubSection>

        <SubSection title="Vorderingen scoren (AMRB)">
          <p className="text-on-surface-variant mb-3">
            Elke vaardigheid uit het CWO-curriculum scoor je op vier niveaus:
          </p>
          <div className="grid grid-cols-2 gap-2 mb-3" role="list">
            {[
              { letter: 'A', label: 'Aangeboden',   desc: 'Vaardigheid is getoond/uitgelegd',  color: 'bg-blue-500/15 border-blue-400/30 text-blue-300'   },
              { letter: 'M', label: 'Matig',         desc: 'Eerste poging, nog veel hulp nodig', color: 'bg-amber-500/15 border-amber-400/30 text-amber-300' },
              { letter: 'R', label: 'Redelijk',      desc: 'Zelfstandig maar niet foutloos',    color: 'bg-orange-500/15 border-orange-400/30 text-orange-300'},
              { letter: 'B', label: 'Beheerst',      desc: 'Zelfstandig en betrouwbaar',        color: 'bg-primary/15 border-primary/30 text-primary'      },
            ].map(s => (
              <div key={s.letter} role="listitem"
                className={`flex gap-3 p-3 rounded-xl border ${s.color}`}>
                <span className="font-headline font-black text-lg w-4 shrink-0">{s.letter}</span>
                <div>
                  <p className="font-label text-xs font-bold">{s.label}</p>
                  <p className="font-body text-[11px] opacity-70 mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-on-surface-variant">
            Tik op de letters <strong>A · M · R · B</strong> naast elke vaardigheid om de score te zetten.
            Scores worden per vaardigheid opgeslagen zodra je op <Kbd>Opslaan</Kbd> tikt.
          </p>
        </SubSection>

        <SubSection title="Opmerkingen toevoegen">
          <p className="text-on-surface-variant">
            Onder de scoretabel staat een vrij tekstveld voor <strong>opmerkingen</strong> per cursist.
            Gebruik dit voor tips, aandachtspunten of bijzonderheden van de dag.
          </p>
        </SubSection>

        <Tip>
          De <strong>AI-lesvoorbereiding</strong> knop (⚡) genereert automatisch aandachtspunten
          voor de komende les, gebaseerd op de behaalde scores van elke cursist.
        </Tip>
      </Section>

      {/* ── 4. Cursisten & vorderingen ─────────────────────────────────────── */}
      <Section id="cursisten" icon="school" title="Cursisten & vorderingen">
        <p>
          Via de tab <strong>Cursisten</strong> zie je alle ingeschreven cursisten met
          een directe link naar hun persoonlijke <strong>vorderingenstaat</strong>.
        </p>
        <p>
          De vorderingenstaat toont per vaardigheid de meest recente score en een
          voortgangsbalk (behaald / totaal). Rechtsboven staat een <Kbd>Afdrukken</Kbd>-knop
          voor een papieren exemplaar.
        </p>
        <Tip>
          Cursisten kunnen hun eigen vorderingen bekijken via <strong>Mijn vorderingen</strong>
          in de VaarSamen app — ze hoeven het dashboard niet te openen.
        </Tip>
      </Section>

      {/* ── 5. Berichten ──────────────────────────────────────────────────── */}
      <Section id="berichten" icon="forum" title="Berichten & mededelingen">
        <p>
          De tab <strong>Berichten</strong> is het prikbord van de school.
          Instructeurs en de eigenaar kunnen hier mededelingen plaatsen die
          zichtbaar zijn voor het hele schoolteam én de cursisten.
        </p>
        <SubSection title="Bericht plaatsen">
          <ol className="list-decimal list-inside space-y-1.5 text-on-surface-variant">
            <li>Open de tab <strong>Berichten</strong>.</li>
            <li>Typ je mededeling in het tekstveld (max. 2000 tekens).</li>
            <li>Tik op <Kbd>Plaatsen</Kbd>.</li>
          </ol>
        </SubSection>
        <p className="text-on-surface-variant">
          Je kunt alleen je <em>eigen</em> berichten verwijderen via het prullenbak-icoon.
          Berichten staan chronologisch, nieuwste bovenaan.
        </p>
      </Section>

      {/* ── 6. Team & uitnodigingen ── (eigenaar only) ────────────────────── */}
      {isEigenaar && (
        <Section id="team" icon="group" title="Team & uitnodigingen">
          <p>
            Via de tab <strong>Team</strong> beheer je wie toegang heeft tot je school
            en met welke rol.
          </p>

          <SubSection title="Lid direct toevoegen">
            <ol className="list-decimal list-inside space-y-1.5 text-on-surface-variant">
              <li>Tik op <Kbd>+ Lid toevoegen</Kbd>.</li>
              <li>Voer het <strong>e-mailadres</strong> in van de persoon.</li>
              <li>Kies de rol: <strong>Cursist</strong> of <strong>Instructeur</strong>.</li>
              <li>Tik op <Kbd>Toevoegen</Kbd>. De persoon heeft direct toegang.</li>
            </ol>
          </SubSection>

          <SubSection title="Uitnodigingslink aanmaken">
            <p className="text-on-surface-variant mb-2">
              Met een uitnodigingslink kunnen meerdere personen zichzelf aanmelden
              zonder dat je elk adres handmatig hoeft in te voeren.
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-on-surface-variant">
              <li>Tik op <Kbd>+ Nieuwe link</Kbd> in het gedeelte Uitnodigingslinks.</li>
              <li>Geef een label mee (bijv. "Blok A 2026").</li>
              <li>Kies de rol die nieuwe leden krijgen.</li>
              <li>Stel optioneel een maximaal aantal gebruiken in.</li>
              <li>Kopieer de link via het kopieerknopje en stuur hem door.</li>
            </ol>
          </SubSection>

          <SubSection title="Lid verwijderen">
            <p className="text-on-surface-variant">
              Klik op het prullenbak-icoon naast een naam en bevestig.
              Het lid verliest direct toegang tot het dashboard en de berichten.
            </p>
          </SubSection>

          <div className="flex gap-2 mt-3 flex-wrap">
            <RolBadge role="eigenaar" />
            <RolBadge role="instructeur" />
            <RolBadge role="cursist" />
          </div>
        </Section>
      )}

      {/* ── 7. Vloot & beschikbaarheid ── (eigenaar only) ─────────────────── */}
      {isEigenaar && (
        <Section id="vloot" icon="sailing" title="Vloot & beschikbaarheid">
          <p>
            Via de tab <strong>Vloot</strong> beheer je alle schoolboten.
            Elke boot krijgt een bootnummer, type en optionele naam.
          </p>

          <SubSection title="Boot toevoegen of bewerken">
            <ol className="list-decimal list-inside space-y-1.5 text-on-surface-variant">
              <li>Tik op <Kbd>+ Boot toevoegen</Kbd>.</li>
              <li>Vul het <strong>bootnummer</strong> in (bijv. "3" of "Valk-3").</li>
              <li>Kies het <strong>boottype</strong> (Valk, Laser, Catamaran, …).</li>
              <li>Voeg optioneel een <strong>naam</strong> toe (bijv. "Zeehond").</li>
              <li>Sla op. De boot is nu beschikbaar in lesdagen en verhuur.</li>
            </ol>
          </SubSection>

          <SubSection title="Beschikbaarheid aanpassen">
            <p className="text-on-surface-variant mb-2">
              Als een boot tijdelijk niet beschikbaar is (onderhoud, schade, reservering),
              stel je een <strong>onbeschikbaarheidsperiode</strong> in.
              De boot verschijnt dan niet als optie in de verhuurkalender.
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-on-surface-variant">
              <li>Klik op het kalender-icoon naast de boot.</li>
              <li>Kies <strong>Van</strong> en <strong>Tot</strong> datum.</li>
              <li>Voeg optioneel een reden toe (bijv. "Zeilonderhoud").</li>
              <li>Tik op <Kbd>Opslaan</Kbd>. De periode staat nu in de lijst.</li>
              <li>Verwijder een periode via het prullenbak-icoon als de boot eerder terugkomt.</li>
            </ol>
            <Tip>
              Een boot die als onbeschikbaar staat, kan nog wél worden toegewezen
              in een lesdag — de blokkade geldt alleen voor externe verhuurverzoeken.
            </Tip>
          </SubSection>
        </Section>
      )}

      {/* ── 8. Bootverhuur ── (eigenaar only) ────────────────────────────── */}
      {isEigenaar && (
        <Section id="verhuur" icon="key" title="Bootverhuur">
          <p>
            Via de tab <strong>Verhuur</strong> beheer je aanvragen van cursisten
            die een schoolboot willen huren buiten lessen om.
          </p>

          <SubSection title="Aanvraag behandelen">
            <ol className="list-decimal list-inside space-y-1.5 text-on-surface-variant">
              <li>Open de tab <strong>Verhuur</strong>. Nieuwe aanvragen staan bovenaan.</li>
              <li>Lees de details: boot, datum, tijdvak en opmerking van de cursist.</li>
              <li>
                Tik op <Kbd className="bg-primary/15 text-primary">Goedkeuren</Kbd> om te accepteren,
                of op <Kbd className="bg-error/15 text-error">Afwijzen</Kbd>.
              </li>
              <li>Bij afwijzing kun je een korte toelichting meegeven voor de cursist.</li>
            </ol>
          </SubSection>

          <SubSection title="Tarieven instellen">
            <p className="text-on-surface-variant">
              Verhuurprijzen stel je in via <strong>Instellingen → Verhuur tarieven</strong>.
              Zie het onderdeel <a href="#instellingen" className="text-primary underline">Instellingen</a>.
            </p>
          </SubSection>

          <SubSection title="Statussen">
            <div className="space-y-2">
              {[
                { label: 'Aangevraagd', desc: 'Wacht op beoordeling door eigenaar',      color: 'bg-amber-500/15 text-amber-300'  },
                { label: 'Goedgekeurd', desc: 'Cursist heeft toestemming',               color: 'bg-primary/15 text-primary'      },
                { label: 'Afgewezen',   desc: 'Geweigerd, eventueel met toelichting',    color: 'bg-error/15 text-error'          },
                { label: 'Geannuleerd', desc: 'Ingetrokken door de cursist zelf',        color: 'bg-white/10 text-on-surface-variant' },
              ].map(s => (
                <div key={s.label} className={`flex items-start gap-3 px-3 py-2.5 rounded-xl ${s.color}`}>
                  <span className="font-label text-[11px] font-black w-24 shrink-0 mt-0.5">{s.label}</span>
                  <span className="font-body text-[13px] opacity-80">{s.desc}</span>
                </div>
              ))}
            </div>
          </SubSection>
        </Section>
      )}

      {/* ── 9. Meldingen & onderhoud ── (eigenaar only) ───────────────────── */}
      {isEigenaar && (
        <Section id="meldingen" icon="report" title="Meldingen & onderhoud">
          <p>
            In de tab <strong>Meldingen</strong> houd je schade- en onderhoudsproblemen
            van schoolboten bij — van melding tot oplossing.
          </p>

          <SubSection title="Nieuwe melding aanmaken">
            <ol className="list-decimal list-inside space-y-1.5 text-on-surface-variant">
              <li>Tik op <Kbd>+ Melding toevoegen</Kbd>.</li>
              <li>Kies de <strong>boot</strong> waarop het probleem betrekking heeft.</li>
              <li>Geef een korte <strong>titel</strong> (bijv. "Zwaard losgetrild").</li>
              <li>Voeg een beschrijving toe met details.</li>
              <li>
                Stel de <strong>prioriteit</strong> in:
                <span className="text-on-surface-variant"> laag · normaal · hoog · urgent</span>.
              </li>
              <li>Tik op <Kbd>Opslaan</Kbd>. De melding staat nu op status <em>Gemeld</em>.</li>
            </ol>
          </SubSection>

          <SubSection title="Status doorvoeren">
            <p className="text-on-surface-variant mb-3">
              Klik op een melding om de details te openen.
              Doorloop de statussen via de knoppen bovenin:
            </p>
            <div className="space-y-2">
              {[
                { label: 'Gemeld',         desc: 'Net ingediend, nog niets gedaan',              color: 'bg-amber-500/15 text-amber-300'     },
                { label: 'In behandeling', desc: 'Iemand is ermee bezig',                        color: 'bg-blue-500/15 text-blue-300'       },
                { label: 'Besteld',        desc: 'Onderdeel of reparatie besteld, wacht op levering', color: 'bg-orange-500/15 text-orange-300' },
                { label: 'Gereed',         desc: 'Reparatie uitgevoerd, boot terug in gebruik',  color: 'bg-primary/15 text-primary'         },
              ].map(s => (
                <div key={s.label} className={`flex items-start gap-3 px-3 py-2.5 rounded-xl ${s.color}`}>
                  <span className="font-label text-[11px] font-black w-28 shrink-0 mt-0.5">{s.label}</span>
                  <span className="font-body text-[13px] opacity-80">{s.desc}</span>
                </div>
              ))}
            </div>
          </SubSection>

          <SubSection title="Interne notities">
            <p className="text-on-surface-variant">
              Onder de statusknop staat een veld voor <strong>interne notities</strong>
              (bijv. contactpersoon, offerte, levertijd). Deze notities zijn
              alleen zichtbaar voor eigenaar en instructeurs — niet voor cursisten.
            </p>
          </SubSection>

          <Tip>
            Na een verhuurdag vullen cursisten een <strong>nalevingsrapport</strong> in.
            Eventuele schademeldingen daarin worden automatisch als melding aangemaakt
            en gekoppeld aan de verhuurregistratie.
          </Tip>
        </Section>
      )}

      {/* ── 10. Instellingen ── (eigenaar only) ──────────────────────────── */}
      {isEigenaar && (
        <Section id="instellingen" icon="settings" title="Instellingen & tarieven">

          <SubSection title="Schoolgegevens">
            <p className="text-on-surface-variant mb-2">
              Pas de naam, het adres, de website en de beschrijving van je school aan
              via <strong>Instellingen → Schoolgegevens</strong>.
              Tik op <Kbd>Opslaan</Kbd> om wijzigingen door te voeren.
            </p>
          </SubSection>

          <SubSection title="Verhuurblokken instellen">
            <p className="text-on-surface-variant mb-2">
              <em>Verhuurblokken</em> zijn vaste tijdvakken die cursisten kunnen kiezen
              bij een verhuurverzoek (bijv. "Blok 1: 10:00–14:00").
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-on-surface-variant">
              <li>Ga naar <strong>Instellingen → Verhuurblokken</strong>.</li>
              <li>Tik op <Kbd>+ Blok toevoegen</Kbd>.</li>
              <li>Vul een <strong>label</strong> in (bijv. "Ochtend").</li>
              <li>Stel de <strong>begin-</strong> en <strong>eindtijd</strong> in.</li>
              <li>Voeg optioneel een korte omschrijving toe die cursisten te zien krijgen.</li>
              <li>Sla op. Het blok is direct beschikbaar in het verhuurformulier.</li>
            </ol>
          </SubSection>

          <SubSection title="Verhuur tarieven instellen">
            <p className="text-on-surface-variant mb-2">
              Koppel per boottype een prijs aan elk verhuurblok.
              Cursisten zien de tarieven in de verhuurkalender.
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-on-surface-variant">
              <li>Ga naar <strong>Instellingen → Verhuurtarieven</strong>.</li>
              <li>Tik op <Kbd>+ Tarief toevoegen</Kbd>.</li>
              <li>Kies de <strong>bootnaam</strong> (bijv. "Valk" of "Sloep").</li>
              <li>Vul het bedrag per verhuurblok in.</li>
              <li>Voeg optioneel een <strong>meerprijs per uur</strong> toe voor overwerk.</li>
              <li>Voeg een korte <strong>opmerking</strong> toe indien nodig (bijv. "alleen voor leden met CWO 2").</li>
              <li>Sla op — het tarief verschijnt direct in de verhuurpagina voor cursisten.</li>
            </ol>
          </SubSection>

          <SubSection title="Algemene voorwaarden verhuur">
            <p className="text-on-surface-variant">
              Onderaan de tariefenpagina staat een veld voor <strong>algemene opmerkingen</strong>
              (bijv. "Alleen voor gediplomeerde Boet-leden" of "Max. 3 aaneengesloten dagen").
              Elke regel wordt als aparte opmerking getoond bij de cursist.
            </p>
          </SubSection>
        </Section>
      )}

      {/* ── 11. Nieuwsbrief ─────────────────────────────────────────────────── */}
      {isInstructeur && (
        <Section id="nieuwsbrief" icon="campaign" title="Nieuwsbrief versturen">
          <p>
            Met de tab <strong>Nieuwsbrief</strong> bereik je al je abonnees in één keer —
            leden én niet-leden die zich hebben ingeschreven.
          </p>

          <SubSection title="Abonnees beheren">
            <p className="text-on-surface-variant">
              Voeg een adres toe via <Kbd>Uitnodigen</Kbd>. Er gaat automatisch een
              bevestigingsmail uit (double-opt-in): pas na bevestiging ontvangt het adres
              nieuwsbrieven. Je ziet per abonnee de status{' '}
              <em>actief · wacht bevestiging · uitgeschreven · gebounced</em>.
            </p>
          </SubSection>

          <SubSection title="Een campagne schrijven (pro editor)">
            <ol className="list-decimal list-inside space-y-1.5 text-on-surface-variant">
              <li>Tik op <Kbd>+ Nieuwe campagne</Kbd>.</li>
              <li>
                Kies eventueel een <strong>start-template</strong> (Welkom, Maandelijks,
                Activiteit, Seizoens-afsluiting) — de opmaak en tekst staan dan al klaar.
              </li>
              <li>
                Schrijf in de <strong>editor</strong>: vet, cursief, koppen, lijsten, links
                en afbeeldingen zijn beschikbaar via de werkbalk.
              </li>
              <li>
                Voeg persoonlijke velden toe via <strong>Invoegen: persoonlijke velden</strong>,
                bijv. <code className="font-mono text-[12px] text-primary">{'{{naam}}'}</code> en{' '}
                <code className="font-mono text-[12px] text-primary">{'{{school_naam}}'}</code> —
                die worden per ontvanger automatisch ingevuld.
              </li>
              <li>
                Schakel naar <strong>Voorbeeld</strong> om te zien hoe de mail eruitziet
                met voorbeeldgegevens.
              </li>
              <li>Tik op <Kbd>Opslaan als concept</Kbd>.</li>
            </ol>
          </SubSection>

          <SubSection title="Verzenden met segment & test">
            <p className="text-on-surface-variant mb-2">
              Bij elke concept-campagne kies je aan wie je verstuurt:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-on-surface-variant">
              <li><strong>Alle actieve</strong> — iedereen die bevestigd is.</li>
              <li><strong>Alleen leden</strong> — abonnees die ook schoollid zijn.</li>
              <li><strong>Alleen niet-leden</strong> — abonnees zonder lidmaatschap.</li>
            </ul>
            <p className="text-on-surface-variant mt-2">
              Vul een <strong>test-e-mail</strong> in om eerst een proefverzending naar jezelf
              te sturen (de campagne blijft dan op concept). Zo check je opmaak en merge-tags
              voordat je naar echte abonnees stuurt.
            </p>
          </SubSection>

          <Tip>
            Verstuur altijd eerst een test naar jezelf. Controleer of de merge-tags
            (&#123;&#123;naam&#125;&#125; e.d.) correct worden ingevuld en of de uitschrijf-link onderaan werkt.
          </Tip>
        </Section>
      )}

      {/* ── 12. Financieel ── (eigenaar + instructeur) ─────────────────────── */}
      {isInstructeur && (
        <Section id="financieel" icon="euro" title="Financieel overzicht">
          <p>
            Via <strong>Financieel</strong> (knop rechtsboven in de balk) zie je in één oogopslag
            de inkomsten en open posten van je school.
          </p>

          <SubSection title="Wat je ziet">
            <ul className="list-disc list-inside space-y-1.5 text-on-surface-variant">
              <li><strong>Verhuur ontvangen / open</strong> — omzet uit bootverhuur en wat nog niet betaald is.</li>
              <li><strong>Lidmaatschap ontvangen / open</strong> — contributie binnen en wat nog loopt.</li>
              <li><strong>Lidmaatschappen</strong> — per lid de contributie, betaalstatus en of de SEPA-machtiging compleet is.</li>
              <li><strong>Laatste bootverhuur</strong> — recente verhuringen met bedrag en betaald/open.</li>
            </ul>
          </SubSection>

          <SubSection title="Exports">
            <ul className="list-disc list-inside space-y-1.5 text-on-surface-variant">
              <li>
                <strong>SEPA-incasso (XML)</strong> — een kant-en-klaar bestand voor je bank met
                alle leden die een geldige incasso-machtiging + IBAN hebben en nog open contributie.
              </li>
              <li>
                <strong>BTW-overzicht (CSV)</strong> — je verhuur-inkomsten met 21% BTW-opsplitsing,
                klaar voor de boekhouding.
              </li>
            </ul>
          </SubSection>

          <SubSection title="SEPA-crediteur instellen">
            <p className="text-on-surface-variant">
              Stel je eigen gegevens (IBAN, BIC, creditor-ID) in via{' '}
              <Kbd>Financieel → Crediteur instellen</Kbd>. Deze komen in het SEPA-bestand
              en moeten overeenkomen met wat je bank heeft geregistreerd.
            </p>
          </SubSection>

          <Tip>
            SEPA-incasso en banksync verlopen buiten VaarSamen: je downloadt het bestand en
            uploadt het in je bankomgeving. Markeer posten hier handmatig als &quot;betaald&quot;.
          </Tip>
        </Section>
      )}

      {/* Terug-knop */}
      <div className="pt-4 border-t border-white/5">
        <Link
          href={`/school/${schoolId}/dashboard`}
          className="inline-flex items-center gap-2 text-sm font-label text-on-surface-variant
                     hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-base" aria-hidden="true">arrow_back</span>
          Terug naar dashboard
        </Link>
      </div>

    </div>
  )
}

// ─── Hulpcomponenten ──────────────────────────────────────────────────────────

function Section({
  id, icon, title, children,
}: {
  id: string; icon: string; title: string; children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-20 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-primary/12 border border-primary/20 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[20px] text-primary" aria-hidden="true">{icon}</span>
        </div>
        <h2 className="font-headline font-black text-xl text-on-surface">{title}</h2>
      </div>
      <div className="space-y-4 font-body text-[14px] leading-relaxed text-on-surface pl-1">
        {children}
      </div>
    </section>
  )
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="font-label text-[13px] font-bold text-on-surface">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-3.5 rounded-2xl bg-primary/8 border border-primary/15">
      <span className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5" aria-hidden="true">
        lightbulb
      </span>
      <p className="font-body text-[13px] text-on-surface-variant leading-relaxed">{children}</p>
    </div>
  )
}

function Kbd({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg bg-surface-container
                      border border-white/10 font-label text-[12px] font-semibold text-on-surface ${className}`}>
      {children}
    </span>
  )
}

function RolBadge({ role }: { role: SchoolRole }) {
  const styles: Record<SchoolRole, string> = {
    eigenaar:    'bg-amber-500/15 text-amber-300 border-amber-400/20',
    instructeur: 'bg-primary/15 text-primary border-primary/20',
    cursist:     'bg-white/8 text-on-surface-variant border-white/10',
    lid:         'bg-sky-500/15 text-sky-300 border-sky-400/20',
    klusser:     'bg-orange-500/15 text-orange-300 border-orange-400/20',
  }
  const labels: Record<SchoolRole, string> = {
    eigenaar:    'Eigenaar — volledige toegang',
    instructeur: 'Instructeur — lessen & cursisten',
    cursist:     'Cursist — eigen vorderingen',
    lid:         'Lid — boten huren na goedkeuring',
    klusser:     'Klusser — klussenlijst & onderhoud',
  }
  const icons: Record<SchoolRole, string> = {
    eigenaar:    'star',
    instructeur: 'person_check',
    cursist:     'school',
    lid:         'sailing',
    klusser:     'build',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-label text-[11px] font-semibold ${styles[role]}`}>
      <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
        {icons[role]}
      </span>
      {labels[role]}
    </span>
  )
}
