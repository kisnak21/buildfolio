import { beforeEach, describe, expect, it, vi } from 'vitest'

const prisma = vi.hoisted(() => ({
  category: { findMany: vi.fn() },
  project: { findFirst: vi.fn(), findMany: vi.fn() },
  projectLike: { findUnique: vi.fn(), create: vi.fn(), delete: vi.fn() },
  $queryRaw: vi.fn(),
  $transaction: vi.fn(),
}))

vi.mock('@/lib/db', () => ({ default: prisma }))

import {
  getCategoryStats,
  getProjectsByAuthor,
  toggleLikeProject,
} from '@/lib/services/projectService'

describe('project service discovery and interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prisma.$transaction.mockImplementation(async (callback) =>
      callback({
        $queryRaw: prisma.$queryRaw,
        project: {
          update: vi.fn().mockResolvedValue({ likes: 4 }),
        },
        projectLike: prisma.projectLike,
      }),
    )
  })

  it('looks up project authors by their stable username', async () => {
    prisma.project.findMany.mockResolvedValue([])

    await getProjectsByAuthor('alice_1')

    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          user: expect.objectContaining({
            is: expect.objectContaining({
              username: { equals: 'alice_1', mode: 'insensitive' },
            }),
          }),
        }),
      }),
    )
  })

  it('returns category counts from visible projects', async () => {
    prisma.category.findMany.mockResolvedValue([
      { id: 'cat-1', name: 'SaaS', icon: 'rocket', _count: { projects: 7 } },
    ])

    await expect(getCategoryStats()).resolves.toEqual([
      { id: 'cat-1', name: 'SaaS', icon: 'rocket', count: 7 },
    ])
    expect(prisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({ _count: expect.anything() }),
      }),
    )
  })

  it('locks a project before toggling its like relation and counter', async () => {
    prisma.project.findFirst.mockResolvedValue({ id: 'project-1' })
    prisma.projectLike.findUnique.mockResolvedValue(null)
    prisma.projectLike.create.mockResolvedValue({ id: 'like-1' })

    const result = await toggleLikeProject('project-1', 'user-1')

    expect(prisma.$queryRaw).toHaveBeenCalledOnce()
    expect(prisma.projectLike.create).toHaveBeenCalledWith({
      data: { userId: 'user-1', projectId: 'project-1' },
    })
    expect(result).toEqual({ liked: true, likes: 4 })
  })
})
