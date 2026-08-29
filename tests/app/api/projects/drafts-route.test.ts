import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  createProject: vi.fn(),
  requireActiveUser: vi.fn(),
  assertSameOrigin: vi.fn(),
  rateLimit: vi.fn(),
}))

vi.mock('@/lib/services/projectService', () => ({
  createProject: mocks.createProject,
}))
vi.mock('@/lib/middleware/authMiddleware', () => ({
  requireActiveUser: mocks.requireActiveUser,
  assertSameOrigin: mocks.assertSameOrigin,
}))
vi.mock('@/lib/rateLimit', () => ({
  rateLimit: mocks.rateLimit,
}))

import { POST } from '@/app/api/projects/drafts/route'

describe('draft project route', () => {
  beforeEach(() => {
    mocks.createProject.mockResolvedValue({ id: 'project-1', status: 'DRAFT' })
    mocks.requireActiveUser.mockResolvedValue({ user: { id: 'user-1' }, error: null })
    mocks.assertSameOrigin.mockReturnValue(null)
    mocks.rateLimit.mockResolvedValue({ success: true, resetInMs: 0 })
  })

  it('creates a draft with the authenticated owner and draft status', async () => {
    const request = new NextRequest('http://localhost:3001/api/projects/drafts', {
      method: 'POST',
      headers: { origin: 'http://localhost:3001' },
      body: JSON.stringify({
        title: 'Project draft',
        slug: 'project-draft',
        description: 'A private project draft.',
        user_id: 'attacker-id',
      }),
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body.data).toEqual({ id: 'project-1', status: 'DRAFT' })
    expect(mocks.createProject).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'user-1', status: 'DRAFT' }),
    )
  })
})
