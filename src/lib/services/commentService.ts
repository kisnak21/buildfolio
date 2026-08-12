import prisma from '@/lib/db'

export const getCommentsByProject = async (projectId: string) => {
  const comments = await prisma.comment.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      content: true,
      userId: true,
      projectId: true,
      createdAt: true,
      user: { select: { name: true } },
    },
  })

  return comments.map((c) => ({
    id: c.id,
    content: c.content,
    user_id: c.userId,
    project_id: c.projectId,
    created_at: c.createdAt,
    author_name: c.user.name,
  }))
}

export const addComment = async ({
  content,
  user_id,
  project_id,
}: {
  content: string
  user_id: string
  project_id: string
}) => {
  const comment = await prisma.comment.create({
    data: { content, userId: user_id, projectId: project_id },
    select: {
      id: true,
      content: true,
      userId: true,
      projectId: true,
      createdAt: true,
      user: { select: { name: true } },
    },
  })
  return {
    id: comment.id,
    content: comment.content,
    user_id: comment.userId,
    project_id: comment.projectId,
    created_at: comment.createdAt,
    author_name: comment.user.name,
  }
}

export const getCommentById = async (id: string) => {
  const comment = await prisma.comment.findUnique({
    where: { id },
    select: { id: true, userId: true },
  })
  return comment ? { id: comment.id, user_id: comment.userId } : null
}

export const deleteComment = async (id: string) => {
  const comment = await prisma.comment.delete({
    where: { id },
    select: { id: true },
  })
  return { id: comment.id }
}
