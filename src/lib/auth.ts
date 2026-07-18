import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import pool from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

export function signToken(payload: { id: string; email: string; name: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as { id: string; email: string; name: string }
}

async function syncGoogleUser(profile: {
  email?: string | null
  name?: string | null
  image?: string | null
}): Promise<string> {
  const email = profile.email || ''
  const name = profile.name || email.split('@')[0]
  const image = profile.image || null

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email])
  if (existing.rows.length > 0) return existing.rows[0].id

  const id = crypto.randomUUID()
  const username = name.toLowerCase().replace(/\s+/g, '')

  await pool.query(
    `INSERT INTO users (id, name, username, email, image, is_verified)
     VALUES ($1, $2, $3, $4, $5, true)
     ON CONFLICT (email) DO NOTHING`,
    [id, name, username, email, image],
  )

  return id
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60,
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        const localId = await syncGoogleUser({
          email: (profile as any)?.email ?? user.email,
          name: (profile as any)?.name ?? user.name,
          image: (profile as any)?.picture ?? user.image,
        })
        ;(user as any).localId = localId
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        ;(token as any).localId = (user as any).localId || user.id
        token.email = user.email
        token.name = user.name
        token.picture = user.image
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).id = (token as any).localId
        session.user.email = token.email as string
        session.user.name = token.name as string
      }
      ;(session as any).accessToken = signToken({
        id: (token as any).localId as string,
        email: token.email as string,
        name: token.name as string,
      })
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}
