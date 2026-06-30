import {
  pgTable, uuid, text, integer, boolean, timestamp,
  pgEnum, real, date, jsonb, varchar, uniqueIndex, index
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'

// ─── ENUMS ────────────────────────────────────────────────────────────────────

export const cwoLevelEnum = pgEnum('cwo_level', [
  'geen', 'cwo1', 'cwo2', 'cwo3', 'cwo4', 'cwo_kielboot1', 'cwo_kielboot2', 'cwo_kielboot3'
])

export const boatTypeEnum = pgEnum('boat_type', [
  'valk', 'polyvalk', 'laser', 'laser_pico', 'rs_feva', 'kajuitjacht', 'catamaran', 'anders'
])

export const sailingRoleEnum = pgEnum('sailing_role', [
  'schipper', 'bemanning', 'beide'
])

export const lookingForEnum = pgEnum('looking_for', [
  'dagje_varen', 'weekend', 'regatta', 'zeilvakantie', 'alles'
])

export const swipeActionEnum = pgEnum('swipe_action', [
  'like', 'pass', 'superlike'
])

export const matchStatusEnum = pgEnum('match_status', [
  'active', 'archived', 'blocked'
])

export const subscriptionTierEnum = pgEnum('subscription_tier', [
  'free', 'actief', 'schipper_pro'
])

export const reportReasonEnum = pgEnum('report_reason', [
  'ongepast_gedrag', 'nep_profiel', 'spam', 'minderjarig', 'anders'
])

// ─── USERS ────────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id:            uuid('id').defaultRandom().primaryKey(),
  email:         text('email').notNull().unique(),
  name:          text('name'),
  image:         text('image'),
  emailVerified: timestamp('email_verified'),
  isAdmin:       boolean('is_admin').default(false),
  createdAt:     timestamp('created_at').defaultNow(),
  updatedAt:     timestamp('updated_at').defaultNow(),
})

// ─── PROFILES ─────────────────────────────────────────────────────────────────

export const profiles = pgTable('profiles', {
  id:              uuid('id').defaultRandom().primaryKey(),
  userId:          uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),

  // Persoonlijk
  displayName:     text('display_name').notNull(),
  age:             integer('age'),
  bio:             text('bio'),
  photoUrl:        text('photo_url'),
  photoUrls:       text('photo_urls').array(),

  // Locatie
  postcode:        varchar('postcode', { length: 7 }),
  city:            text('city'),
  province:        text('province'),
  homePort:        text('home_port'),
  lat:             real('lat'),
  lng:             real('lng'),
  searchRadiusKm:  integer('search_radius_km').default(50),

  // Zeilen
  cwoLevel:        cwoLevelEnum('cwo_level').default('geen'),
  sailingRole:     sailingRoleEnum('sailing_role').default('beide'),
  lookingFor:      lookingForEnum('looking_for').default('alles'),
  experience:      integer('experience_years'),
  sailingAreas:    text('sailing_areas').array(),
  skillTags:       text('skill_tags').array(),

  // CWO verificatie (fase 2: upload certificaat, admin verifieert)
  cwoVerified:     boolean('cwo_verified').default(false),
  cwoDocumentUrl:  text('cwo_document_url'),
  cwoVerifiedAt:   timestamp('cwo_verified_at'),
  cwoVerifiedBy:   uuid('cwo_verified_by').references(() => users.id),

  // Abonnement
  subscriptionTier:  subscriptionTierEnum('subscription_tier').default('free'),
  subscriptionUntil: date('subscription_until'),

  // Status
  isOnboarded:   boolean('is_onboarded').default(false),
  isVisible:     boolean('is_visible').default(true),
  isFeatured:    boolean('is_featured').default(false), // cold-start strategie: featured profielen vullen lege feed aan
  lastActive:    timestamp('last_active').defaultNow(),

  // Stats
  averageRating:  real('average_rating'),
  reviewCount:    integer('review_count').default(0),

  // Soft-delete (GDPR/AVG)
  deletedAt:     timestamp('deleted_at'),
  deletedBy:     uuid('deleted_by'),

  createdAt:     timestamp('created_at').defaultNow(),
  updatedAt:     timestamp('updated_at').defaultNow(),
})

// ─── BOATS ────────────────────────────────────────────────────────────────────

export const boats = pgTable('boats', {
  id:          uuid('id').defaultRandom().primaryKey(),
  profileId:   uuid('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  name:        text('name'),
  type:        boatTypeEnum('type').notNull(),
  brand:       text('brand'),
  length:      real('length'),
  homePort:    text('home_port'),
  isAvailable: boolean('is_available').default(true),
  createdAt:   timestamp('created_at').defaultNow(),
})

// ─── AVAILABILITY ─────────────────────────────────────────────────────────────

export const availability = pgTable('availability', {
  id:          uuid('id').defaultRandom().primaryKey(),
  profileId:   uuid('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  date:        date('date').notNull(),
  isAvailable: boolean('is_available').default(true),
  note:        text('note'),
})

// ─── SWIPES ───────────────────────────────────────────────────────────────────

export const swipes = pgTable('swipes', {
  id:         uuid('id').defaultRandom().primaryKey(),
  swiperId:   uuid('swiper_id').notNull().references(() => profiles.id),
  swipedId:   uuid('swiped_id').notNull().references(() => profiles.id),
  action:     swipeActionEnum('action').notNull(),
  createdAt:  timestamp('created_at').defaultNow(),
})

// ─── SWIPE DAGELIJKSE TELLER ──────────────────────────────────────────────────
// Aparte tabel voor atomaire swipe-limiet tracking (geen race condition)
// Vervangt swipesLeftToday op profiles

export const swipeDailyCounts = pgTable('swipe_daily_counts', {
  id:        uuid('id').defaultRandom().primaryKey(),
  profileId: uuid('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  date:      date('date').notNull(),
  count:     integer('count').notNull().default(0),
}, (t) => ({
  uniq: uniqueIndex('swipe_daily_counts_profile_date_uniq').on(t.profileId, t.date),
}))

// ─── MATCHES ──────────────────────────────────────────────────────────────────

export const matches = pgTable('matches', {
  id:          uuid('id').defaultRandom().primaryKey(),
  profileAId:  uuid('profile_a_id').notNull().references(() => profiles.id),
  profileBId:  uuid('profile_b_id').notNull().references(() => profiles.id),
  status:      matchStatusEnum('status').default('active'),
  hasSailed:   boolean('has_sailed').default(false),
  matchedAt:   timestamp('matched_at').defaultNow(),
  updatedAt:   timestamp('updated_at').defaultNow(),
})

// ─── MESSAGES ─────────────────────────────────────────────────────────────────

export const messages = pgTable('messages', {
  id:        uuid('id').defaultRandom().primaryKey(),
  matchId:   uuid('match_id').notNull().references(() => matches.id, { onDelete: 'cascade' }),
  senderId:  uuid('sender_id').notNull().references(() => profiles.id),
  content:   text('content').notNull(),
  isRead:    boolean('is_read').default(false),
  deletedAt: timestamp('deleted_at'), // soft-delete: "bericht verwijderd"
  createdAt: timestamp('created_at').defaultNow(),
})

// ─── REVIEWS ──────────────────────────────────────────────────────────────────

export const reviews = pgTable('reviews', {
  id:          uuid('id').defaultRandom().primaryKey(),
  matchId:     uuid('match_id').notNull().references(() => matches.id),
  reviewerId:  uuid('reviewer_id').notNull().references(() => profiles.id),
  revieweeId:  uuid('reviewee_id').notNull().references(() => profiles.id),
  rating:      integer('rating').notNull(),
  text:        text('text'),
  sailedDate:  date('sailed_date'),
  createdAt:   timestamp('created_at').defaultNow(),
})

// ─── RAPPORTAGES ──────────────────────────────────────────────────────────────

export const reports = pgTable('reports', {
  id:           uuid('id').defaultRandom().primaryKey(),
  reporterId:   uuid('reporter_id').notNull().references(() => profiles.id),
  reportedId:   uuid('reported_id').notNull().references(() => profiles.id),
  reason:       reportReasonEnum('reason').notNull(),
  description:  text('description'),
  status:       varchar('status', { length: 20 }).default('pending'), // pending | reviewed | resolved
  createdAt:    timestamp('created_at').defaultNow(),
  reviewedAt:   timestamp('reviewed_at'),
  reviewedBy:   uuid('reviewed_by').references(() => users.id),
})

// ─── TOCHTEN (OPROEPEN) ───────────────────────────────────────────────────────
// Een gebruiker plaatst een oproep voor een specifieke tocht op een datum.
// Anderen kunnen reageren (aanmelden). Bij acceptatie ontstaat een match.

export const tochtStatusEnum = pgEnum('tocht_status', [
  'open',       // accepteert aanmeldingen
  'vol',        // genoeg aanmeldingen
  'gevaren',    // tocht heeft plaatsgevonden
  'geannuleerd',
])

export const tochten = pgTable('tochten', {
  id:              uuid('id').defaultRandom().primaryKey(),
  profileId:       uuid('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),

  titel:           text('titel').notNull(),                    // "Zaterdag Kaag, zoek maatje Valk"
  beschrijving:    text('beschrijving'),
  datum:           date('datum').notNull(),
  vertrekTijd:     varchar('vertrek_tijd', { length: 5 }),     // "09:30"
  vaargebied:      text('vaargebied').notNull(),               // 'ijsselmeer' etc.
  locatie:         text('locatie'),                            // "Jachthaven Kaag, MZV De Boet"
  bootType:        boatTypeEnum('boot_type'),
  cwoMinimum:      cwoLevelEnum('cwo_minimum').default('geen'), // minimaal vereist niveau
  aantalPlaatsen:  integer('aantal_plaatsen').default(1),       // hoeveel maatjes gezocht
  status:          tochtStatusEnum('status').default('open'),

  deletedAt:       timestamp('deleted_at'),
  createdAt:       timestamp('created_at').defaultNow(),
  updatedAt:       timestamp('updated_at').defaultNow(),
})

export const tochtAanmeldingen = pgTable('tocht_aanmeldingen', {
  id:          uuid('id').defaultRandom().primaryKey(),
  tochtId:     uuid('tocht_id').notNull().references(() => tochten.id, { onDelete: 'cascade' }),
  profileId:   uuid('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  bericht:     text('bericht'),                                // optioneel introberichtje
  status:      varchar('status', { length: 20 }).default('wacht'), // wacht | geaccepteerd | afgewezen
  createdAt:   timestamp('created_at').defaultNow(),
})

// ─── TOCHT REVIEWS ────────────────────────────────────────────────────────────
// Aparte tabel zodat bestaande match-reviews ongewijzigd blijven

export const tochtReviews = pgTable('tocht_reviews', {
  id:          uuid('id').defaultRandom().primaryKey(),
  tochtId:     uuid('tocht_id').notNull().references(() => tochten.id),
  reviewerId:  uuid('reviewer_id').notNull().references(() => profiles.id),
  revieweeId:  uuid('reviewee_id').notNull().references(() => profiles.id),
  rating:      integer('rating').notNull(),
  text:        text('text'),
  createdAt:   timestamp('created_at').defaultNow(),
}, (t) => ({
  uniq: uniqueIndex('tocht_reviews_uniq').on(t.tochtId, t.reviewerId, t.revieweeId),
}))

// ─── PUSH SUBSCRIPTIONS ───────────────────────────────────────────────────────

export const pushSubscriptions = pgTable('push_subscriptions', {
  id:        uuid('id').defaultRandom().primaryKey(),
  profileId: uuid('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  endpoint:  text('endpoint').notNull().unique(),
  p256dh:    text('p256dh').notNull(),
  auth:      text('auth').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

// ─── CLUBS ────────────────────────────────────────────────────────────────────

export const clubs = pgTable('clubs', {
  id:          uuid('id').defaultRandom().primaryKey(),
  name:        text('name').notNull(),
  city:        text('city'),
  website:     text('website'),
  logoUrl:     text('logo_url'),
  adminUserId: uuid('admin_user_id').references(() => users.id),
  tier:        varchar('tier', { length: 20 }).default('basis'),
  createdAt:   timestamp('created_at').defaultNow(),
})

export const clubMembers = pgTable('club_members', {
  id:        uuid('id').defaultRandom().primaryKey(),
  clubId:    uuid('club_id').notNull().references(() => clubs.id),
  profileId: uuid('profile_id').notNull().references(() => profiles.id),
  joinedAt:  timestamp('joined_at').defaultNow(),
})

// ─── NEXT AUTH TABELLEN ───────────────────────────────────────────────────────

export const accounts = pgTable('accounts', {
  id:                uuid('id').defaultRandom().primaryKey(),
  userId:            uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type:              text('type').notNull(),
  provider:          text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token:     text('refresh_token'),
  access_token:      text('access_token'),
  expires_at:        integer('expires_at'),
  token_type:        text('token_type'),
  scope:             text('scope'),
  id_token:          text('id_token'),
  session_state:     text('session_state'),
})

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').notNull().primaryKey(),
  userId:       uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires:      timestamp('expires').notNull(),
})

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token:      text('token').notNull().unique(),
  expires:    timestamp('expires').notNull(),
})

// ─── RELATIONS ────────────────────────────────────────────────────────────────

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  user:             one(users, { fields: [profiles.userId], references: [users.id] }),
  boats:            many(boats),
  availability:     many(availability),
  sentSwipes:       many(swipes, { relationName: 'swiper' }),
  receivedSwipes:   many(swipes, { relationName: 'swiped' }),
  matchesAsA:       many(matches, { relationName: 'profileA' }),
  matchesAsB:       many(matches, { relationName: 'profileB' }),
  reviewsGiven:     many(reviews, { relationName: 'reviewer' }),
  reviewsReceived:  many(reviews, { relationName: 'reviewee' }),
  clubMemberships:  many(clubMembers),
  swipeDailyCounts: many(swipeDailyCounts),
  reportsGiven:     many(reports, { relationName: 'reporter' }),
  reportsReceived:  many(reports, { relationName: 'reported' }),
}))

// ─── ZEILSCHOOL ENUMS ─────────────────────────────────────────────────────────

export const skillScoreEnum = pgEnum('skill_score', [
  'aangeboden', 'matig', 'redelijk', 'beheerst'
])

export const schoolRoleEnum = pgEnum('school_role', [
  'eigenaar', 'instructeur', 'cursist'
])

// ─── ZEILSCHOLEN ─────────────────────────────────────────────────────────────

export const sailingSchools = pgTable('sailing_schools', {
  id:               uuid('id').defaultRandom().primaryKey(),
  name:             text('name').notNull(),
  slug:             text('slug').notNull().unique(),           // 'de-boet' → /school/de-boet
  description:      text('description'),
  straat:           text('straat'),
  huisnummer:       text('huisnummer'),
  postcode:         varchar('postcode', { length: 8 }),        // "2172 JX"
  city:             text('city'),
  website:          text('website'),
  logoUrl:          text('logo_url'),
  ownerUserId:      uuid('owner_user_id').notNull().references(() => users.id),
  verhuurTarieven:  jsonb('verhuur_tarieven'),                 // VerhuurTarieven | null
  deletedAt:        timestamp('deleted_at'),
  createdAt:        timestamp('created_at').defaultNow(),
  updatedAt:        timestamp('updated_at').defaultNow(),
})

// ─── SCHOOL MEMBERSHIPS ──────────────────────────────────────────────────────
// Koppelt users aan scholen met een rol (eigenaar/instructeur/cursist)

export const schoolMemberships = pgTable('school_memberships', {
  id:        uuid('id').defaultRandom().primaryKey(),
  schoolId:  uuid('school_id').notNull().references(() => sailingSchools.id, { onDelete: 'cascade' }),
  userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role:      schoolRoleEnum('role').notNull(),
  joinedAt:  timestamp('joined_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
}, (t) => ({
  uniq:           uniqueIndex('school_memberships_school_user_uniq').on(t.schoolId, t.userId),
  schoolDeletedIdx: index('school_memberships_school_deleted_idx').on(t.schoolId, t.deletedAt),
}))

// ─── UITNODIGINGEN ───────────────────────────────────────────────────────────
// Herbruikbare uitnodigingslink per school + rol
// token is een korte random string (8 tekens) die in de URL komt

export const schoolInvites = pgTable('school_invites', {
  id:        uuid('id').defaultRandom().primaryKey(),
  schoolId:  uuid('school_id').notNull().references(() => sailingSchools.id, { onDelete: 'cascade' }),
  token:     text('token').notNull(),
  role:      schoolRoleEnum('role').notNull().default('cursist'),
  label:     text('label'),              // optioneel: "Kielboot II 2026"
  maxUses:   integer('max_uses'),        // null = onbeperkt
  usedCount: integer('used_count').default(0).notNull(),
  expiresAt: timestamp('expires_at'),    // null = nooit
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
}, (t) => ({
  tokenUniq: uniqueIndex('school_invites_token_uniq').on(t.token),
}))

// ─── CURSUSSEN ───────────────────────────────────────────────────────────────

export const schoolCourses = pgTable('school_courses', {
  id:          uuid('id').defaultRandom().primaryKey(),
  schoolId:    uuid('school_id').notNull().references(() => sailingSchools.id, { onDelete: 'cascade' }),
  name:        text('name').notNull(),                    // "Kielboot II Praktijk 2026"
  cwoLevel:    cwoLevelEnum('cwo_level').default('cwo_kielboot2'),
  description: text('description'),
  startDate:   date('start_date'),
  endDate:     date('end_date'),
  deletedAt:   timestamp('deleted_at'),
  createdAt:   timestamp('created_at').defaultNow(),
  updatedAt:   timestamp('updated_at').defaultNow(),
})

// ─── VLOOT ───────────────────────────────────────────────────────────────────
// Schoolboten (bootnummer voor in de vorderingenstaat)

export const schoolFleet = pgTable('school_fleet', {
  id:         uuid('id').defaultRandom().primaryKey(),
  schoolId:   uuid('school_id').notNull().references(() => sailingSchools.id, { onDelete: 'cascade' }),
  bootNummer: text('boot_nummer').notNull(),              // "1", "2", "Valk-3"
  bootType:   boatTypeEnum('boot_type'),
  naam:       text('naam'),
  deletedAt:  timestamp('deleted_at'),
  createdAt:  timestamp('created_at').defaultNow(),
})

// ─── LESSEN ──────────────────────────────────────────────────────────────────
// Eén lesdag per cursus (datum + wind + instructeur)

export const schoolLessons = pgTable('school_lessons', {
  id:            uuid('id').defaultRandom().primaryKey(),
  courseId:      uuid('course_id').notNull().references(() => schoolCourses.id, { onDelete: 'cascade' }),
  schoolId:      uuid('school_id').notNull().references(() => sailingSchools.id, { onDelete: 'cascade' }),
  datum:         date('datum').notNull(),
  windRichting:  varchar('wind_richting', { length: 5 }), // "ZW", "NNO"
  windKracht:    integer('wind_kracht'),                  // Beaufort 1-12
  instructeurId: uuid('instructeur_id').references(() => users.id),
  deletedAt:     timestamp('deleted_at'),
  createdAt:     timestamp('created_at').defaultNow(),
  updatedAt:     timestamp('updated_at').defaultNow(),
}, (t) => ({
  courseIdx: index('school_lessons_course_id_idx').on(t.courseId),
  schoolIdx: index('school_lessons_school_id_idx').on(t.schoolId),
}))

// ─── CURSISTEN PER LES ───────────────────────────────────────────────────────
// Welke cursisten waren aanwezig + met welke boot + solo gevaren

export const lessonStudents = pgTable('lesson_students', {
  id:            uuid('id').defaultRandom().primaryKey(),
  lessonId:      uuid('lesson_id').notNull().references(() => schoolLessons.id, { onDelete: 'cascade' }),
  studentUserId: uuid('student_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  bootId:        uuid('boot_id').references(() => schoolFleet.id),
  soloGevaren:   boolean('solo_gevaren').default(false),
  // Miles logboek: array van {datum, miles} voor Zeezeilen III certificaat
  milesLogboek:  jsonb('miles_logboek'),
  createdAt:     timestamp('created_at').defaultNow(),
}, (t) => ({
  uniq:      uniqueIndex('lesson_students_lesson_student_uniq').on(t.lessonId, t.studentUserId),
  lessonIdx: index('lesson_students_lesson_id_idx').on(t.lessonId),
}))

// ─── VAARDIGHEID DEFINITIES ──────────────────────────────────────────────────
// Seeddata: vaardigheden per CWO niveau (bijv. KB2 = 18 vaardigheden)

// Boottype-specifieke vaardigheden (NWD) of generiek per CWO niveau
// NWD: bootType required, cwoLevel = null
// CWO: bootType = null, cwoLevel required
// Unieke constraint per combinatie
export const skillDefinitions = pgTable('skill_definitions', {
  id:        uuid('id').defaultRandom().primaryKey(),
  cwoLevel:  cwoLevelEnum('cwo_level'), // nullable voor NWD boottype-specifiek
  bootType:  boatTypeEnum('boot_type'), // nullable voor klassiek CWO
  code:      varchar('code', { length: 20 }).notNull(),  // 'KB2-01', 'KB2-02' …
  naam:      text('naam').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
}, (t) => ({
  // Unieke code binnen cwoLevel OF binnen bootType
  uniq: uniqueIndex('skill_definitions_code_uniq')
    .on(t.cwoLevel, t.code)
    .where(sql`${t.bootType} IS NULL`),
  uniqBoot: uniqueIndex('skill_definitions_boot_code_uniq')
    .on(t.bootType, t.code)
    .where(sql`${t.cwoLevel} IS NULL`),
}))

// ─── VAARDIGHEID BEOORDELINGEN ───────────────────────────────────────────────
// AMRB score per cursist, per vaardigheid, per les
// Uniek constraint → upsert-safe (instructeur kan score aanpassen)

export const skillAssessments = pgTable('skill_assessments', {
  id:            uuid('id').defaultRandom().primaryKey(),
  lessonId:      uuid('lesson_id').notNull().references(() => schoolLessons.id, { onDelete: 'cascade' }),
  studentUserId: uuid('student_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  skillId:       uuid('skill_id').notNull().references(() => skillDefinitions.id),
  score:         skillScoreEnum('score').notNull(),
  instructeurId: uuid('instructeur_id').notNull().references(() => users.id),
  createdAt:     timestamp('created_at').defaultNow(),
  updatedAt:     timestamp('updated_at').defaultNow(),
}, (t) => ({
  uniq:       uniqueIndex('skill_assessments_lesson_student_skill_uniq').on(t.lessonId, t.studentUserId, t.skillId),
  lessonIdx:  index('skill_assessments_lesson_id_idx').on(t.lessonId),
  studentIdx: index('skill_assessments_student_id_idx').on(t.studentUserId),
}))

// ─── LES OPMERKINGEN ─────────────────────────────────────────────────────────
// Vrije tekst per cursist per les (de "Opmerkingen" kolom)

export const lessonNotes = pgTable('lesson_notes', {
  id:            uuid('id').defaultRandom().primaryKey(),
  lessonId:      uuid('lesson_id').notNull().references(() => schoolLessons.id, { onDelete: 'cascade' }),
  studentUserId: uuid('student_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  note:          text('note').notNull(),
  instructeurId: uuid('instructeur_id').notNull().references(() => users.id),
  createdAt:     timestamp('created_at').defaultNow(),
  updatedAt:     timestamp('updated_at').defaultNow(),
}, (t) => ({
  uniq: uniqueIndex('lesson_notes_lesson_student_uniq').on(t.lessonId, t.studentUserId),
}))

// ─── CERTIFICATEN ───────────────────────────────────────────────────────────
// Digitale certificaat generatie na afronden cursus
// Payload bevat student info, vaardigheden, miles, handtekening op datump
export const certificates = pgTable('certificates', {
  id:         uuid('id').defaultRandom().primaryKey(),
  userId:     uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  schoolId:   uuid('school_id').notNull().references(() => sailingSchools.id, { onDelete: 'cascade' }),
  courseId:   uuid('course_id').notNull().references(() => schoolCourses.id, { onDelete: 'cascade' }),
  type:       varchar('type', { length: 50 }).notNull(), // 'cwo', 'nwd', 'zeezegels'
  level:      varchar('level', { length: 50 }).notNull(), // 'cwo_kielboot2', 'zeezeilen3'
  issuedAt:   timestamp('issued_at').defaultNow(),
  expiresAt:  date('expires_at'), // null = nooit
  blobKey:    text('blob_key').notNull(), // Vercel Blob storage key
  downloadUrl: text('download_url'), // signed URL cache
  payload:    jsonb('payload'), // student, skills, miles, datum, school
}, (t) => ({
  userIdx: index('certificates_user_id_idx').on(t.userId),
  schoolIdx: index('certificates_school_id_idx').on(t.schoolId),
}))

// ─── BOOTVERHUUR ─────────────────────────────────────────────────────────────
// Cursisten kunnen schoolboten aanvragen buiten lessen om
// Eigenaar/instructeur kan goedkeuren of afwijzen

export const rentalStatusEnum = pgEnum('rental_status', [
  'aangevraagd', 'goedgekeurd', 'afgewezen', 'geannuleerd',
])

export const boatRentals = pgTable('boat_rentals', {
  id:         uuid('id').defaultRandom().primaryKey(),
  schoolId:   uuid('school_id').notNull().references(() => sailingSchools.id, { onDelete: 'cascade' }),
  bootId:     uuid('boot_id').notNull().references(() => schoolFleet.id, { onDelete: 'cascade' }),
  userId:     uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  datum:      date('datum').notNull(),
  startTijd:  varchar('start_tijd', { length: 5 }).notNull(),  // "09:00"
  eindTijd:   varchar('eind_tijd',  { length: 5 }).notNull(),  // "17:00"
  opmerking:  text('opmerking'),    // van de aanvrager
  reactie:    text('reactie'),      // van eigenaar/instructeur
  status:     rentalStatusEnum('status').default('aangevraagd').notNull(),
  beoordeeldDoor: uuid('beoordeeld_door').references(() => users.id),
  createdAt:  timestamp('created_at').defaultNow(),
  updatedAt:  timestamp('updated_at').defaultNow(),
  deletedAt:  timestamp('deleted_at'),
}, (t) => ({
  // Geen dubbele aanvraag voor dezelfde boot op dezelfde dag door dezelfde persoon
  uniq: uniqueIndex('boat_rentals_boot_user_datum_uniq').on(t.bootId, t.userId, t.datum),
}))

// ─── BOOTBESCHIKBAARHEID ─────────────────────────────────────────────────────
// Periodes dat een boot niet beschikbaar is voor verhuur (onderhoud, schade, reservering)

export const boatAvailability = pgTable('boat_availability', {
  id:        uuid('id').defaultRandom().primaryKey(),
  bootId:    uuid('boot_id').notNull().references(() => schoolFleet.id, { onDelete: 'cascade' }),
  schoolId:  uuid('school_id').notNull(),
  dateFrom:  varchar('date_from', { length: 10 }).notNull(),  // YYYY-MM-DD
  dateTo:    varchar('date_to',   { length: 10 }).notNull(),  // YYYY-MM-DD
  reden:     text('reden'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
})

// ─── BOOT MELDINGEN ──────────────────────────────────────────────────────────
// Schade/onderhoudsmeldingen — handmatig aangemeld of via post-verhuur rapport

export const boatIssues = pgTable('boat_issues', {
  id:           uuid('id').defaultRandom().primaryKey(),
  schoolId:     uuid('school_id').notNull(),
  bootId:       uuid('boot_id').notNull().references(() => schoolFleet.id),
  rentalId:     uuid('rental_id').references(() => boatRentals.id),
  reportedBy:   uuid('reported_by').references(() => users.id),
  titel:        varchar('titel',       { length: 200 }).notNull(),
  beschrijving: text('beschrijving'),
  // gemeld → in_behandeling → besteld → gerepareerd | gesloten
  status:       varchar('status',      { length: 30 }).notNull().default('gemeld'),
  prioriteit:   varchar('prioriteit',  { length: 20 }).default('normaal'),
              // laag | normaal | hoog | urgent
  internNote:   text('intern_note'),
  updatedBy:    uuid('updated_by').references(() => users.id),
  createdAt:    timestamp('created_at').defaultNow(),
  updatedAt:    timestamp('updated_at').defaultNow(),
  resolvedAt:   timestamp('resolved_at'),
}, (t) => ({
  schoolIdx: index('boat_issues_school_id_idx').on(t.schoolId),
  bootIdx:   index('boat_issues_boot_id_idx').on(t.bootId),
}))

// ─── SCHOOL RESOURCES ───────────────────────────────────────────────────────
// Resources die geboekt kunnen worden: boot, equipment, instructeur

export const resourceTypeEnum = pgEnum('resource_type', ['boot', 'equip', 'instructeur'])

export const schoolResources = pgTable('school_resources', {
  id:         uuid('id').defaultRandom().primaryKey(),
  schoolId:   uuid('school_id').notNull().references(() => sailingSchools.id, { onDelete: 'cascade' }),
  type:       resourceTypeEnum('type').notNull(),
  // Boot reference (for boot/equip), user reference (for instructeur)
  bootId:     uuid('boot_id').references(() => schoolFleet.id, { onDelete: 'set null' }),
  userId:     uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  name:       varchar('name', { length: 100 }).notNull(), // 'Laser 2000', 'Parkeren', 'Danny (instructeur)'
  capacity:   integer('capacity').default(1), // Aantal mensen (instructeur = 1, boot = max pax)
  sortOrder:  integer('sort_order').notNull().default(0),
}, (t) => ({
  schoolIdx:  index('school_resources_school_idx').on(t.schoolId),
  typeIdx:    index('school_resources_type_idx').on(t.type),
}))

// ─── BOOKING LOCKS ───────────────────────────────────────────────────────────────
// Optimistic locking om race conditions te voorkomen (15 min TTL)

export const bookingLocks = pgTable('booking_locks', {
  id:        uuid('id').defaultRandom().primaryKey(),
  resourceId: uuid('resource_id').notNull().references(() => schoolResources.id),
  lessonId:  uuid('lesson_id').references(() => schoolLessons.id),
  lockedAt:  timestamp('locked_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  userId:    uuid('user_id').notNull().references(() => users.id),
}, (t) => ({
  uniqueActive: uniqueIndex('booking_locks_active_uniq')
    .on(t.resourceId, t.lessonId)
    .where(sql`${t.expiresAt} > now()`),
}))

// ─── SCHOOL BERICHTEN ────────────────────────────────────────────────────────
// Berichten/aankondigingen van instructeurs/eigenaren aan het team

export const schoolBerichten = pgTable('school_berichten', {
  id:           uuid('id').defaultRandom().primaryKey(),
  schoolId:     uuid('school_id').notNull().references(() => sailingSchools.id, { onDelete: 'cascade' }),
  senderUserId: uuid('sender_user_id').notNull().references(() => users.id),
  inhoud:       text('inhoud').notNull(),
  courseId:     uuid('course_id').references(() => schoolCourses.id, { onDelete: 'set null' }),
  createdAt:    timestamp('created_at').defaultNow(),
  updatedAt:    timestamp('updated_at').defaultNow(),
}, (t) => ({
  schoolIdx: index('school_berichten_school_id_idx').on(t.schoolId),
}))

// ─── SCHOOL RELATIONS ─────────────────────────────────────────────────────────

export const sailingSchoolsRelations = relations(sailingSchools, ({ one, many }) => ({
  owner:       one(users,         { fields: [sailingSchools.ownerUserId], references: [users.id] }),
  memberships: many(schoolMemberships),
  courses:     many(schoolCourses),
  fleet:       many(schoolFleet),
  lessons:     many(schoolLessons),
}))

export const schoolMembershipsRelations = relations(schoolMemberships, ({ one }) => ({
  school: one(sailingSchools, { fields: [schoolMemberships.schoolId], references: [sailingSchools.id] }),
  user:   one(users,          { fields: [schoolMemberships.userId],   references: [users.id] }),
}))

export const schoolCoursesRelations = relations(schoolCourses, ({ one, many }) => ({
  school:  one(sailingSchools, { fields: [schoolCourses.schoolId], references: [sailingSchools.id] }),
  lessons: many(schoolLessons),
}))

export const schoolFleetRelations = relations(schoolFleet, ({ one, many }) => ({
  school:         one(sailingSchools, { fields: [schoolFleet.schoolId], references: [sailingSchools.id] }),
  lessonStudents: many(lessonStudents),
}))

export const schoolLessonsRelations = relations(schoolLessons, ({ one, many }) => ({
  course:      one(schoolCourses,  { fields: [schoolLessons.courseId],      references: [schoolCourses.id] }),
  school:      one(sailingSchools, { fields: [schoolLessons.schoolId],      references: [sailingSchools.id] }),
  instructeur: one(users,          { fields: [schoolLessons.instructeurId], references: [users.id] }),
  students:    many(lessonStudents),
  assessments: many(skillAssessments),
  notes:       many(lessonNotes),
}))

export const lessonStudentsRelations = relations(lessonStudents, ({ one }) => ({
  lesson:  one(schoolLessons, { fields: [lessonStudents.lessonId],      references: [schoolLessons.id] }),
  student: one(users,         { fields: [lessonStudents.studentUserId], references: [users.id] }),
  boot:    one(schoolFleet,   { fields: [lessonStudents.bootId],        references: [schoolFleet.id] }),
}))

export const skillDefinitionsRelations = relations(skillDefinitions, ({ many }) => ({
  assessments: many(skillAssessments),
}))

export const skillAssessmentsRelations = relations(skillAssessments, ({ one }) => ({
  lesson:      one(schoolLessons,    { fields: [skillAssessments.lessonId],      references: [schoolLessons.id] }),
  skill:       one(skillDefinitions, { fields: [skillAssessments.skillId],       references: [skillDefinitions.id] }),
  student:     one(users,            { fields: [skillAssessments.studentUserId], references: [users.id], relationName: 'assessment_student' }),
  instructeur: one(users,            { fields: [skillAssessments.instructeurId], references: [users.id], relationName: 'assessment_instructeur' }),
}))

// ─── RESOURCE RELATIONS ───────────────────────────────────────────────────────────

export const schoolResourcesRelations = relations(schoolResources, ({ one, many }) => ({
  school:  one(sailingSchools, { fields: [schoolResources.schoolId], references: [sailingSchools.id] }),
  boot:    one(schoolFleet,   { fields: [schoolResources.bootId],   references: [schoolFleet.id] }),
  user:    one(users,         { fields: [schoolResources.userId],   references: [users.id] }),
  locks:   many(bookingLocks),
}))

export const bookingLocksRelations = relations(bookingLocks, ({ one }) => ({
  resource: one(schoolResources, { fields: [bookingLocks.resourceId], references: [schoolResources.id] }),
  lesson:   one(schoolLessons,   { fields: [bookingLocks.lessonId],   references: [schoolLessons.id] }),
  user:     one(users,           { fields: [bookingLocks.userId],     references: [users.id] }),
}))

export const lessonNotesRelations = relations(lessonNotes, ({ one }) => ({
  lesson:      one(schoolLessons, { fields: [lessonNotes.lessonId],      references: [schoolLessons.id] }),
  student:     one(users,         { fields: [lessonNotes.studentUserId], references: [users.id], relationName: 'note_student' }),
  instructeur: one(users,         { fields: [lessonNotes.instructeurId], references: [users.id], relationName: 'note_instructeur' }),
}))
