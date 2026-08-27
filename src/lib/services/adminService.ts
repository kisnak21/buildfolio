export const runtime = 'nodejs'

import prisma from '@/lib/db'
import type { Prisma } from '@/generated/prisma/client'
import { accountStatus, activeUserWhere } from '@/lib/visibility'
import { writeAudit, type AuditLogParams } from '@/lib/audit'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

type ModerationAuditContext = Pick<
  AuditLogParams,
  'actor' | 'ip' | 'userAgent'
>

export const getAdminStats = async () => {
  const weekAgo = new Date(Date.now() - WEEK_MS)

  const [
    users,
    projects,
    comments,
    bookmarks,
    likesAgg,
    weekUsers,
    weekProjects,
    weekComments,
    weekBookmarks,
    weekLikesAgg,
    chartRows,
    projectChartRows,
    recentSignups,
    categoryDist,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.project.count({ where: { status: 'PUBLISHED' } }),
    prisma.comment.count({ where: { project: { status: 'PUBLISHED' } } }),
    prisma.bookmark.count({ where: { project: { status: 'PUBLISHED' } } }),
    prisma.project.aggregate({
      where: { status: 'PUBLISHED' },
      _sum: { likes: true },
    }),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.project.count({
      where: { createdAt: { gte: weekAgo }, status: 'PUBLISHED' },
    }),
    prisma.comment.count({
      where: {
        createdAt: { gte: weekAgo },
        project: { status: 'PUBLISHED' },
      },
    }),
    prisma.bookmark.count({
      where: {
        createdAt: { gte: weekAgo },
        project: { status: 'PUBLISHED' },
      },
    }),
    prisma.project.aggregate({
      where: { createdAt: { gte: weekAgo }, status: 'PUBLISHED' },
      _sum: { likes: true },
    }),
    prisma.$queryRaw<
      { day: Date; count: number }[]
    >`SELECT d::date AS day, count(u.id)::int AS count FROM generate_series(current_date - 13, current_date, interval '1 day') AS d LEFT JOIN users u ON u.created_at::date = d::date GROUP BY d::date ORDER BY d::date ASC`,
    prisma.$queryRaw<
      { day: Date; count: number }[]
    >`SELECT d::date AS day, count(p.id)::int AS count FROM generate_series(current_date - 13, current_date, interval '1 day') AS d LEFT JOIN projects p ON p.created_at::date = d::date AND p.status = 'PUBLISHED' GROUP BY d::date ORDER BY d::date ASC`,
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        createdAt: true,
      },
    }),
    prisma.category.findMany({
      select: {
        name: true,
        _count: {
          select: { projects: { where: { status: 'PUBLISHED' } } },
        },
      },
      orderBy: { projects: { _count: 'desc' } },
    }),
  ])

  return {
    stats: {
      users,
      projects,
      comments,
      likes: likesAgg._sum.likes ?? 0,
      bookmarks,
    },
    week: {
      users: weekUsers,
      projects: weekProjects,
      comments: weekComments,
      likes: weekLikesAgg._sum.likes ?? 0,
      bookmarks: weekBookmarks,
    },
    chart: chartRows.map((row) => ({
      date: row.day,
      count: row.count,
    })),
    projectChart: projectChartRows.map((row) => ({
      date: row.day,
      count: row.count,
    })),
    recentSignups,
    categoryDist: categoryDist.map((c) => ({
      name: c.name,
      count: c._count.projects,
    })),
  }
}

export const listAdminUsers = async ({
  search,
  status,
  page = 1,
  limit = 50,
}: {
  search?: string
  status?: 'active' | 'banned' | 'suspended'
  page?: number
  limit?: number
} = {}) => {
  const where: Prisma.UserWhereInput = {}
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { username: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (status === 'active') where.AND = [activeUserWhere()]
  if (status === 'banned') where.bannedAt = { not: null }
  if (status === 'suspended') {
    where.bannedAt = null
    where.suspendedUntil = { gt: new Date() }
  }

  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        isVerified: true,
        role: true,
        bannedAt: true,
        suspendedUntil: true,
        moderationReason: true,
        createdAt: true,
        _count: { select: { projects: true } },
      },
    }),
  ])

  return {
    data: rows.map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      email: u.email,
      image: u.image,
      verified: u.isVerified,
      role: u.role,
      status: accountStatus(u),
      bannedAt: u.bannedAt,
      suspendedUntil: u.suspendedUntil,
      moderationReason: u.moderationReason,
      projects: u._count.projects,
      createdAt: u.createdAt,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

export const updateAdminUser = async (
  id: string,
  data: { verified?: boolean; role?: string },
) => {
  if (data.role !== undefined && !['user', 'admin'].includes(data.role)) {
    throw Object.assign(new Error('Role must be "user" or "admin"'), {
      statusCode: 400,
    })
  }
  const user = await prisma.$transaction(async (tx) => {
    const updateData = {
      ...(data.verified !== undefined && { isVerified: data.verified }),
      ...(data.role !== undefined && { role: data.role }),
    }

    if (data.role === 'admin') {
      const updated = await tx.user.updateMany({
        where: { id, ...activeUserWhere() },
        data: updateData,
      })
      if (updated.count === 0) {
        const exists = await tx.user.findUnique({ where: { id }, select: { id: true } })
        throw Object.assign(
          new Error(
            exists
              ? 'Restore the account before promoting it'
              : 'User not found',
          ),
          { statusCode: exists ? 409 : 404 },
        )
      }
    } else {
      await tx.user.update({ where: { id }, data: updateData })
    }

    return tx.user.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        isVerified: true,
        role: true,
        bannedAt: true,
        suspendedUntil: true,
        moderationReason: true,
        createdAt: true,
        _count: { select: { projects: true } },
      },
    })
  })

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    image: user.image,
    verified: user.isVerified,
    role: user.role,
    status: accountStatus(user),
    bannedAt: user.bannedAt,
    suspendedUntil: user.suspendedUntil,
    moderationReason: user.moderationReason,
    projects: user._count.projects,
    createdAt: user.createdAt,
  }
}

export const moderateAdminUser = async ({
  id,
  action,
  until,
  reason,
  adminId,
  audit,
}: {
  id: string
  action: 'ban' | 'suspend' | 'restore'
  until?: string
  reason?: string
  adminId: string
  audit: ModerationAuditContext
}) => {
  const trimmedReason = reason?.trim() || null
  if (action !== 'restore' && !trimmedReason) {
    throw Object.assign(new Error('A moderation reason is required'), {
      statusCode: 400,
    })
  }
  if (trimmedReason && trimmedReason.length > 500) {
    throw Object.assign(new Error('Reason must be at most 500 characters'), {
      statusCode: 400,
    })
  }

  return prisma.$transaction(async (tx) => {
    const current = await tx.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        role: true,
        bannedAt: true,
        suspendedUntil: true,
      },
    })
    if (!current) {
      throw Object.assign(new Error('User not found'), { statusCode: 404 })
    }
    if (current.role === 'admin') {
      throw Object.assign(new Error('Cannot moderate an admin account'), {
        statusCode: 403,
      })
    }

    let suspendedUntil: Date | null = null
    if (action === 'suspend') {
      suspendedUntil = new Date(until ?? '')
      const max = Date.now() + 366 * 24 * 60 * 60 * 1000
      if (
        Number.isNaN(suspendedUntil.getTime()) ||
        suspendedUntil.getTime() <= Date.now() ||
        suspendedUntil.getTime() > max
      ) {
        throw Object.assign(
          new Error('Suspension must end in the future and within one year'),
          { statusCode: 400 },
        )
      }
    }

    const updated = await tx.user.updateMany({
      where: { id, role: 'user' },
      data:
        action === 'restore'
          ? {
              bannedAt: null,
              suspendedUntil: null,
              moderationReason: null,
              moderatedById: null,
            }
          : {
              bannedAt: action === 'ban' ? new Date() : null,
              suspendedUntil,
              moderationReason: trimmedReason,
              moderatedById: adminId,
            },
    })
    if (updated.count === 0) {
      throw Object.assign(
        new Error('Account role changed. Refresh and try again.'),
        { statusCode: 409 },
      )
    }

    const user = await tx.user.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        isVerified: true,
        role: true,
        createdAt: true,
        bannedAt: true,
        suspendedUntil: true,
        moderationReason: true,
        _count: { select: { projects: true } },
      },
    })

    const previousStatus = accountStatus(current)
    const status = accountStatus(user)
    const auditAction =
      action === 'ban'
        ? 'user.ban'
        : action === 'suspend'
          ? 'user.suspend'
          : previousStatus === 'banned'
            ? 'user.unban'
            : 'user.unsuspend'
    await writeAudit(
      {
        ...audit,
        action: auditAction,
        targetType: 'user',
        targetId: id,
        targetName: user.name,
        metadata: {
          previousStatus,
          status,
          reason: trimmedReason,
          suspendedUntil: user.suspendedUntil?.toISOString() ?? null,
        },
      },
      tx,
    )

    return {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      image: user.image,
      verified: user.isVerified,
      role: user.role,
      projects: user._count.projects,
      createdAt: user.createdAt,
      bannedAt: user.bannedAt,
      suspendedUntil: user.suspendedUntil,
      moderationReason: user.moderationReason,
      status,
      previousStatus,
    }
  })
}

export const deleteAdminUser = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { role: true },
  })
  if (!user) return null
  if (user.role === 'admin') {
    throw Object.assign(new Error('Cannot delete an admin account'), {
      statusCode: 403,
    })
  }
  return prisma.user.delete({ where: { id } })
}

export const listAdminProjects = async ({
  search,
  category,
  status,
  page = 1,
  limit = 50,
}: {
  search?: string
  category?: string
  status?: 'visible' | 'hidden' | 'featured'
  page?: number
  limit?: number
} = {}) => {
  const where: Prisma.ProjectWhereInput = { status: 'PUBLISHED' }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { user: { name: { contains: search, mode: 'insensitive' } } },
    ]
  }
  if (category) {
    where.category = { name: category }
  }
  if (status === 'visible') where.hiddenAt = null
  if (status === 'hidden') where.hiddenAt = { not: null }
  if (status === 'featured') {
    where.hiddenAt = null
    where.featuredAt = { not: null }
  }

  const [total, rows] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        likes: true,
        createdAt: true,
        hiddenAt: true,
        hiddenReason: true,
        featuredAt: true,
        user: { select: { name: true } },
        category: { select: { name: true } },
      },
    }),
  ])

  return {
    data: rows.map((p) => ({
      id: p.id,
      title: p.title,
      author: p.user.name,
      category: p.category?.name ?? 'Uncategorized',
      likes: p.likes,
      hiddenAt: p.hiddenAt,
      hiddenReason: p.hiddenReason,
      featuredAt: p.featuredAt,
      createdAt: p.createdAt,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

export const moderateAdminProject = async ({
  id,
  hidden,
  featured,
  reason,
  adminId,
  audit,
}: {
  id: string
  hidden?: boolean
  featured?: boolean
  reason?: string
  adminId: string
  audit: ModerationAuditContext
}) => {
  if (hidden === undefined && featured === undefined) {
    throw Object.assign(new Error('No moderation change provided'), {
      statusCode: 400,
    })
  }
  if (hidden === true && featured === true) {
    throw Object.assign(
      new Error('A project cannot be hidden and featured at the same time'),
      { statusCode: 400 },
    )
  }
  const trimmedReason = reason?.trim() || null
  if (hidden === true && !trimmedReason) {
    throw Object.assign(new Error('A moderation reason is required'), {
      statusCode: 400,
    })
  }
  if (trimmedReason && trimmedReason.length > 500) {
    throw Object.assign(new Error('Reason must be at most 500 characters'), {
      statusCode: 400,
    })
  }

  const current = await prisma.project.findUnique({
    where: { id },
    select: { id: true, title: true, hiddenAt: true, featuredAt: true },
  })
  if (!current) {
    throw Object.assign(new Error('Project not found'), { statusCode: 404 })
  }
  if (featured === true && current.hiddenAt && hidden !== false) {
    throw Object.assign(new Error('Unhide the project before featuring it'), {
      statusCode: 400,
    })
  }

  const project = await prisma.$transaction(async (tx) => {
    const updated = await tx.project.updateMany({
      where: {
        id,
        ...(featured === true && hidden !== false && { hiddenAt: null }),
      },
      data: {
        ...(hidden !== undefined &&
          (hidden
            ? {
                hiddenAt: new Date(),
                hiddenReason: trimmedReason,
                hiddenById: adminId,
                featuredAt: null,
              }
            : { hiddenAt: null, hiddenReason: null, hiddenById: null })),
        ...(featured !== undefined && {
          featuredAt: featured ? new Date() : null,
        }),
      },
    })
    if (updated.count === 0) {
      throw Object.assign(new Error('Unhide the project before featuring it'), {
        statusCode: 409,
      })
    }
    const project = await tx.project.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        title: true,
        likes: true,
        createdAt: true,
        hiddenAt: true,
        hiddenReason: true,
        featuredAt: true,
        user: { select: { name: true } },
        category: { select: { name: true } },
      },
    })
    if (hidden !== undefined) {
      await writeAudit(
        {
          ...audit,
          action: hidden ? 'project.hide' : 'project.unhide',
          targetType: 'project',
          targetId: id,
          targetName: project.title,
          metadata: { reason: trimmedReason },
        },
        tx,
      )
    }
    if (featured !== undefined) {
      await writeAudit(
        {
          ...audit,
          action: featured ? 'project.feature' : 'project.unfeature',
          targetType: 'project',
          targetId: id,
          targetName: project.title,
        },
        tx,
      )
    }
    return project
  })

  return {
    id: project.id,
    title: project.title,
    author: project.user.name,
    category: project.category?.name ?? 'Uncategorized',
    likes: project.likes,
    createdAt: project.createdAt,
    hiddenAt: project.hiddenAt,
    hiddenReason: project.hiddenReason,
    featuredAt: project.featuredAt,
  }
}

export const deleteAdminProject = async (id: string) => {
  const project = await prisma.project.findUnique({
    where: { id },
    select: { id: true },
  })
  if (!project) return null
  return prisma.project.delete({ where: { id } })
}

export const listAdminComments = async ({
  search,
  status,
  page = 1,
  limit = 50,
}: {
  search?: string
  status?: 'visible' | 'hidden'
  page?: number
  limit?: number
} = {}) => {
  const where: Prisma.CommentWhereInput = {}
  if (search) {
    where.OR = [
      { content: { contains: search, mode: 'insensitive' } },
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { project: { title: { contains: search, mode: 'insensitive' } } },
    ]
  }
  if (status === 'visible') where.hiddenAt = null
  if (status === 'hidden') where.hiddenAt = { not: null }

  const [total, rows] = await Promise.all([
    prisma.comment.count({ where }),
    prisma.comment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        content: true,
        createdAt: true,
        hiddenAt: true,
        hiddenReason: true,
        user: { select: { name: true } },
        project: { select: { title: true } },
      },
    }),
  ])

  return {
    data: rows.map((c) => ({
      id: c.id,
      author: c.user.name,
      project: c.project.title,
      content: c.content,
      hiddenAt: c.hiddenAt,
      hiddenReason: c.hiddenReason,
      createdAt: c.createdAt,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

export const moderateAdminComment = async ({
  id,
  hidden,
  reason,
  adminId,
  audit,
}: {
  id: string
  hidden: boolean
  reason?: string
  adminId: string
  audit: ModerationAuditContext
}) => {
  const trimmedReason = reason?.trim() || null
  if (hidden && !trimmedReason) {
    throw Object.assign(new Error('A moderation reason is required'), {
      statusCode: 400,
    })
  }
  if (trimmedReason && trimmedReason.length > 500) {
    throw Object.assign(new Error('Reason must be at most 500 characters'), {
      statusCode: 400,
    })
  }
  const comment = await prisma.$transaction(async (tx) => {
    const exists = await tx.comment.findUnique({
      where: { id },
      select: { id: true },
    })
    if (!exists) {
      throw Object.assign(new Error('Comment not found'), { statusCode: 404 })
    }
    const updated = await tx.comment.update({
      where: { id },
      data: hidden
        ? {
            hiddenAt: new Date(),
            hiddenReason: trimmedReason,
            hiddenById: adminId,
          }
        : { hiddenAt: null, hiddenReason: null, hiddenById: null },
      select: {
        id: true,
        content: true,
        createdAt: true,
        hiddenAt: true,
        hiddenReason: true,
        user: { select: { name: true } },
        project: { select: { title: true } },
      },
    })
    await writeAudit(
      {
        ...audit,
        action: hidden ? 'comment.hide' : 'comment.unhide',
        targetType: 'comment',
        targetId: id,
        targetName: updated.content.slice(0, 100),
        metadata: { reason: trimmedReason },
      },
      tx,
    )
    return updated
  })

  return {
    id: comment.id,
    author: comment.user.name,
    project: comment.project.title,
    content: comment.content,
    createdAt: comment.createdAt,
    hiddenAt: comment.hiddenAt,
    hiddenReason: comment.hiddenReason,
  }
}

export const deleteAdminComment = async (id: string) => {
  const comment = await prisma.comment.findUnique({
    where: { id },
    select: { id: true },
  })
  if (!comment) return null
  return prisma.comment.delete({ where: { id } })
}

export const listAdminCategories = async () => {
  const rows = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      icon: true,
      _count: { select: { projects: true } },
    },
  })
  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
    projects: c._count.projects,
  }))
}

export const createAdminCategory = async (name: string, icon?: string) => {
  const trimmed = name.trim()
  if (!trimmed) {
    throw Object.assign(new Error('Category name is required'), {
      statusCode: 400,
    })
  }
  if (trimmed.length > 100) {
    throw Object.assign(new Error('Category name must be at most 100 characters'), {
      statusCode: 400,
    })
  }
  return prisma.category.create({
    data: { name: trimmed, icon: icon || null },
    select: { id: true, name: true, icon: true },
  })
}

export const renameAdminCategory = async (
  id: string,
  name: string,
  icon?: string,
) => {
  const trimmed = name.trim()
  if (!trimmed) {
    throw Object.assign(new Error('Category name is required'), {
      statusCode: 400,
    })
  }
  return prisma.category.update({
    where: { id },
    data: {
      name: trimmed,
      ...(icon !== undefined && { icon: icon || null }),
    },
    select: { id: true, name: true, icon: true },
  })
}

export const deleteAdminCategory = async (id: string) => {
  const category = await prisma.category.findUnique({
    where: { id },
    select: { id: true, _count: { select: { projects: true } } },
  })
  if (!category) return null
  if (category._count.projects > 0) {
    throw Object.assign(
      new Error(
        `Category is used by ${category._count.projects} project(s) and cannot be deleted`,
      ),
      { statusCode: 400 },
    )
  }
  return prisma.category.delete({ where: { id } })
}

export const listAdminTechs = async () => {
  const rows = await prisma.technology.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      _count: { select: { projectTechnologies: true } },
    },
  })
  return rows.map((t) => ({
    id: t.id,
    name: t.name,
    used: t._count.projectTechnologies > 0,
  }))
}

export const createAdminTech = async (name: string) => {
  const trimmed = name.trim()
  if (!trimmed) {
    throw Object.assign(new Error('Technology name is required'), {
      statusCode: 400,
    })
  }
  if (trimmed.length > 100) {
    throw Object.assign(
      new Error('Technology name must be at most 100 characters'),
      { statusCode: 400 },
    )
  }
  return prisma.technology.create({
    data: { name: trimmed },
    select: { id: true, name: true },
  })
}

export const deleteAdminTech = async (id: string) => {
  const tech = await prisma.technology.findUnique({
    where: { id },
    select: { id: true, _count: { select: { projectTechnologies: true } } },
  })
  if (!tech) return null
  if (tech._count.projectTechnologies > 0) {
    throw Object.assign(
      new Error(
        `Technology is used by ${tech._count.projectTechnologies} project(s) and cannot be deleted`,
      ),
      { statusCode: 400 },
    )
  }
  return prisma.technology.delete({ where: { id } })
}

export const listAdminAuditLogs = async ({
  page = 1,
  limit = 20,
  action,
  search,
  from,
  to,
}: {
  page?: number
  limit?: number
  action?: string
  search?: string
  from?: string
  to?: string
} = {}) => {
  const where: Prisma.AuditLogWhereInput = {}
  if (action) {
    where.action = action
  }
  if (from || to) {
    where.createdAt = {}
    if (from) {
      const fromDate = new Date(from)
      if (!Number.isNaN(fromDate.getTime())) {
        where.createdAt.gte = fromDate
      }
    }
    if (to) {
      const toDate = new Date(to)
      if (!Number.isNaN(toDate.getTime())) {
        toDate.setUTCHours(23, 59, 59, 999)
        where.createdAt.lte = toDate
      }
    }
  }
  if (search) {
    where.OR = [
      { actorName: { contains: search, mode: 'insensitive' } },
      { actorEmail: { contains: search, mode: 'insensitive' } },
      { targetName: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [total, rows] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ])

  return {
    data: rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}
