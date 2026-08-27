import { randomUUID } from 'node:crypto'
import prisma from '@/lib/db'
import type { Prisma } from '@/generated/prisma/client'
import type { RawProject } from '@/lib/shapes'
import { activeUserWhere, publicProjectWhere } from '@/lib/visibility'

export const projectSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  thumbnail: true,
  githubUrl: true,
  liveUrl: true,
  likes: true,
  status: true,
  userId: true,
  categoryId: true,
  featuredAt: true,
  hiddenAt: true,
  hiddenReason: true,
  createdAt: true,
  user: { select: { name: true } },
  category: { select: { name: true } },
  technologies: {
    select: { technology: { select: { name: true } } },
  },
}

type ProjectRow = Prisma.ProjectGetPayload<{ select: typeof projectSelect }>

export const normalizeProject = (p: ProjectRow): RawProject => ({
  id: p.id,
  title: p.title,
  slug: p.slug,
  description: p.description,
  thumbnail: p.thumbnail,
  github_url: p.githubUrl ?? undefined,
  live_url: p.liveUrl ?? undefined,
  category_name: p.category?.name ?? undefined,
  category: p.category?.name ?? undefined,
  technologies: p.technologies?.map((pt) => pt.technology.name) ?? [],
  author_name: p.user?.name ?? undefined,
  likes: p.likes,
  status: p.status,
  user_id: p.userId,
  category_id: p.categoryId,
  featured_at: p.featuredAt?.toISOString() ?? null,
  hidden_at: p.hiddenAt?.toISOString() ?? null,
  hidden_reason: p.hiddenReason,
  created_at: p.createdAt.toISOString(),
  createdAt: p.createdAt.toISOString(),
})

export const getTechnologyStats = async (): Promise<{ name: string; count: number }[]> => {
  const visible = publicProjectWhere()
  const grouped = await prisma.technology.findMany({
    select: {
      name: true,
      _count: {
        select: {
          projectTechnologies: { where: { project: { is: visible } } },
        },
      },
    },
    orderBy: { name: 'asc' },
  })
  return grouped
    .map((technology) => ({
      name: technology.name,
      count: technology._count.projectTechnologies,
    }))
    .filter((technology) => technology.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

export const getAllProjects = async ({
  search,
  category,
  technology,
  sort,
  page = 1,
  limit = 20,
}: {
  search?: string
  category?: string
  technology?: string
  sort?: string
  page?: number
  limit?: number
} = {}) => {
  const where: Prisma.ProjectWhereInput = publicProjectWhere()

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (category) {
    where.category = { name: category }
  }

  if (technology) {
    where.technologies = {
      some: { technology: { name: technology } },
    }
  }

  if (sort === 'home') {
    const [total, pinnedRows, favoriteRows] = await Promise.all([
      prisma.project.count({ where }),
      prisma.project.findMany({
        where: { ...where, featuredAt: { not: null } },
        orderBy: { featuredAt: 'desc' },
        take: 3,
        select: projectSelect,
      }),
      prisma.project.findMany({
        where: { ...where, featuredAt: null },
        orderBy: [{ likes: 'desc' }, { createdAt: 'desc' }],
        take: Math.max(limit, 6),
        select: projectSelect,
      }),
    ])
    return {
      data: [...pinnedRows, ...favoriteRows]
        .slice(0, limit)
        .map(normalizeProject),
      pagination: {
        page: 1,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  const orderBy: Prisma.ProjectOrderByWithRelationInput[] =
    sort === 'featured'
      ? [
          { featuredAt: { sort: 'desc', nulls: 'last' } },
          { likes: 'desc' },
          { createdAt: 'desc' },
        ]
      : sort === 'likes'
        ? [{ likes: 'desc' }]
      : sort === 'oldest'
        ? [{ createdAt: 'asc' }]
        : sort === 'title'
          ? [{ title: 'asc' }]
          : [{ createdAt: 'desc' }]

  const [total, rows] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: projectSelect,
    }),
  ])

  return {
    data: rows.map(normalizeProject),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export const getProjectById = async (id: string) => {
  const project = await prisma.project.findFirst({
    where: { id, ...publicProjectWhere() },
    select: projectSelect,
  })
  return project ? normalizeProject(project) : null
}

export const getProjectByIdUnscoped = async (id: string) => {
  const project = await prisma.project.findUnique({
    where: { id },
    select: projectSelect,
  })
  return project ? normalizeProject(project) : null
}

export const getProjectsByOwner = async (userId: string) => {
  const rows = await prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: projectSelect,
  })
  return rows.map(normalizeProject)
}

export const getProjectsByAuthor = async (author: string) => {
  const rows = await prisma.project.findMany({
    where: {
      ...publicProjectWhere(),
      user: {
        is: {
          ...activeUserWhere(),
          name: { equals: author, mode: 'insensitive' },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    select: projectSelect,
  })
  return rows.map(normalizeProject)
}

export const getLikedProjectsByUser = async (userId: string) => {
  const likes = await prisma.projectLike.findMany({
    where: { userId, project: { is: publicProjectWhere() } },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      createdAt: true,
      project: { select: projectSelect },
    },
  })
  return likes.map((l) => normalizeProject(l.project))
}

const assertSafeUrl = (url: string | undefined, field: string) => {
  if (!url || url === '#') return
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw Object.assign(new Error(`${field} must be a valid http(s) URL`), { statusCode: 400 })
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw Object.assign(new Error(`${field} must be a valid http(s) URL`), { statusCode: 400 })
  }
}

export const createProject = async ({
  title,
  slug,
  description,
  thumbnail,
  github_url,
  live_url,
  user_id,
  category_id,
  category, // Accept category name
  technologies,
}: {
  title: string
  slug: string
  description: string
  thumbnail?: string
  github_url?: string
  live_url?: string
  user_id: string
  category_id?: string
  category?: string
  technologies?: string[]
}) => {
  if (!title || title.length > 255) {
    throw Object.assign(new Error('Title must be 1-255 characters'), { statusCode: 400 })
  }
  if (!slug || slug.length > 255) {
    throw Object.assign(new Error('Slug must be 1-255 characters'), { statusCode: 400 })
  }
  if (!description || description.length > 10000) {
    throw Object.assign(new Error('Description must be 1-10000 characters'), { statusCode: 400 })
  }
  assertSafeUrl(github_url, 'Github URL')
  assertSafeUrl(live_url, 'Live URL')

  const techConnects = technologies?.length
    ? await resolveTechnologies(technologies)
    : []

  // Resolve category name to ID if category_id is not provided
  let finalCategoryId = category_id
  if (!finalCategoryId && category) {
    const cat = await prisma.category.findUnique({ where: { name: category } })
    if (cat) finalCategoryId = cat.id
  }

  const project = await prisma.$transaction(async (tx) =>
    tx.project.create({
      data: {
        title,
        slug,
        description,
        thumbnail: thumbnail ?? null,
        githubUrl: github_url ?? null,
        liveUrl: live_url ?? null,
        userId: user_id,
        categoryId: finalCategoryId ?? null,
        technologies: {
          create: techConnects.map((techId) => ({
            technology: { connect: { id: techId } },
          })),
        },
      },
      select: projectSelect,
    }),
  )

  return normalizeProject(project)
}

export const createDraftProject = async ({
  title,
  description = '',
  thumbnail,
  github_url,
  live_url,
  user_id,
  category,
  technologies,
}: {
  title: string
  description?: string
  thumbnail?: string
  github_url?: string
  live_url?: string
  user_id: string
  category?: string
  technologies?: string[]
}) => {
  const trimmedTitle = title.trim()
  if (!trimmedTitle || trimmedTitle.length > 255) {
    throw Object.assign(new Error('Draft title must be 1-255 characters'), {
      statusCode: 400,
    })
  }
  if (description.length > 10000) {
    throw Object.assign(
      new Error('Description must be at most 10000 characters'),
      { statusCode: 400 },
    )
  }
  assertSafeUrl(github_url, 'Github URL')
  assertSafeUrl(live_url, 'Live URL')
  const technologyIds = technologies?.length
    ? await resolveTechnologies(technologies)
    : []
  const categoryRecord = category
    ? await prisma.category.findUnique({ where: { name: category } })
    : null
  const slugBase =
    trimmedTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 180) || 'draft'

  const project = await prisma.project.create({
    data: {
      title: trimmedTitle,
      slug: `${slugBase}-draft-${randomUUID()}`,
      description,
      thumbnail: thumbnail ?? null,
      githubUrl: github_url ?? null,
      liveUrl: live_url ?? null,
      status: 'DRAFT',
      userId: user_id,
      categoryId: categoryRecord?.id ?? null,
      technologies: {
        create: technologyIds.map((technologyId) => ({
          technology: { connect: { id: technologyId } },
        })),
      },
    },
    select: projectSelect,
  })
  return normalizeProject(project)
}

export const publishDraftProject = async (id: string, userId: string) => {
  const existing = await prisma.project.findFirst({
    where: { id, userId, status: 'DRAFT' },
    select: { title: true, description: true },
  })
  if (!existing) {
    throw Object.assign(new Error('Draft not found'), { statusCode: 404 })
  }
  if (!existing.title.trim() || !existing.description.trim()) {
    throw Object.assign(
      new Error('Title and description are required before publishing'),
      { statusCode: 400 },
    )
  }
  const project = await prisma.project.update({
    where: { id },
    data: { status: 'PUBLISHED' },
    select: projectSelect,
  })
  return normalizeProject(project)
}

export const updateProject = async (
  id: string,
  {
    title,
    slug,
    description,
    thumbnail,
    github_url,
    live_url,
    category_id,
    category, // Accept category name
    technologies,
  }: {
    title?: string
    slug?: string
    description?: string
    thumbnail?: string
    github_url?: string
    live_url?: string
    category_id?: string
    category?: string
    technologies?: string[]
  },
) => {
  if (title !== undefined && title.length > 255) {
    throw Object.assign(new Error('Title must be at most 255 characters'), { statusCode: 400 })
  }
  if (slug !== undefined && slug.length > 255) {
    throw Object.assign(new Error('Slug must be at most 255 characters'), { statusCode: 400 })
  }
  if (description !== undefined && description.length > 10000) {
    throw Object.assign(new Error('Description must be at most 10000 characters'), { statusCode: 400 })
  }
  assertSafeUrl(github_url, 'Github URL')
  assertSafeUrl(live_url, 'Live URL')
  const techUpdate =
    technologies !== undefined
      ? {
          deleteMany: {},
          create: (await resolveTechnologies(technologies)).map((techId) => ({
            technology: { connect: { id: techId } },
          })),
        }
      : undefined

  // Resolve category name to ID if needed
  let finalCategoryId = category_id
  if (!finalCategoryId && category) {
    const cat = await prisma.category.findUnique({ where: { name: category } })
    if (cat) finalCategoryId = cat.id
  }

  const project = await prisma.$transaction(async (tx) =>
    tx.project.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug }),
        ...(description !== undefined && { description }),
        ...(thumbnail !== undefined && { thumbnail }),
        ...(github_url !== undefined && { githubUrl: github_url }),
        ...(live_url !== undefined && { liveUrl: live_url }),
        ...(finalCategoryId !== undefined && { categoryId: finalCategoryId }),
        ...(techUpdate && { technologies: techUpdate }),
      },
      select: projectSelect,
    }),
  )

  return normalizeProject(project)
}

export const deleteProject = async (id: string) => {
  return prisma.project.delete({ where: { id } })
}

export const toggleLikeProject = async (projectId: string, userId: string) => {
  const visibleProject = await prisma.project.findFirst({
    where: { id: projectId, ...publicProjectWhere() },
    select: { id: true },
  })
  if (!visibleProject) {
    throw Object.assign(new Error('Project not found'), { statusCode: 404 })
  }
  return prisma.$transaction(async (tx) => {
    const existing = await tx.projectLike.findUnique({
      where: { userId_projectId: { userId, projectId } },
    })

    if (existing) {
      const project = await tx.project.update({
        where: { id: projectId },
        data: { likes: { decrement: 1 } },
        select: { likes: true },
      })
      await tx.projectLike.delete({ where: { id: existing.id } })
      return { liked: false, likes: project.likes }
    }

    try {
      await tx.projectLike.create({ data: { userId, projectId } })
    } catch (err) {
      if ((err as { code?: string }).code !== 'P2002') throw err
    }
    const project = await tx.project.update({
      where: { id: projectId },
      data: { likes: { increment: 1 } },
      select: { likes: true },
    })
    return { liked: true, likes: project.likes }
  })
}

async function resolveTechnologies(names: string[]): Promise<string[]> {
  const uniqueNames = Array.from(new Set(names.map((n) => n.trim()).filter(Boolean)))
  if (uniqueNames.length === 0) return []
  const upserts = uniqueNames.map((name) =>
    prisma.technology.upsert({
      where: { name },
      update: {},
      create: { name },
      select: { id: true },
    }),
  )
  const results = await prisma.$transaction(upserts)
  return results.map((t) => t.id)
}
