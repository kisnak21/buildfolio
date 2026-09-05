import { randomUUID } from 'node:crypto'
import prisma from '@/lib/db'
import type { Prisma } from '@/generated/prisma/client'
import type { ProjectStatus, RawProject } from '@/lib/shapes'
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
  user: { select: { name: true, username: true } },
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
  author_username: p.user?.username ?? undefined,
  likes: p.likes,
  user_id: p.userId,
  category_id: p.categoryId,
  featured_at: p.featuredAt?.toISOString() ?? null,
  hidden_at: p.hiddenAt?.toISOString() ?? null,
  hidden_reason: p.hiddenReason,
  status: p.status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED',
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

export const getCategoryStats = async (): Promise<
  { id: string; name: string; icon: string | null; count: number }[]
> => {
  const visible = publicProjectWhere()
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      icon: true,
      _count: {
        select: { projects: { where: visible } },
      },
    },
    orderBy: { name: 'asc' },
  })

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    icon: category.icon,
    count: category._count.projects,
  }))
}

export const getAllProjects = async ({
  search,
  category,
  technology,
  author,
  sort,
  page = 1,
  limit = 20,
}: {
  search?: string
  category?: string
  technology?: string
  author?: string
  sort?: string
  page?: number
  limit?: number
} = {}) => {
  const safePage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1
  const safeLimit = Number.isFinite(limit)
    ? Math.min(Math.max(1, Math.floor(limit)), 100)
    : 20
  const where: Prisma.ProjectWhereInput = publicProjectWhere()

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      {
        user: {
          is: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { username: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      },
    ]
  }

  if (category) {
    where.category = { name: category }
  }

  if (technology) {
    where.technologies = {
      some: {
        technology: { name: { equals: technology, mode: 'insensitive' } },
      },
    }
  }

  if (author) {
    where.AND = [
      {
        user: {
          is: {
            OR: [
              { name: { equals: author, mode: 'insensitive' } },
              { username: { equals: author, mode: 'insensitive' } },
            ],
          },
        },
      },
    ]
  }

  if (sort === 'home') {
    const [total, pinnedRows, favoriteRows] = await Promise.all([
      prisma.project.count({ where }),
      prisma.project.findMany({
        where: { ...where, featuredAt: { not: null } },
        orderBy: [{ featuredAt: 'desc' }, { id: 'asc' }],
        take: 3,
        select: projectSelect,
      }),
      prisma.project.findMany({
        where: { ...where, featuredAt: null },
        orderBy: [{ likes: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }],
        take: Math.max(safeLimit, 6),
        select: projectSelect,
      }),
    ])
    return {
      data: [...pinnedRows, ...favoriteRows]
        .slice(0, safeLimit)
        .map(normalizeProject),
      pagination: {
        page: 1,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    }
  }

  const orderBy: Prisma.ProjectOrderByWithRelationInput[] =
    sort === 'featured'
      ? [
          { featuredAt: { sort: 'desc', nulls: 'last' } },
          { likes: 'desc' },
          { createdAt: 'desc' },
          { id: 'asc' },
        ]
      : sort === 'likes'
        ? [{ likes: 'desc' }, { id: 'asc' }]
      : sort === 'oldest'
        ? [{ createdAt: 'asc' }, { id: 'asc' }]
        : sort === 'title'
          ? [{ title: 'asc' }, { id: 'asc' }]
          : [{ createdAt: 'desc' }, { id: 'asc' }]

  const [total, rows] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      orderBy,
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
      select: projectSelect,
    }),
  ])

  return {
    data: rows.map(normalizeProject),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
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

export const getProjectsByAuthor = async (username: string) => {
  const rows = await prisma.project.findMany({
    where: {
      ...publicProjectWhere(),
      user: {
        is: {
          ...activeUserWhere(),
          username: { equals: username, mode: 'insensitive' },
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

const assertSafeUrl = (url: unknown, field: string) => {
  if (url === undefined || url === null || url === '#') return
  if (typeof url !== 'string') {
    throw Object.assign(new Error(`${field} must be a valid http(s) URL`), { statusCode: 400 })
  }
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

const normalizeOptionalUrl = (value: unknown, field: string): string | null | undefined => {
  if (value === undefined) return undefined
  if (value === null || value === '' || value === '#') return null
  if (typeof value !== 'string') {
    throw Object.assign(new Error(`${field} must be a valid http(s) URL`), { statusCode: 400 })
  }
  assertSafeUrl(value, field)
  return value.trim()
}

const THUMBNAIL_HOSTS = new Set([
  'api.dicebear.com',
  'images.unsplash.com',
  'utfs.io',
])

const normalizeThumbnail = (value: unknown): string | null | undefined => {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  if (typeof value !== 'string' || value.length > 2048) {
    throw Object.assign(new Error('Thumbnail must be a valid image URL'), { statusCode: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    throw Object.assign(new Error('Thumbnail must be a valid image URL'), { statusCode: 400 })
  }
  if (
    parsed.protocol !== 'https:' ||
    parsed.username ||
    parsed.password ||
    !THUMBNAIL_HOSTS.has(parsed.hostname)
  ) {
    throw Object.assign(new Error('Thumbnail host is not allowed'), { statusCode: 400 })
  }
  return parsed.toString()
}

const normalizeTechnologyNames = (technologies: unknown): string[] => {
  if (technologies === undefined || technologies === null) return []
  if (!Array.isArray(technologies) || technologies.some((technology) => typeof technology !== 'string')) {
    throw Object.assign(new Error('Technologies must be a list of strings'), { statusCode: 400 })
  }

  const names = Array.from(new Set(technologies.map((technology) => technology.trim()).filter(Boolean)))
  if (names.length > 20) {
    throw Object.assign(new Error('A project can have at most 20 technologies'), { statusCode: 400 })
  }
  if (names.some((name) => name.length > 100)) {
    throw Object.assign(new Error('Technology names must be at most 100 characters'), { statusCode: 400 })
  }
  return names
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
  status,
}: {
  title: string
  slug: string
  description: string
  thumbnail?: string | null
  github_url?: string | null
  live_url?: string | null
  user_id: string
  category_id?: string
  category?: string
  technologies?: string[]
  status?: ProjectStatus
}) => {
  const normalizedTitle = typeof title === 'string' ? title.trim() : ''
  const normalizedSlug = typeof slug === 'string' ? slug.trim() : ''
  const normalizedDescription = typeof description === 'string' ? description.trim() : ''
  const normalizedThumbnail = normalizeThumbnail(thumbnail)
  const normalizedGithubUrl = normalizeOptionalUrl(github_url, 'Github URL')
  const normalizedLiveUrl = normalizeOptionalUrl(live_url, 'Live URL')

  if (!normalizedTitle || normalizedTitle.length > 255) {
    throw Object.assign(new Error('Title must be 1-255 characters'), { statusCode: 400 })
  }
  if (!normalizedSlug || normalizedSlug.length > 255) {
    throw Object.assign(new Error('Slug must be 1-255 characters'), { statusCode: 400 })
  }
  if (!normalizedDescription || normalizedDescription.length > 10000) {
    throw Object.assign(new Error('Description must be 1-10000 characters'), { statusCode: 400 })
  }
  const techNames = normalizeTechnologyNames(technologies)
  const techConnects = techNames.length
    ? await resolveTechnologies(techNames)
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
        title: normalizedTitle,
        slug: normalizedSlug,
        description: normalizedDescription,
        thumbnail: normalizedThumbnail ?? null,
        githubUrl: normalizedGithubUrl ?? null,
        liveUrl: normalizedLiveUrl ?? null,
        userId: user_id,
        categoryId: finalCategoryId ?? null,
        status: status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED',
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
  const normalizedDescription = description.trim()
  const normalizedThumbnail = normalizeThumbnail(thumbnail)
  const normalizedGithubUrl = normalizeOptionalUrl(github_url, 'Github URL')
  const normalizedLiveUrl = normalizeOptionalUrl(live_url, 'Live URL')
  if (!trimmedTitle || trimmedTitle.length > 255) {
    throw Object.assign(new Error('Draft title must be 1-255 characters'), {
      statusCode: 400,
    })
  }
  if (normalizedDescription.length > 10000) {
    throw Object.assign(
      new Error('Description must be at most 10000 characters'),
      { statusCode: 400 },
    )
  }
  const technologyNames = normalizeTechnologyNames(technologies)
  const technologyIds = technologyNames.length
    ? await resolveTechnologies(technologyNames)
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
      description: normalizedDescription,
      thumbnail: normalizedThumbnail ?? null,
      githubUrl: normalizedGithubUrl ?? null,
      liveUrl: normalizedLiveUrl ?? null,
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
    select: {
      title: true,
      description: true,
      thumbnail: true,
      githubUrl: true,
      liveUrl: true,
    },
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
  normalizeOptionalUrl(existing.githubUrl ?? undefined, 'Github URL')
  normalizeOptionalUrl(existing.liveUrl ?? undefined, 'Live URL')
  normalizeThumbnail(existing.thumbnail ?? undefined)
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
    thumbnail?: string | null
    github_url?: string | null
    live_url?: string | null
    category_id?: string
    category?: string
    technologies?: string[]
  },
) => {
  if (title !== undefined && (typeof title !== 'string' || title.length > 255)) {
    throw Object.assign(new Error('Title must be at most 255 characters'), { statusCode: 400 })
  }
  if (slug !== undefined && (typeof slug !== 'string' || slug.length > 255)) {
    throw Object.assign(new Error('Slug must be at most 255 characters'), { statusCode: 400 })
  }
  if (description !== undefined && (typeof description !== 'string' || description.length > 10000)) {
    throw Object.assign(new Error('Description must be at most 10000 characters'), { statusCode: 400 })
  }
  const existing = await prisma.project.findUnique({
    where: { id },
    select: { title: true, slug: true, description: true, status: true },
  })
  if (!existing) {
    throw Object.assign(new Error('Project not found'), { statusCode: 404 })
  }

  const normalizedTitle = title === undefined ? undefined : title.trim()
  const normalizedSlug = slug === undefined ? undefined : slug.trim()
  const normalizedDescription = description === undefined ? undefined : description.trim()
  const nextTitle = normalizedTitle ?? existing.title.trim()
  const nextSlug = normalizedSlug ?? existing.slug.trim()
  const nextDescription = normalizedDescription ?? existing.description.trim()
  if (!nextTitle || !nextSlug || (existing.status === 'PUBLISHED' && !nextDescription)) {
    throw Object.assign(
      new Error(
        existing.status === 'DRAFT'
          ? 'Title and slug are required'
          : 'Title, slug, and description are required',
      ),
      { statusCode: 400 },
    )
  }
  const normalizedGithubUrl = normalizeOptionalUrl(github_url, 'Github URL')
  const normalizedLiveUrl = normalizeOptionalUrl(live_url, 'Live URL')
  const normalizedThumbnail = normalizeThumbnail(thumbnail)
  const techNames = technologies !== undefined ? normalizeTechnologyNames(technologies) : undefined
  const techUpdate = techNames
    ? {
        deleteMany: {},
        create: (await resolveTechnologies(techNames)).map((techId) => ({
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
        ...(normalizedTitle !== undefined && { title: normalizedTitle }),
        ...(normalizedSlug !== undefined && { slug: normalizedSlug }),
        ...(normalizedDescription !== undefined && { description: normalizedDescription }),
        ...(normalizedThumbnail !== undefined && { thumbnail: normalizedThumbnail }),
        ...(normalizedGithubUrl !== undefined && { githubUrl: normalizedGithubUrl }),
        ...(normalizedLiveUrl !== undefined && { liveUrl: normalizedLiveUrl }),
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
    // Serialize toggles for this project before reading the relation. This
    // keeps the denormalized counter in sync when two requests arrive together.
    await tx.$queryRaw`SELECT "id" FROM "projects" WHERE "id" = CAST(${projectId} AS uuid) FOR UPDATE`

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

    await tx.projectLike.create({ data: { userId, projectId } })
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
