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

// ─── ZEILSCHOOL ───────────────────────────────────────────────────────────────

export const schoolCreateSchema = z.object({
  name:        z.string().min(2, 'Naam moet minimaal 2 tekens zijn').max(100),
  slug:        z.string()
                 .min(2, 'Slug moet minimaal 2 tekens zijn')
                 .max(50)
                 .regex(/^[a-z0-9-]+$/, 'Slug mag alleen kleine letters, cijfers en koppeltekens bevatten'),
  description: z.string().max(500).optional(),
  straat:      z.string().max(100).optional(),
  huisnummer:  z.string().max(20).optional(),
  postcode:    z.string().max(8).optional(),
  city:        z.string().max(100).optional(),
  website:     z.string().url('Voer een geldige URL in').optional().or(z.literal('')),
})

export const schoolUpdateSchema = schoolCreateSchema.partial().omit({ slug: true })

// ─── CURSUS ───────────────────────────────────────────────────────────────────

export const schoolCourseSchema = z.object({
  name:        z.string().min(2, 'Naam moet minimaal 2 tekens zijn').max(150),
  cwoLevel:    z.enum(['geen', 'cwo1', 'cwo2', 'cwo3', 'cwo4', 'cwo_kielboot1', 'cwo_kielboot2', 'cwo_kielboot3']).default('cwo_kielboot2'),
  description: z.string().max(500).optional(),
  startDate:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Gebruik formaat YYYY-MM-DD').optional(),
  endDate:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Gebruik formaat YYYY-MM-DD').optional(),
})

// ─── LES ──────────────────────────────────────────────────────────────────────

export const schoolLesSchema = z.object({
  courseId:     z.string().uuid('Ongeldig cursus ID'),
  datum:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Gebruik formaat YYYY-MM-DD'),
  windRichting: z.string().max(5).optional(),            // "ZW", "NNO" etc.
  windKracht:   z.number().int().min(0).max(12).optional(),
  studentIds:   z.array(z.string().uuid()).min(1, 'Selecteer minimaal 1 cursist'),
})

// ─── BEOORDELINGEN (bulk AMRB) ────────────────────────────────────────────────

export const skillScoreEnum = z.enum(['aangeboden', 'matig', 'redelijk', 'beheerst'])

export const singleAssessmentSchema = z.object({
  skillId: z.string().uuid('Ongeldig vaardigheid ID'),
  score:   skillScoreEnum,
})

export const bulkAssessmentSchema = z.object({
  studentUserId: z.string().uuid('Ongeldig cursist ID'),
  bootId:        z.string().uuid().optional().nullable(),
  soloGevaren:   z.boolean().default(false),
  scores:        z.array(singleAssessmentSchema).min(1, 'Geef minimaal 1 beoordeling op'),
})

// ─── LES OPMERKING ────────────────────────────────────────────────────────────

export const lessonNoteSchema = z.object({
  studentUserId: z.string().uuid('Ongeldig cursist ID'),
  note:          z.string().min(1, 'Opmerking mag niet leeg zijn').max(1000),
})

// ─── LID TOEVOEGEN ────────────────────────────────────────────────────────────

export const schoolMemberSchema = z.object({
  email: z.string().email('Voer een geldig e-mailadres in'),
  role:  z.enum(['instructeur', 'cursist']),
})

// ─── VLOOT BOOT ───────────────────────────────────────────────────────────────

export const vlootBootSchema = z.object({
  bootNummer: z.string().min(1, 'Bootnummer is verplicht').max(20),
  bootType:   z.enum(['valk', 'polyvalk', 'laser', 'laser_pico', 'rs_feva', 'kajuitjacht', 'catamaran', 'anders']).optional(),
  naam:       z.string().max(100).optional(),
})
