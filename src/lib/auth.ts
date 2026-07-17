import NextAuth, { type NextAuthConfig } from 'next-auth'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import Google from 'next-auth/providers/google'
import Resend from 'next-auth/providers/resend'
import Credentials from 'next-auth/providers/credentials'
import { Resend as ResendClient } from 'resend'
import { db } from '@/lib/db'
import { users, accounts, sessions, verificationTokens, profiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { DEMO_ACCOUNTS, BOET_INSTRUCTEURS } from '@/lib/db/seeds/demo'
import { ZWALUW_ACCOUNTS } from '@/lib/db/seeds/zwaluw'
import { magicLinkEmail, magicLinkText } from '@/emails/templates'

const providers: NextAuthConfig['providers'] = []

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(Google({
    clientId:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  }))
}

if (process.env.RESEND_API_KEY) {
  const resendBase = Resend({
    apiKey:       process.env.RESEND_API_KEY,
    from:         process.env.EMAIL_FROM ?? 'noreply@vaarsamen.nl',
  })
  providers.push({
    ...resendBase,
    async sendVerificationRequest({ identifier: email, url, provider }) {
      const client = new ResendClient(process.env.RESEND_API_KEY!)
      const from   = (provider as { from?: string }).from ?? 'noreply@vaarsamen.nl'
      const { error } = await client.emails.send({
        from, to: email, subject: 'Jouw aanmeldlink voor VaarSamen',
        html: magicLinkEmail({ url }), text: magicLinkText({ url }),
      })
      if (error) throw new Error(`Resend fout: ${error.message}`)
    },
  })
}

// Dev login: direct inloggen op e-mail zonder magic link (nooit in productie)
if (process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEV_LOGIN) {
  providers.push(
    Credentials({
      id:   'dev-login',
      name: 'Dev Login',
      credentials: { email: { label: 'E-mail', type: 'email' } },
      async authorize(credentials) {
        const email = (credentials?.email as string | undefined)?.trim().toLowerCase()
        if (!email) return null
        let [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
        if (!user) {
          ;[user] = await db
            .insert(users)
            .values({ email, emailVerified: new Date() })
            .returning()
        }
        return { id: user.id, email: user.email, name: user.name, image: user.image }
      },
    })
  )
}

// Legacy single demo login: logt in als DEMO_EMAIL (school eigenaar)
if (process.env.NODE_ENV !== 'production' && process.env.DEMO_EMAIL) {
  providers.push(
    Credentials({
      id:   'demo-login',
      name: 'Demo Login',
      credentials: {},
      async authorize() {
        const email = process.env.DEMO_EMAIL!.trim().toLowerCase()
        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
        if (!user) return null
        return { id: user.id, email: user.email, name: user.name, image: user.image }
      },
    })
  )
}

// Multi-demo: meerdere demo accounts (instructeur + cursist)
// Ondersteunt Zeilschool De Zwaluw accounts
if (process.env.NODE_ENV !== 'production' && process.env.ALLOW_DEMO_USERS) {
  providers.push(
    Credentials({
      id:   'demo-user',
      name: 'Demo Gebruiker',
      credentials: { userId: { label: 'User ID', type: 'text' } },
      async authorize(credentials) {
        const userId = credentials?.userId as string | undefined
        const account = (DEMO_ACCOUNTS as readonly { id: string; email: string; name: string }[]).find(a => a.id === userId)
          ?? BOET_INSTRUCTEURS.find(a => a.id === userId)
          ?? ZWALUW_ACCOUNTS.find(a => a.id === userId)
        if (!account) return null
        // Demo users zijn direct onboarded
        return { id: account.id, email: account.email, name: account.name, image: null, isAdmin: false, isOnboarded: true }
      },
    })
  )
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers,
  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
        token.isAdmin = (user as any).isAdmin ?? false
        // Provider kan isOnboarded al afdwingen (demo-accounts zijn direct klaar).
        // Alleen de DB raadplegen als de provider het niet expliciet op true zette.
        const providerOnboarded = (user as any).isOnboarded === true
        if (providerOnboarded) {
          token.isOnboarded = true
        } else {
          const [profile] = await db
            .select({ isOnboarded: profiles.isOnboarded })
            .from(profiles)
            .where(eq(profiles.userId, user.id!))
            .limit(1)
          token.isOnboarded = profile?.isOnboarded ?? false
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token?.sub) {
        session.user.id = token.sub
        session.user.isAdmin = (token.isAdmin as boolean) ?? false
        session.user.isOnboarded = (token.isOnboarded as boolean) ?? false
      }
      return session
    },
  },
  pages: { signIn: '/login', verifyRequest: '/check-email' },
})
