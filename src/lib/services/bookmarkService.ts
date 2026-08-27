import prisma from '@/lib/db'
import { publicProjectWhere } from '@/lib/visibility'
import { normalizeProject, projectSelect } from '@/lib/services/projectService'

export const getBookmarksByUser = async (userId: string) => {
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId, project: { is: publicProjectWhere() } },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      userId: true,
      projectId: true,
      createdAt: true,
      project: { select: projectSelect },
    },
  })

  return bookmarks.map((bookmark) => ({
    id: bookmark.id,
    user_id: bookmark.userId,
    project_id: bookmark.projectId,
    created_at: bookmark.createdAt.toISOString(),
    project: normalizeProject(bookmark.project),
  }))
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
  })
  return {
    id: bookmark.id,
    user_id: bookmark.userId,
    project_id: bookmark.projectId,
    created_at: bookmark.createdAt,
  }
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
