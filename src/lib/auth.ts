import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import pool from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export const signToken = (payload: {
  id: string
  email: string
  name: string
}) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET) as {
    id: string
    email: string
    name: string
  }
}

const syncGoogleUser = async (email: string, name: string, image?: string | null) => {
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email])
  if (existing.rows.length > 0) return existing.rows[0].id

  const id = crypto.randomUUID()
  const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '')
  let username = baseUsername
  let attempt = 0
  while (true) {
    const check = await pool.query('SELECT id FROM users WHERE username = $1', [username])
    if (check.rows.length === 0) break
    attempt++
    username = `${baseUsername}${attempt}`
  }

  await pool.query(
    `INSERT INTO users (id, username, name, email, password, image, is_verified)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, username, name, email, 'google-oauth', image || null, true],
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
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  callbacks: {
    async signIn({ user }) {
      try {
        if (user.email) {
          const localId = await syncGoogleUser(
            user.email,
            user.name || user.email,
            user.image || null,
          )
          // stash local DB id on the user object so jwt callback can read it
          ;(user as any).localId = localId
        }
        return true
      } catch (err) {
        console.error('GOOGLE SIGNIN ERROR:', err)
        return false
      }
    },
    async jwt({ token, user, account }) {
      if (account && user) {
        token.email = user.email
        token.name = user.name
        token.picture = user.image
        token.localId = (user as any).localId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.picture as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
}
