import NextAuth, { type NextAuthConfig } from 'next-auth'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import Google from 'next-auth/providers/google'
import Resend from 'next-auth/providers/resend'
import Credentials from 'next-auth/providers/credentials'
import { db } from '@/lib/db'
import { users, accounts, sessions, verificationTokens, profiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { DEMO_ACCOUNTS, BOET_INSTRUCTEURS } from '@/lib/db/seeds/demo'

// Expliciet getypeerd zodat NextAuth het juiste type verwacht — geen as any casts nodig
const providers: NextAuthConfig['providers'] = []

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(Google({
    clientId:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  }))
}

if (process.env.RESEND_API_KEY) {
  providers.push(Resend({
    apiKey: process.env.RESEND_API_KEY,
    from:   process.env.EMAIL_FROM ?? 'noreply@vaarsamen.nl',
  }))
}

// Directe email-login in development (geen wachtwoord nodig)
// NOOIT inschakelen via env var in productie — gebruik NODE_ENV=development op staging
if (process.env.NODE_ENV !== 'production') {
  providers.push(
    Credentials({
      id:   'dev-login',
      name: 'Dev Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null
        const email = credentials.email as string
        let [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
        if (!user) {
          const [created] = await db.insert(users).values({ email, name: email.split('@')[0] }).returning()
          user = created
        }
        if (user) {
          // Dev: maak een dev-profiel aan als dat nog niet bestaat zodat onboarding overgeslagen wordt
          const [existing] = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1)
          if (!existing) {
            await db.insert(profiles).values({
              userId:      user.id,
              displayName: user.name ?? email.split('@')[0],
              cwoLevel:    'cwo3',
              sailingRole: 'beide',
              lookingFor:  'alles',
              sailingAreas: ['ijsselmeer', 'friese_meren'],
              isOnboarded: true,
            })
          }
        }
        return user ? { ...user, isAdmin: user.isAdmin ?? false } : null
      },
    })
  )
}

// Demo-login: werkt in productie wanneer DEMO_EMAIL is ingesteld (legacy, single user)
const demoEmail = process.env.DEMO_EMAIL
if (demoEmail) {
  providers.push(
    Credentials({
      id:   'demo-login',
      name: 'Demo Login',
      credentials: {},
      async authorize() {
        const userId = process.env.DEMO_USER_ID
        if (!userId) return null
        return { id: userId, email: demoEmail, name: 'Demo', image: null }
      },
    })
  )
}

// Multi-demo: meerdere demo accounts (instructeur + cursist)
// Activeer via ALLOW_DEMO_USERS=true in .env.local
if (process.env.ALLOW_DEMO_USERS) {
  providers.push(
    Credentials({
      id:   'demo-user',
      name: 'Demo Gebruiker',
      credentials: {
        userId: { label: 'User ID', type: 'text' },
      },
      async authorize(credentials) {
        const userId = credentials?.userId as string | undefined
        const account = (DEMO_ACCOUNTS as readonly { id: string; email: string; name: string }[]).find(a => a.id === userId)
          ?? BOET_INSTRUCTEURS.find(a => a.id === userId)
        if (!account) return null
        return { id: account.id, email: account.email, name: account.name, image: null }
      },
    })
  )
}


export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: DrizzleAdapter(db, {
    usersTable:              users,
    accountsTable:           accounts,
    sessionsTable:           sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers,
  session: {
    // JWT strategy: vereist voor Credentials provider (dev-login + demo-login)
    strategy: 'jwt',
  },
  callbacks: {
    // Sla isAdmin + isOnboarded op in het JWT token bij login
    // isOnboarded: één DB-query per login, daarna cookie-gedreven in de middleware
    async jwt({ token, user }) {
      if (user) {
        token.sub     = user.id
        token.isAdmin = (user as any).isAdmin ?? false
        const [profile] = await db
          .select({ isOnboarded: profiles.isOnboarded })
          .from(profiles)
          .where(eq(profiles.userId, user.id!))
          .limit(1)
        token.isOnboarded = profile?.isOnboarded ?? false
      }
      return token
    },
    // Lees uitsluitend uit het token — nul DB-queries per request
    async session({ session, token }) {
      if (token?.sub) {
        session.user.id          = token.sub
        session.user.isAdmin     = (token.isAdmin as boolean)     ?? false
        session.user.isOnboarded = (token.isOnboarded as boolean) ?? false
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
})
