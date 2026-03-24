import NextAuth from 'next-auth'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import Google from 'next-auth/providers/google'
import Resend from 'next-auth/providers/resend'
import Credentials from 'next-auth/providers/credentials'
import { db } from '@/lib/db'
import { users, accounts, sessions, verificationTokens } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const providers = [
  Google({
    clientId:     process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  }),
  Resend({
    apiKey: process.env.RESEND_API_KEY!,
    from:   process.env.EMAIL_FROM ?? 'noreply@vaarsamen.nl',
  }),
]

// Directe email-login alleen in development (geen wachtwoord nodig)
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
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email as string))
          .limit(1)
        return user ? { ...user, isAdmin: user.isAdmin ?? false } : null
      },
    }) as any
  )
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable:              users,
    accountsTable:           accounts,
    sessionsTable:           sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers,
  session: {
    // Credentials vereist JWT strategy (geen DB-sessie)
    strategy: process.env.NODE_ENV !== 'production' ? 'jwt' : 'database',
  },
  callbacks: {
    async session({ session, token, user }) {
      // JWT strategy (dev): haal user ID uit token
      if (token?.sub) {
        session.user.id = token.sub
        // Haal actuele user data op
        const [dbUser] = await db.select().from(users).where(eq(users.id, token.sub)).limit(1)
        if (dbUser) {
          session.user.email   = dbUser.email
          session.user.name    = dbUser.name ?? session.user.name
          session.user.image   = dbUser.image ?? session.user.image
          session.user.isAdmin = dbUser.isAdmin ?? false
        }
      }
      // Database strategy (prod)
      if (user?.id) {
        session.user.id = user.id
        const [dbUser] = await db.select().from(users).where(eq(users.id, user.id)).limit(1)
        if (dbUser) session.user.isAdmin = dbUser.isAdmin ?? false
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) token.sub = user.id
      return token
    },
  },
  pages: {
    signIn: '/login',
  },
})
