import type { FinLidRij } from '@/lib/db/queries/school-financieel'
import { normalizeIban } from '@/lib/db/queries/school-financieel'

// ─── SEPA PAIN.008 (CORE DIRECT DEBIT / incasso) ───────────────
// Genereert een geldige pain.008.001.02 XML voor een batch lidmaatschaps-
// incasso's. De zeilschool is de 'Cdtr' (crediteur), leden zijn de
// 'Dbtr' (debiteur). Machtigings-ID + IBAN per lid komen uit de DB.
//
// Opmerking: dit is een CLIENT-SIDE gegenereerd bestand dat de school
// vervolgens uploadt naar haar bank (of PSP). Geen echte betaling zonder
// een bij de bank geregistreerde crediteur-ID (CID) + creditor IBAN.

export type SepaConfig = {
  // Gegevens van de zeilschool (crediteur)
  creditorNaam:   string
  creditorIban:   string
  creditorBic?:    string          // vaak optioneel binnen SEPA
  // Unieke creditor-id bij de bank (NL: 9-positioneel, bv. 'ZZZ000000000')
  creditorId:      string
  // Incasso-type: 'RCUR' (recurring) of 'FRST' (eerste)
  type?:          'RCUR' | 'FRST'
  // Datum waarop de incasso wordt uitgevoerd (YYYY-MM-DD)
  uitvoerDatum:   string
}

// IBAN → BBAN-opdeling voor <DbtrAcct>/<Id>
function ibanParts(iban: string): { country: string; check: string; bban: string } {
  return {
    country: iban.slice(0, 2),
    check:   iban.slice(2, 4),
    bban:    iban.slice(4),
  }
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function msgId(cfg: SepaConfig): string {
  // Uniek bericht-ID: creditorId + timestamp (MaxLength 35)
  const ts = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)
  return `${cfg.creditorId.replace(/[^A-Z0-9]/g, '').slice(0, 8)}-${ts}`.slice(0, 35)
}

// Genereert pain.008 XML voor de gegeven (gerechtigde) leden.
export function buildSepaIncassoXml(
  cfg: SepaConfig,
  leden: FinLidRij[],
): string {
  const valide = leden.filter(l => {
    const ib = normalizeIban(l.sepaIban)
    return ib && l.sepaMachtigingId && (l.bedrag ?? 0) > 0 && l.incassoGereed
  })

  if (valide.length === 0) {
    throw new Error('Geen leden met geldige SEPA-machtiging + IBAN om te incasseren.')
  }

  const ibanC = normalizeIban(cfg.creditorIban)!
  const mId = msgId(cfg)
  const type = cfg.type ?? 'RCUR'
  const now = new Date().toISOString().slice(0, 10)
  const reqId = `REQ-${now}-${mId.slice(0, 8)}`.slice(0, 35)

  let total = 0
  for (const l of valide) total += l.bedrag ?? 0

  const txns = valide.map((l, i) => {
    const ib = normalizeIban(l.sepaIban)!
    const eind = ibanParts(ib)
    const bedragEur = ((l.bedrag ?? 0) / 100).toFixed(2)
    const naam = escapeXml((l.naam ?? l.email ?? 'Lid').slice(0, 70))
    const mId2 = escapeXml((l.sepaMachtigingId ?? '').slice(0, 35))
    return `    <CdtTrfTxInf>
      <PmtId>
        <InstrId>${reqId}-${i + 1}</InstrId>
        <EndToEndId>${escapeXml((l.userId ?? '').slice(0, 35))}</EndToEndId>
      </PmtId>
      <PmtTpInf>
        <SvcLvl><Cd>SEPA</Cd></SvcLvl>
        <LclInstrm><Cd>CORE</Cd></LclInstrm>
        <SeqTp><Cd>${type}</Cd></SeqTp>
      </PmtTpInf>
      <Amt>
        <InstdAmt Ccy="EUR">${bedragEur}</InstdAmt>
      </Amt>
      <ChrgBr><Cd>SLEV</Cd></ChrgBr>
      <Cdtr>
        <Nm>${escapeXml(cfg.creditorNaam.slice(0, 70))}</Nm>
        <PstlAdr><Ctry>${ibanParts(ibanC).country}</Ctry></PstlAdr>
      </Cdtr>
      <CdtrAcct>
        <Id><IBAN>${ibanC}</IBAN></Id>
      </CdtrAcct>
      <CdtrAgt>
        <FinInstnId><BIC>${escapeXml((cfg.creditorBic ?? 'NOTPROVIDED').slice(0, 11))}</BIC></FinInstnId>
      </CdtrAgt>
      <CdtrSchmeId>
        <Id><PrvtId><Oth><Id>${escapeXml(cfg.creditorId.slice(0, 35))}</Id><SchmeNm><Prtry><Cd>SEPA</Cd></Prtry></SchmeNm></Oth></PrvtId></Id>
      </CdtrSchmeId>
      <DrctDbtTx>
        <MndtRltdInf>
          <MndtId>${mId2}</MndtId>
          <DtOfSgntr>${now}</DtOfSgntr>
        </MndtRltdInf>
        <DbtrAcct>
          <Id><IBAN>${ib}</IBAN></Id>
        </DbtrAcct>
        <Dbtr>
          <Nm>${naam}</Nm>
          <PstlAdr><Ctry>${eind.country}</Ctry></PstlAdr>
        </Dbtr>
        <UltmtDbtr>
          <Nm>${naam}</Nm>
        </UltmtDbtr>
      </DrctDbtTx>
    </CdtTrfTxInf>`
  }).join('\n')

  const totalEur = (total / 100).toFixed(2)

  return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.008.001.02">
  <CstmrDrctDbtInitn>
    <GrpHdr>
      <MsgId>${mId}</MsgId>
      <CreDtTm>${new Date().toISOString()}</CreDtTm>
      <NbOfTxs>${valide.length}</NbOfTxs>
      <CtrlSum>${totalEur}</CtrlSum>
      <InitgPty>
        <Nm>${escapeXml(cfg.creditorNaam.slice(0, 70))}</Nm>
        <Id><PrvtId><Oth><Id>${escapeXml(cfg.creditorId.slice(0, 35))}</Id><SchmeNm><Prtry><Cd>SEPA</Cd></Prtry></SchmeNm></Oth></PrvtId></Id>
      </InitgPty>
    </GrpHdr>
    <PmtInfo>
      <PmtInfId>${reqId}</PmtInfId>
      <PmtMtd>DD</PmtMtd>
      <NbOfTxs>${valide.length}</NbOfTxs>
      <CtrlSum>${totalEur}</CtrlSum>
      <PmtTpInf>
        <SvcLvl><Cd>SEPA</Cd></SvcLvl>
        <LclInstrm><Cd>CORE</Cd></LclInstrm>
        <SeqTp><Cd>${type}</Cd></SeqTp>
        <CtgyPurp><Cd>OTHR</Cd></CtgyPurp>
      </PmtTpInf>
      <ReqdColltnDt>${cfg.uitvoerDatum}</ReqdColltnDt>
      <Cdtr>
        <Nm>${escapeXml(cfg.creditorNaam.slice(0, 70))}</Nm>
      </Cdtr>
      <CdtrAcct>
        <Id><IBAN>${ibanC}</IBAN></Id>
      </CdtrAcct>
      <CdtrAgt>
        <FinInstnId><BIC>${escapeXml((cfg.creditorBic ?? 'NOTPROVIDED').slice(0, 11))}</BIC></FinInstnId>
      </CdtrAgt>
      <CdtrSchmeId>
        <Id><PrvtId><Oth><Id>${escapeXml(cfg.creditorId.slice(0, 35))}</Id><SchmeNm><Prtry><Cd>SEPA</Cd></Prtry></SchmeNm></Oth></PrvtId></Id>
      </CdtrSchmeId>
${txns}
    </PmtInfo>
  </CstmrDrctDbtInitn>
</Document>`
}

// ─── BTW-OVERZICHT (kwartaal/maand) ───────────────────────────────
// Zeilscholen: verhuur aan particulieren is belast met 21% (vrijetijdsbesteding
// valt onder het verlaagde tarief in NL alléén voor specifieke gevallen — hier
// houden we 21% aan als conservatieve default, aanpasbaar per school).
// Output: CSV met kolommen voor de boekhouding.

export const BTW_TARIEV = {
  hoog: 21,   // 21% — verhuur particulier / niet-vrijgesteld
  laag: 9,    // 9%  — bv. educatieve vaart (optioneel)
} as const

export type BtwTarief = keyof typeof BTW_TARIEV

export function buildBtwCsv(
  schoolNaam: string,
  periodeLabel: string,
  rijen: { omschrijving: string; bedragCenten: number; tarief: keyof typeof BTW_TARIEV }[],
): string {
  const header = [
    'School', 'Periode', 'Omschrijving', 'Bedrag_incl_btw', 'BTW_tarief_%', 'BTW_bedrag', 'Bedrag_excl_btw',
  ]
  const lines = rijen.map(r => {
    const tarief = BTW_TARIEV[r.tarief]
    const incl = r.bedragCenten / 100
    const btw = Math.round((incl * tarief) / (100 + tarief))
    const excl = Math.round(incl - btw)
    const f = (n: number) => (n / 100).toFixed(2).replace('.', ',')
    return [
      schoolNaam, periodeLabel, r.omschrijving, f(r.bedragCenten), String(tarief), f(btw * 100), f(excl * 100),
    ].join(';')
  })
  return [header.join(';'), ...lines].join('\n')
}
