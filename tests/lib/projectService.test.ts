import { beforeEach, describe, expect, it, vi } from 'vitest'

const db = vi.hoisted(() => ({
  project: {
    count: vi.fn(),
    findMany: vi.fn(),
  },
}))

vi.mock('@/lib/db', () => ({ default: db }))

import { getAllProjects } from '@/lib/services/projectService'

describe('project catalog query', () => {
  beforeEach(() => {
    db.project.count.mockResolvedValue(0)
    db.project.findMany.mockResolvedValue([])
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
})
