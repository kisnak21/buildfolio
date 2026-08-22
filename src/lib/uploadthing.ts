import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { verifyToken } from '@/lib/auth'
import prisma from '@/lib/db'
import { accountStatus } from '@/lib/visibility'

const f = createUploadthing()

const parseCookies = (cookieHeader: string | null): Record<string, string> => {
  const cookies: Record<string, string> = {}
  if (!cookieHeader) return cookies
  for (const part of cookieHeader.split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key) cookies[decodeURIComponent(key)] = decodeURIComponent(rest.join('=') || '')
  }
  return cookies
}

export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const cookies = parseCookies(req.headers.get('cookie'))
      const token =
        cookies.buildfolio_token ||
        req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
        ''

      if (!token) {
        throw new Error('Authentication required')
      }

      try {
        const user = verifyToken(token)
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { bannedAt: true, suspendedUntil: true },
        })
        if (!dbUser || accountStatus(dbUser) !== 'active') {
          throw new Error('Account is not active')
        }
        return { userId: user.id }
      } catch {
        throw new Error('Invalid or expired token')
      }
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
