import { beforeEach, describe, expect, it, vi } from 'vitest'

const db = vi.hoisted(() => ({
  $transaction: vi.fn(),
  project: {
    count: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock('@/lib/db', () => ({ default: db }))

import { getAllProjects, updateProject } from '@/lib/services/projectService'

const projectRow = {
  id: 'project-1',
  title: 'Draft project',
  slug: 'draft-project',
  description: '',
  thumbnail: null,
  githubUrl: null,
  liveUrl: null,
  likes: 0,
  status: 'DRAFT',
  userId: 'user-1',
  categoryId: null,
  featuredAt: null,
  hiddenAt: null,
  hiddenReason: null,
  createdAt: new Date('2026-08-28T00:00:00.000Z'),
  user: { name: 'Owner', username: 'owner' },
  category: null,
  technologies: [],
}

describe('project catalog query', () => {
  beforeEach(() => {
    db.project.count.mockResolvedValue(0)
    db.project.findMany.mockResolvedValue([])
    db.$transaction.mockImplementation(async (operation) => operation(db))
  })

  it('applies search, category, technology, author, and pagination in the database query', async () => {
    const result = await getAllProjects({
      search: 'react',
      category: 'Web App',
      technology: 'TypeScript',
      author: 'Ada Lovelace',
      sort: 'likes',
      page: 2,
      limit: 6,
    })

    const countCall = db.project.count.mock.calls[0][0] as { where: Record<string, unknown> }
    const findCall = db.project.findMany.mock.calls[0][0] as {
      where: Record<string, unknown>
      orderBy: unknown
      skip: number
      take: number
    }

    expect(countCall.where).toMatchObject({
      status: 'PUBLISHED',
      hiddenAt: null,
      category: { name: 'Web App' },
      technologies: {
        some: {
          technology: { name: { equals: 'TypeScript', mode: 'insensitive' } },
        },
      },
      AND: [
        {
          user: {
            is: {
              OR: [
                { name: { equals: 'Ada Lovelace', mode: 'insensitive' } },
                { username: { equals: 'Ada Lovelace', mode: 'insensitive' } },
              ],
            },
          },
        },
      ],
    })
    expect(countCall.where.OR).toEqual([
      { title: { contains: 'react', mode: 'insensitive' } },
      { description: { contains: 'react', mode: 'insensitive' } },
      {
        user: {
          is: {
            OR: [
              { name: { contains: 'react', mode: 'insensitive' } },
              { username: { contains: 'react', mode: 'insensitive' } },
            ],
          },
        },
      },
    ])
    expect(findCall.skip).toBe(6)
    expect(findCall.take).toBe(6)
    expect(findCall.orderBy).toEqual([{ likes: 'desc' }, { id: 'asc' }])
    expect(result.pagination).toMatchObject({ page: 2, limit: 6, total: 0, totalPages: 0 })
  })

  it('allows an incomplete draft to be saved without a description', async () => {
    db.project.findUnique.mockResolvedValue({
      title: projectRow.title,
      slug: projectRow.slug,
      description: projectRow.description,
      status: 'DRAFT',
    })
    db.project.update.mockResolvedValue(projectRow)

    const result = await updateProject('project-1', { description: '' })

    expect(result.status).toBe('DRAFT')
    expect(db.project.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ description: '' }),
      }),
    )
  })
})
