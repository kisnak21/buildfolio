import prisma from '@/lib/db'

const projectSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  thumbnail: true,
  githubUrl: true,
  liveUrl: true,
  likes: true,
  userId: true,
  categoryId: true,
  createdAt: true,
  user: { select: { name: true } },
  category: { select: { name: true } },
  technologies: {
    select: { technology: { select: { name: true } } },
  },
}

const normalizeProject = (p: any) => ({
  ...p,
  github_url: p.githubUrl,
  live_url: p.liveUrl,
  user_id: p.userId,
  category_id: p.categoryId,
  created_at: p.createdAt,
  author_name: p.user?.name ?? null,
  category_name: p.category?.name ?? null,
  category: p.category?.name ?? null, // client expects category to be the category name
  technologies: p.technologies?.map((pt: any) => pt.technology.name) ?? [],
})

export const getAllProjects = async ({
  search,
  category,
  sort,
  page = 1,
  limit = 20,
}: {
  search?: string
  category?: string
  sort?: string
  page?: number
  limit?: number
} = {}) => {
  const where: any = {}

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (category) {
    where.category = { name: category }
  }

  const orderBy =
    sort === 'likes'
      ? { likes: 'desc' as const }
      : sort === 'oldest'
        ? { createdAt: 'asc' as const }
        : sort === 'title'
          ? { title: 'asc' as const }
          : { createdAt: 'desc' as const }

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
  const project = await prisma.project.findUnique({
    where: { id },
    select: projectSelect,
  })
  return project ? normalizeProject(project) : null
}

export const getLikedProjectsByUser = async (userId: string) => {
  const likes = await prisma.projectLike.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      createdAt: true,
      project: { select: projectSelect },
    },
  })
  return likes.map((l) => normalizeProject(l.project))
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
  const techConnects = technologies?.length
    ? await resolveTechnologies(technologies)
    : []

  // Resolve category name to ID if category_id is not provided
  let finalCategoryId = category_id
  if (!finalCategoryId && category) {
    const cat = await prisma.category.findUnique({ where: { name: category } })
    if (cat) finalCategoryId = cat.id
  }

  const project = await prisma.project.create({
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
    likes,
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
    likes?: number
    technologies?: string[]
  },
) => {
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

  const project = await prisma.project.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(slug !== undefined && { slug }),
      ...(description !== undefined && { description }),
      ...(thumbnail !== undefined && { thumbnail }),
      ...(github_url !== undefined && { githubUrl: github_url }),
      ...(live_url !== undefined && { liveUrl: live_url }),
      ...(finalCategoryId !== undefined && { categoryId: finalCategoryId }),
      ...(likes !== undefined && { likes }),
      ...(techUpdate && { technologies: techUpdate }),
    },
    select: projectSelect,
  })

  return normalizeProject(project)
}

export const deleteProject = async (id: string) => {
  return prisma.project.delete({ where: { id } })
}

export const toggleLikeProject = async (projectId: string, userId: string) => {
  const existing = await prisma.projectLike.findUnique({
    where: { userId_projectId: { userId, projectId } },
  })

  if (existing) {
    await prisma.$transaction([
      prisma.projectLike.delete({ where: { id: existing.id } }),
      prisma.project.update({
        where: { id: projectId },
        data: { likes: { decrement: 1 } },
      }),
    ])
    return { liked: false, likes: (await getProjectById(projectId))?.likes ?? 0 }
  }

  await prisma.$transaction([
    prisma.projectLike.create({ data: { userId, projectId } }),
    prisma.project.update({
      where: { id: projectId },
      data: { likes: { increment: 1 } },
    }),
  ])
  return { liked: true, likes: (await getProjectById(projectId))?.likes ?? 0 }
}

async function resolveTechnologies(names: string[]): Promise<string[]> {
  const ids: string[] = []
  for (const name of names) {
    if (!name.trim()) continue
    const tech = await prisma.technology.upsert({
      where: { name: name.trim() },
      update: {},
      create: { name: name.trim() },
    })
    ids.push(tech.id)
  }
  return ids
}
