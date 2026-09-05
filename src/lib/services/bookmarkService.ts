import prisma from '@/lib/db'
import type { Prisma } from '@/generated/prisma/client'
import { publicProjectWhere } from '@/lib/visibility'
import { projectSelect } from '@/lib/services/projectService'

const bookmarkSelect = {
  id: true,
  userId: true,
  projectId: true,
  createdAt: true,
  project: { select: projectSelect },
} as const

type BookmarkRow = Prisma.BookmarkGetPayload<{ select: typeof bookmarkSelect }>

const normalizeBookmark = (b: BookmarkRow) => ({
  id: b.id,
  user_id: b.userId,
  project_id: b.projectId,
  created_at: b.createdAt.toISOString(),
  project: {
    id: b.project.id,
    title: b.project.title,
    slug: b.project.slug,
    description: b.project.description,
    thumbnail: b.project.thumbnail,
    likes: b.project.likes,
    github_url: b.project.githubUrl ?? undefined,
    live_url: b.project.liveUrl ?? undefined,
    user_id: b.project.userId,
    category_id: b.project.categoryId,
    category_name: b.project.category?.name ?? undefined,
    technologies: b.project.technologies.map((technology) => technology.technology.name),
    author_name: b.project.user.name,
    author_username: b.project.user.username,
    featured_at: b.project.featuredAt?.toISOString() ?? null,
    hidden_at: b.project.hiddenAt?.toISOString() ?? null,
    hidden_reason: b.project.hiddenReason,
    status: b.project.status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED',
    created_at: b.project.createdAt.toISOString(),
  },
})

export const getBookmarksByUser = async (userId: string) => {
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId, project: { is: publicProjectWhere() } },
    orderBy: { createdAt: 'desc' },
    select: bookmarkSelect,
  })

  return bookmarks.map(normalizeBookmark)
}

export const addBookmark = async ({
  user_id,
  project_id,
}: {
  user_id: string
  project_id: string
}) => {
  const project = await prisma.project.findFirst({
    where: { id: project_id, ...publicProjectWhere() },
    select: { id: true },
  })
  if (!project) {
    throw Object.assign(new Error('Project not found'), { statusCode: 404 })
  }
  const bookmark = await prisma.bookmark.create({
    data: { userId: user_id, projectId: project_id },
    select: bookmarkSelect,
  })
  return normalizeBookmark(bookmark)
}

export const getBookmarkById = async (id: string) => {
  const bookmark = await prisma.bookmark.findUnique({
    where: { id },
    select: { id: true, userId: true },
  })
  return bookmark ? { id: bookmark.id, user_id: bookmark.userId } : null
}

export const removeBookmark = async (id: string) => {
  const bookmark = await prisma.bookmark.delete({
    where: { id },
    select: { id: true },
  })
  return { id: bookmark.id }
}

export const getBookmark = async ({
  user_id,
  project_id,
}: {
  user_id: string
  project_id: string
}) => {
  return prisma.bookmark.findUnique({
    where: { userId_projectId: { userId: user_id, projectId: project_id } },
  })
}
