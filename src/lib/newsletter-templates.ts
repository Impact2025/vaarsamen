// Kant-en-klare nieuwsbrief-templates voor zeilscholen.
// Elk template levert { titel, subject, inhoud } op.
// {{merge-tags}} worden bij verzenden vervangen (zie send-route / email-template).

export type NlTemplate = {
  id: string
  naam: string
  beschrijving: string
  icon: string
  titel: string
  subject: string
  inhoud: string
}

export const NL_TEMPLATES: NlTemplate[] = [
  {
    id: 'welkom',
    naam: 'Welkomst-mail',
    beschrijving: 'Voor nieuwe abonnees die zich inschreven.',
    icon: 'waving_hand',
    titel: 'Welkom bij de vloot',
    subject: 'Welkom bij {{school_naam}} ⛵',
    inhoud: `<h2>Beste {{naam}},</h2>
<p>Welkom bij <strong>{{school_naam}}</strong>! Fijn dat je je hebt aangemeld voor onze nieuwsbrief. Hier deel we periodiek tips, agenda en verhalen van het water.</p>
<h3>Wat je kunt verwachten</h3>
<ul>
  <li>Uitnodigingen voor clinics en evenementen</li>
  <li>Verhuur-aanbiedingen voor onze boten</li>
  <li>Verhalen en vaardigheden van onze leden</li>
</ul>
<p>Tot snel op het water!</p>
<p><em>Het team van {{school_naam}}</em></p>`,
  },
  {
    id: 'maandelijks',
    naam: 'Maandelijkse update',
    beschrijving: 'Standaard rondje: wat is er gebeurd, wat komt er aan.',
    icon: 'calendar_month',
    titel: 'Maandoverzicht {{maand}}',
    subject: 'De {{maand}}-update van {{school_naam}}',
    inhoud: `<h2>De {{maand}}-update</h2>
<p>Hallo {{naam}}, hier is wat er bij <strong>{{school_naam}}</strong> speelt:</p>
<h3>⌖ Afgelopen maand</h3>
<p>Schrijf hier kort wat er gebeurd is — een succesvolle tocht, een nieuwe boot, een mijlpaal van een lid.</p>
<h3>⚓ Komende weken</h3>
<ul>
  <li>Datum — activiteit (beschrijf kort)</li>
  <li>Datum — activiteit (beschrijf kort)</li>
</ul>
<p><a href="{{web_url}}">Bekijk alles in je dashboard</a></p>`,
  },
  {
    id: 'activiteit',
    naam: 'Activiteit aankondiging',
    beschrijving: 'Een uitnodiging voor een clinic, tocht of feest.',
    icon: 'sailing',
    titel: 'Aanstaande activiteit',
    subject: '⛵ Schrijf je in: {{activiteit_naam}}',
    inhoud: `<h2>{{activiteit_naam}}</h2>
<p>Beste {{naam}}, we organiseren iets leuks bij {{school_naam}} en jij bent van harte welkom.</p>
<p><strong>Wanneer:</strong> [datum/tijd]<br/>
<strong>Waar:</strong> [steiger/avia]<br/>
<strong>Voor wie:</strong> [niveau/voorwaarde]</p>
<p><a href="{{web_url}}">Geef hier je op</a> — vol = vol.</p>`,
  },
  {
    id: 'seizoen',
    naam: 'Seizoens-afsluiting',
    beschrijving: 'Bedankje aan het eind van het seizoen.',
    icon: 'celebration',
    titel: 'Tot het volgende seizoen',
    subject: 'Bedankt voor een mooi {{seizoen}} ⛵',
    inhoud: `<h2>Beste {{naam}},</h2>
<p>Met het eind van het {{seizoen}} kijken we terug op een prachtig seizoen bij <strong>{{school_naam}}</strong>. Bedankt dat je erbij was — op het water en daarbuiten.</p>
<p>De boten gaan de winter in, maar de planning voor volgend jaar ligt al klaar. Houd je inbox in de gaten.</p>
<p><em>Vaar veilig,</em><br/>
<em>Het team van {{school_naam}}</em></p>`,
  },
]

export const NL_MERGE_TAGS: { tag: string; label: string }[] = [
  { tag: '{{naam}}', label: 'Naam abonnee' },
  { tag: '{{school_naam}}', label: 'Naam school' },
  { tag: '{{maand}}', label: 'Huidige maand' },
  { tag: '{{seizoen}}', label: 'Seizoen' },
  { tag: '{{activiteit_naam}}', label: 'Naam activiteit' },
  { tag: '{{web_url}}', label: 'Link naar dashboard' },
  { tag: '{{uitschrijf_url}}', label: 'Uitschrijf-link' },
]
