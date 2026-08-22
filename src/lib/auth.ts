import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import prisma from '@/lib/db'
import jwt from 'jsonwebtoken'
import { accountStatus } from '@/lib/visibility'

const JWT_SECRET = process.env.JWT_SECRET!

export const signToken = (payload: {
  id: string
  email: string
  name: string
  role?: string
}) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET) as {
    id: string
    email: string
    name: string
    role?: string
  }
}

const syncGoogleUser = async (email: string, name: string, image?: string | null) => {
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, bannedAt: true, suspendedUntil: true },
  })
  if (existing) {
    if (accountStatus(existing) !== 'active') {
      throw new Error('Account is not active')
    }
    return existing.id
  }

  const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '')
  let username = baseUsername
  let attempt = 0
  while (true) {
    const check = await prisma.user.findUnique({ where: { username }, select: { id: true } })
    if (!check) break
    attempt++
    username = `${baseUsername}${attempt}`
  }

  const user = await prisma.user.create({
    data: {
      username,
      name,
      email,
      password: 'google-oauth',
      image: image ?? null,
      isVerified: true,
    },
    select: { id: true },
  })
  return user.id
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
          ;(user as { localId?: string | null }).localId = localId
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
        token.localId = (user as { localId?: string | null }).localId
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
