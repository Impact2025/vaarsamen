/**
 * Compatibiliteitsscore berekening voor VaarSamen matching.
 *
 * Score-onderdelen (totaal max ~107 punten, gecapped op 100):
 *   Rol-complementariteit    0–25   Schipper + bemanning = ideaal
 *   Vaargebied overlap       0–15   3 punten per gedeeld gebied
 *   Doel-afstemming          0–15   Zelfde "zoekt naar"-intentie
 *   Beschikbaarheid overlap  0–30   ★ killer feature — gedeelde vrije dagen
 *   Rating boost             0–10   Hoge beoordeling = betrouwbaarder profiel
 *   CWO-compatibiliteit      0–12   Niveau-match per rolcombinatie
 */

import type { CWOLevel, LookingFor, MatchReason, SailingRole } from '@/types'
import { CWO_ORDER } from '@/types'

// ─── INPUT TYPES ─────────────────────────────────────────────────────────────

export interface ScoringProfile {
  sailingRole:   SailingRole
  cwoLevel:      CWOLevel
  lookingFor:    LookingFor
  sailingAreas:  string[]
  experience:    number | null
  averageRating: number | null
  reviewCount:   number
}

export interface ScoreResult {
  score:   number        // 0–100
  reasons: MatchReason[] // max 2, geordend op relevantie
}

// ─── ROL-COMPLEMENTARITEIT (max 25) ──────────────────────────────────────────

function scoreRole(mine: SailingRole, theirs: SailingRole): number {
  if (mine === 'schipper' && theirs === 'bemanning') return 25
  if (mine === 'bemanning' && theirs === 'schipper') return 25
  // beide + specifieke rol = goed maar niet perfect (iemand moet de boot besturen)
  if (mine !== theirs) return 15
  // beide + beide = flexibel, zullen er wel uit komen
  if (mine === 'beide') return 10
  // schipper + schipper of bemanning + bemanning — bv. regatta-duo
  return 5
}

// ─── CWO-COMPATIBILITEIT (max 12) ────────────────────────────────────────────

function scoreCWO(
  myRole:    SailingRole,
  myCwo:     CWOLevel,
  theirRole: SailingRole,
  theirCwo:  CWOLevel,
): number {
  const myN    = CWO_ORDER[myCwo]
  const theirN = CWO_ORDER[theirCwo]

  if (myRole === 'schipper' && theirRole === 'bemanning') {
    // Schipper wil bemanning die niet ver onder hem zit (veilig), hogere bemanning is ook prima
    const gap = myN - theirN
    return gap >= 0 && gap <= 3 ? 12 : gap < 0 ? 8 : 4
  }
  if (myRole === 'bemanning' && theirRole === 'schipper') {
    // Bemanning wil schipper met minstens evenveel ervaring
    const gap = theirN - myN
    return gap >= 0 && gap <= 3 ? 12 : gap < 0 ? 6 : 4
  }
  // Vergelijkbare niveaus voor overige rolcombinaties
  const diff = Math.abs(myN - theirN)
  if (diff === 0) return 12
  if (diff === 1) return 10
  if (diff === 2) return 7
  if (diff === 3) return 4
  return 1
}

// ─── DOEL-AFSTEMMING (max 15) ─────────────────────────────────────────────────

const ADJACENT: Partial<Record<LookingFor, LookingFor[]>> = {
  dagje_varen:  ['weekend'],
  weekend:      ['dagje_varen', 'zeilvakantie'],
  zeilvakantie: ['weekend'],
}

function scoreLookingFor(mine: LookingFor, theirs: LookingFor): number {
  if (mine === theirs)                          return 15
  if (mine === 'alles' || theirs === 'alles')   return 10
  if (ADJACENT[mine]?.includes(theirs))         return 7
  return 0
}

// ─── HOOFD-SCORER ─────────────────────────────────────────────────────────────

export function computeMatchScore(
  me:         ScoringProfile,
  them:       ScoringProfile,
  myDates:    Set<string>,   // YYYY-MM-DD — toekomstige beschikbare data van de huidige gebruiker
  theirDates: Set<string>,   // YYYY-MM-DD — toekomstige beschikbare data van de kandidaat
): ScoreResult {
  let total = 0
  const reasons: MatchReason[] = []

  // ── 1. Rol-complementariteit (max 25) ─────────────────────────────────────
  const rs = scoreRole(me.sailingRole, them.sailingRole)
  total += rs
  if (rs === 25) reasons.push('complementaire_rollen')

  // ── 2. Vaargebied overlap (max 15) ────────────────────────────────────────
  const sharedAreas = me.sailingAreas.filter(a => them.sailingAreas.includes(a))
  total += Math.min(sharedAreas.length * 3, 15)
  if (sharedAreas.length > 0) reasons.push('zelfde_vaargebied')

  // ── 3. Doel-afstemming (max 15) ───────────────────────────────────────────
  const lfs = scoreLookingFor(me.lookingFor, them.lookingFor)
  total += lfs
  if (lfs === 15) reasons.push('zelfde_doel')

  // ── 4. Beschikbaarheid overlap (max 30)  ★ KILLER FEATURE ★ ───────────────
  // Alleen als beide partijen beschikbaarheidsdata hebben ingevuld
  if (myDates.size > 0 && theirDates.size > 0) {
    const today  = new Date().toISOString().slice(0, 10)
    const future = [...myDates].filter(d => d >= today && theirDates.has(d))
    if (future.length > 0) {
      // Meer overlap = hogere boost (5+ gedeelde dagen = maximale score)
      total += future.length >= 5 ? 30 : future.length >= 2 ? 20 : 12
      reasons.push('vrij_binnenkort')
    }
  }

  // ── 5. Rating boost (max 10) ───────────────────────────────────────────────
  if (them.averageRating != null && them.reviewCount >= 2) {
    total += them.averageRating >= 4.5 ? 10
           : them.averageRating >= 4.0 ? 7
           : them.averageRating >= 3.5 ? 4
           : 2
    if (them.averageRating >= 4.5 && them.reviewCount >= 3) reasons.push('hoog_beoordeeld')
  }

  // ── 6. CWO-compatibiliteit (max 12) ───────────────────────────────────────
  const cs = scoreCWO(me.sailingRole, me.cwoLevel, them.sailingRole, them.cwoLevel)
  total += cs
  if (cs >= 10) reasons.push('vergelijkbaar_niveau')

  return {
    score:   Math.min(100, Math.round(total)),
    reasons: reasons.slice(0, 2), // max 2 redenen op de kaart
  }
}
