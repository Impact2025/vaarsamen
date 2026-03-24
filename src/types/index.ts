export type CWOLevel =
  | 'geen' | 'cwo1' | 'cwo2' | 'cwo3' | 'cwo4'
  | 'cwo_kielboot1' | 'cwo_kielboot2' | 'cwo_kielboot3'

export type BoatType =
  | 'valk' | 'polyvalk' | 'laser' | 'laser_pico'
  | 'rs_feva' | 'kajuitjacht' | 'catamaran' | 'anders'

export type SailingRole = 'schipper' | 'bemanning' | 'beide'
export type LookingFor  = 'dagje_varen' | 'weekend' | 'regatta' | 'zeilvakantie' | 'alles'
export type SwipeAction = 'like' | 'pass' | 'superlike'

export interface Profile {
  id:              string
  displayName:     string
  age?:            number
  bio?:            string
  photoUrl?:       string
  photoUrls?:      string[]
  city?:           string
  homePort?:       string
  cwoLevel:        CWOLevel
  cwoVerified:     boolean
  sailingRole:     SailingRole
  lookingFor:      LookingFor
  skillTags:       string[]
  sailingAreas:    string[]
  averageRating?:  number
  reviewCount:     number
  boats:           Boat[]
  subscriptionTier: 'free' | 'actief' | 'schipper_pro'
  isFeatured:      boolean
}

export interface Boat {
  id:        string
  name?:     string
  type:      BoatType
  brand?:    string
  homePort?: string
  length?:   number
}

export interface Match {
  id:           string
  profile:      Profile
  lastMessage?: Message
  unreadCount:  number
  matchedAt:    string
  hasSailed:    boolean
}

export interface Message {
  id:        string
  matchId:   string
  senderId:  string
  content:   string
  isRead:    boolean
  deletedAt: string | null
  createdAt: string
}

// ─── LABEL MAPPINGS ───────────────────────────────────────────────────────────

export const CWO_LABELS: Record<CWOLevel, string> = {
  geen:          'Geen diploma',
  cwo1:          'CWO I',
  cwo2:          'CWO II',
  cwo3:          'CWO III',
  cwo4:          'CWO IV',
  cwo_kielboot1: 'Kielboot I',
  cwo_kielboot2: 'Kielboot II',
  cwo_kielboot3: 'Kielboot III',
}

export const BOAT_LABELS: Record<BoatType, string> = {
  valk:        'Valk',
  polyvalk:    'Polyvalk',
  laser:       'Laser',
  laser_pico:  'Laser Pico',
  rs_feva:     'RS Feva',
  kajuitjacht: 'Kajuitjacht',
  catamaran:   'Catamaran',
  anders:      'Anders',
}

export const SAILING_AREAS = [
  { id: 'ijsselmeer', label: 'IJsselmeer' },
  { id: 'friesland',  label: 'Friese Meren' },
  { id: 'waddenzee',  label: 'Waddenzee' },
  { id: 'randmeren',  label: 'Randmeren' },
  { id: 'zeeland',    label: 'Zeeland' },
  { id: 'amsterdam',  label: 'Amsterdam/Loosdrecht' },
  { id: 'noord_zee',  label: 'Noordzee (kust)' },
]

export const SKILL_TAGS = [
  'Regatta', 'Trimmen', 'Navigatie', 'Nachtvaren',
  'Spinnaker', 'Trapeze', 'Toervaren', 'Ankeren',
  'Motorervaring', 'EHBO', 'Seinvlag', 'Marifoon',
]

export const LOOKING_FOR_LABELS: Record<LookingFor, string> = {
  dagje_varen: 'Dagje varen',
  weekend:     'Weekend trip',
  regatta:     'Regatta bemanning',
  zeilvakantie:'Zeilvakantie',
  alles:       'Alles',
}

export const ROLE_LABELS: Record<SailingRole, string> = {
  schipper:  'Schipper',
  bemanning: 'Bemanning',
  beide:     'Schipper & Bemanning',
}

export const ROLE_EMOJI: Record<SailingRole, string> = {
  schipper:  '🚢',
  bemanning: '⛵',
  beide:     '🔄',
}

export const CWO_ORDER: Record<CWOLevel, number> = {
  geen:          0,
  cwo1:          1,
  cwo2:          2,
  cwo3:          3,
  cwo4:          4,
  cwo_kielboot1: 5,
  cwo_kielboot2: 6,
  cwo_kielboot3: 7,
}

export const GEBIED_COLOR: Record<string, string> = {
  ijsselmeer: 'bg-blue-400',
  friesland:  'bg-emerald-400',
  waddenzee:  'bg-amber-400',
  randmeren:  'bg-violet-400',
  zeeland:    'bg-rose-400',
  amsterdam:  'bg-teal-400',
  noord_zee:  'bg-sky-400',
}

export const GEBIED_COLOR_HEX: Record<string, string> = {
  ijsselmeer: '#60a5fa',
  friesland:  '#34d399',
  waddenzee:  '#fbbf24',
  randmeren:  '#a78bfa',
  zeeland:    '#fb7185',
  amsterdam:  '#46f1c5',
  noord_zee:  '#38bdf8',
}
