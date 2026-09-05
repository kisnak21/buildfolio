import { beforeEach, describe, expect, it, vi } from 'vitest'

const db = vi.hoisted(() => ({
  bookmark: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  project: {
    findFirst: vi.fn(),
  },
}))

vi.mock('@/lib/db', () => ({ default: db }))

import { addBookmark, getBookmarksByUser } from '@/lib/services/bookmarkService'

const projectRow = {
  id: 'project-1',
  title: 'Project one',
  slug: 'project-one',
  description: 'A public project.',
  thumbnail: null,
  likes: 3,
  githubUrl: null,
  liveUrl: null,
  userId: 'owner-1',
  categoryId: null,
  featuredAt: null,
  hiddenAt: null,
  hiddenReason: null,
  status: 'PUBLISHED',
  createdAt: new Date('2026-08-28T00:00:00.000Z'),
  user: { name: 'Owner', username: 'owner' },
  category: null,
  technologies: [],
}

const bookmarkRow = {
  id: 'bookmark-1',
  userId: 'user-1',
  projectId: 'project-1',
  createdAt: new Date('2026-08-28T00:00:00.000Z'),
  project: projectRow,
}

describe('bookmark project loading', () => {
  beforeEach(() => {
    db.bookmark.findMany.mockResolvedValue([])
    db.project.findFirst.mockResolvedValue({ id: 'project-1' })
    db.bookmark.create.mockResolvedValue(bookmarkRow)
  })

  it('loads each bookmark with its complete visible project projection', async () => {
    db.bookmark.findMany.mockResolvedValue([bookmarkRow])
    const result = await getBookmarksByUser('user-1')

    const query = db.bookmark.findMany.mock.calls[0][0] as {
      where: Record<string, unknown>
      select: Record<string, unknown>
    }

    expect(query.where).toMatchObject({ userId: 'user-1' })
    expect(query.select).toHaveProperty('project')
    expect(query.select.project).toMatchObject({
      select: expect.objectContaining({
        id: true,
        title: true,
        description: true,
        likes: true,
        user: { select: { name: true, username: true } },
        category: { select: { name: true } },
        technologies: expect.any(Object),
      }),
    })
    expect(result[0].project.title).toBe('Project one')
    expect(result[0].project.author_name).toBe('Owner')
    expect(result[0].project.author_username).toBe('owner')
  })

  it('returns the same complete project shape when a bookmark is added', async () => {
    const result = await addBookmark({ user_id: 'user-1', project_id: 'project-1' })

    expect(result.project.id).toBe('project-1')
    expect(result.project.status).toBe('PUBLISHED')
    expect(db.bookmark.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { userId: 'user-1', projectId: 'project-1' },
      }),
    )
  })
})
