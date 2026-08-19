export const runtime = 'nodejs'

import prisma from '@/lib/db'
import type { Prisma } from '@/generated/prisma/client'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

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
    recentSignups,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.project.count(),
    prisma.comment.count(),
    prisma.bookmark.count(),
    prisma.project.aggregate({ _sum: { likes: true } }),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.project.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.comment.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.bookmark.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.project.aggregate({
      where: { createdAt: { gte: weekAgo } },
      _sum: { likes: true },
    }),
    prisma.$queryRaw<
      { day: Date; count: number }[]
    >`SELECT d::date AS day, count(u.id)::int AS count FROM generate_series(current_date - 13, current_date, interval '1 day') AS d LEFT JOIN users u ON u.created_at::date = d::date GROUP BY d::date ORDER BY d::date ASC`,
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
    recentSignups,
  }
}

export const listAdminUsers = async ({
  search,
  page = 1,
  limit = 50,
}: {
  search?: string
  page?: number
  limit?: number
} = {}) => {
  const where: Record<string, unknown> = {}
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { username: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ]
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
  return prisma.user.update({
    where: { id },
    data: {
      ...(data.verified !== undefined && { isVerified: data.verified }),
      ...(data.role !== undefined && { role: data.role }),
    },
    select: { id: true, name: true, isVerified: true, role: true },
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
  page = 1,
  limit = 50,
}: {
  search?: string
  category?: string
  page?: number
  limit?: number
} = {}) => {
  const where: Record<string, unknown> = {}
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { user: { name: { contains: search, mode: 'insensitive' } } },
    ]
  }
  if (category) {
    where.category = { name: category }
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
      createdAt: p.createdAt,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
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
  page = 1,
  limit = 50,
}: {
  search?: string
  page?: number
  limit?: number
} = {}) => {
  const where: Record<string, unknown> = {}
  if (search) {
    where.OR = [
      { content: { contains: search, mode: 'insensitive' } },
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { project: { title: { contains: search, mode: 'insensitive' } } },
    ]
  }

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
      createdAt: c.createdAt,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
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