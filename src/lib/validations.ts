import { z } from 'zod'

// ─── SWIPES ───────────────────────────────────────────────────────────────────

export const swipeSchema = z.object({
  swipedId: z.string().uuid('Ongeldig profiel ID'),
  action:   z.enum(['like', 'pass', 'superlike']),
})

// ─── PROFIEL ──────────────────────────────────────────────────────────────────

export const profileCreateSchema = z.object({
  displayName:    z.string().min(2, 'Naam moet minimaal 2 tekens zijn').max(50),
  age:            z.number().int().min(16, 'Minimale leeftijd is 16 jaar').max(99).optional(),
  bio:            z.string().max(300, 'Bio mag maximaal 300 tekens zijn').optional(),
  postcode:       z.string().regex(/^\d{4}\s?[A-Za-z]{2}$/, 'Voer een geldige postcode in (bijv. 1234 AB)').optional(),
  city:           z.string().max(100).optional(),
  province:       z.string().max(100).optional(),
  homePort:       z.string().max(100).optional(),
  lat:            z.number().optional(),
  lng:            z.number().optional(),
  searchRadiusKm: z.number().int().min(10).max(500).optional(),
  cwoLevel:       z.enum(['geen', 'cwo1', 'cwo2', 'cwo3', 'cwo4', 'cwo_kielboot1', 'cwo_kielboot2', 'cwo_kielboot3']).default('geen'),
  sailingRole:    z.enum(['schipper', 'bemanning', 'beide']).default('beide'),
  lookingFor:     z.enum(['dagje_varen', 'weekend', 'regatta', 'zeilvakantie', 'alles']).default('alles'),
  experience:     z.number().int().min(0).max(70).optional(),
  sailingAreas:   z.array(z.string()).max(10).optional(),
  skillTags:      z.array(z.string()).max(12).optional(),
})

export const profileUpdateSchema = profileCreateSchema.partial()

// ─── BOOT ─────────────────────────────────────────────────────────────────────

export const boatSchema = z.object({
  name:      z.string().max(100).optional(),
  type:      z.enum(['valk', 'polyvalk', 'laser', 'laser_pico', 'rs_feva', 'kajuitjacht', 'catamaran', 'anders']),
  brand:     z.string().max(100).optional(),
  length:    z.number().min(0).max(100).optional(),
  homePort:  z.string().max(100).optional(),
})

// ─── BERICHTEN ────────────────────────────────────────────────────────────────

export const messageSchema = z.object({
  content: z.string().min(1, 'Bericht mag niet leeg zijn').max(1000, 'Bericht mag maximaal 1000 tekens zijn'),
})

// ─── REVIEWS ──────────────────────────────────────────────────────────────────

export const reviewSchema = z.object({
  matchId:     z.string().uuid(),
  revieweeId:  z.string().uuid(),
  rating:      z.number().int().min(1).max(5),
  text:        z.string().max(500).optional(),
  sailedDate:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Gebruik formaat YYYY-MM-DD').optional(),
})

// ─── RAPPORTAGES ──────────────────────────────────────────────────────────────

export const reportSchema = z.object({
  reportedId:  z.string().uuid(),
  reason:      z.enum(['ongepast_gedrag', 'nep_profiel', 'spam', 'minderjarig', 'anders']),
  description: z.string().max(500).optional(),
})

// ─── TOCHTEN ──────────────────────────────────────────────────────────────────

export const tochtSchema = z.object({
  titel:          z.string().min(5, 'Titel moet minimaal 5 tekens zijn').max(80),
  beschrijving:   z.string().max(500).optional(),
  datum:          z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Gebruik formaat YYYY-MM-DD'),
  vertrekTijd:    z.string().regex(/^\d{2}:\d{2}$/).optional(),
  vaargebied:     z.enum(['ijsselmeer', 'friesland', 'waddenzee', 'randmeren', 'zeeland', 'amsterdam', 'noord_zee']),
  locatie:        z.string().max(100).optional(),
  bootType:       z.enum(['valk', 'polyvalk', 'laser', 'laser_pico', 'rs_feva', 'kajuitjacht', 'catamaran', 'anders']).optional(),
  cwoMinimum:     z.enum(['geen', 'cwo1', 'cwo2', 'cwo3', 'cwo4', 'cwo_kielboot1', 'cwo_kielboot2', 'cwo_kielboot3']).default('geen'),
  aantalPlaatsen: z.number().int().min(1).max(10).default(1),
})

export const aanmeldingSchema = z.object({
  bericht: z.string().max(300).optional(),
})

// ─── BESCHIKBAARHEID ──────────────────────────────────────────────────────────

export const availabilitySchema = z.object({
  date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isAvailable: z.boolean().default(true),
  note:        z.string().max(200).optional(),
})
