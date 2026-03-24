import {
  pgTable, uuid, text, integer, boolean, timestamp,
  pgEnum, real, date, jsonb, varchar, uniqueIndex
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
