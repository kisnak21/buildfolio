import type { Prisma } from '@/generated/prisma/client'

export const activeUserWhere = (now = new Date()): Prisma.UserWhereInput => ({
  bannedAt: null,
  OR: [{ suspendedUntil: null }, { suspendedUntil: { lte: now } }],
})

export const publicProjectWhere = (
  now = new Date(),
): Prisma.ProjectWhereInput => ({
  hiddenAt: null,
  status: 'PUBLISHED',
  user: { is: activeUserWhere(now) },
})

export const publicCommentWhere = (
  now = new Date(),
): Prisma.CommentWhereInput => ({
  hiddenAt: null,
  user: { is: activeUserWhere(now) },
  project: { is: publicProjectWhere(now) },
})

export const accountStatus = ({
  bannedAt,
  suspendedUntil,
}: {
  bannedAt: Date | null
  suspendedUntil: Date | null
}) => {
  if (bannedAt) return 'banned' as const
  if (suspendedUntil && suspendedUntil > new Date()) return 'suspended' as const
  return 'active' as const
}
