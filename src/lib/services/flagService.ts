import prisma from '@/lib/db'
import type { Prisma } from '@/generated/prisma/client'

export const FLAG_REASONS = [
  'spam',
  'inappropriate',
  'broken',
  'copyright',
  'other',
] as const

export type FlagReason = (typeof FLAG_REASONS)[number]
export type FlagTargetType = 'project' | 'comment'
export type FlagStatus = 'pending' | 'resolved' | 'dismissed'

const VALID_STATUSES: FlagStatus[] = ['pending', 'resolved', 'dismissed']

interface CreateFlagInput {
  targetType: FlagTargetType
  targetId: string
  reason: FlagReason
  details?: string
  reporterId?: string
  reporterName?: string
}

export const createFlag = async ({
  targetType,
  targetId,
  reason,
  details,
  reporterId,
  reporterName,
}: CreateFlagInput) => {
  if (targetType !== 'project' && targetType !== 'comment') {
    throw Object.assign(new Error('Invalid target type'), { statusCode: 400 })
  }
  if (!FLAG_REASONS.includes(reason)) {
    throw Object.assign(new Error('Invalid reason'), { statusCode: 400 })
  }
  if (details !== undefined && details.length > 1000) {
    throw Object.assign(new Error('Details must be at most 1000 characters'), {
      statusCode: 400,
    })
  }
  if (details && details.trim().length === 0) details = undefined

  const existing = reporterId
    ? await prisma.contentFlag.findFirst({
        where: {
          reporterId,
          targetType,
          targetId,
          status: 'pending',
        },
      })
    : null
  if (existing) {
    throw Object.assign(new Error('You have already reported this content'), {
      statusCode: 409,
    })
  }

  return prisma.contentFlag.create({
    data: {
      targetType,
      targetId,
      reason,
      details: details?.trim() || null,
      reporterId: reporterId ?? null,
      reporterName: reporterName ?? null,
    },
  })
}

export const listAdminFlags = async ({
  status,
  page = 1,
  limit = 50,
}: {
  status?: FlagStatus
  page?: number
  limit?: number
} = {}) => {
  const where: Prisma.ContentFlagWhereInput = {}
  if (status && VALID_STATUSES.includes(status)) {
    where.status = status
  }

  const [total, rows] = await Promise.all([
    prisma.contentFlag.count({ where }),
    prisma.contentFlag.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ])

  const projectIds = rows
    .filter((f) => f.targetType === 'project')
    .map((f) => f.targetId)
  const commentIds = rows
    .filter((f) => f.targetType === 'comment')
    .map((f) => f.targetId)

  const [projects, comments] = await Promise.all([
    projectIds.length
      ? prisma.project.findMany({
          where: { id: { in: projectIds } },
          select: { id: true, title: true, slug: true },
        })
      : [],
    commentIds.length
      ? prisma.comment.findMany({
          where: { id: { in: commentIds } },
          select: { id: true, content: true },
        })
      : [],
  ])

  const projectMap = new Map(projects.map((p) => [p.id, p]))
  const commentMap = new Map(comments.map((c) => [c.id, c]))

  return {
    data: rows.map((f) => ({
      ...f,
      targetName:
        f.targetType === 'project'
          ? (projectMap.get(f.targetId)?.title ?? null)
          : (commentMap.get(f.targetId)?.content ?? null),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export const updateFlagStatus = async (
  id: string,
  status: 'resolved' | 'dismissed',
  adminId?: string,
) => {
  const flag = await prisma.contentFlag.findUnique({ where: { id } })
  if (!flag) {
    throw Object.assign(new Error('Flag not found'), { statusCode: 404 })
  }
  if (flag.status === status) return flag

  return prisma.contentFlag.update({
    where: { id },
    data: {
      status,
      resolvedAt: new Date(),
      resolvedById: adminId ?? null,
    },
  })
}