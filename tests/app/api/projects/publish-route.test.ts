import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  publishProject: vi.fn(),
  requireActiveUser: vi.fn(),
  assertSameOrigin: vi.fn(),
  rateLimit: vi.fn(),
}))

vi.mock('@/lib/services/projectService', () => ({
  publishProject: mocks.publishProject,
}))
vi.mock('@/lib/middleware/authMiddleware', () => ({
  requireActiveUser: mocks.requireActiveUser,
  assertSameOrigin: mocks.assertSameOrigin,
}))
vi.mock('@/lib/rateLimit', () => ({
  rateLimit: mocks.rateLimit,
}))

import { POST } from '@/app/api/projects/[id]/publish/route'

describe('publish project route', () => {
  beforeEach(() => {
    mocks.publishProject.mockResolvedValue({ id: 'project-1', status: 'PUBLISHED' })
    mocks.requireActiveUser.mockResolvedValue({ user: { id: 'user-1' }, error: null })
    mocks.assertSameOrigin.mockReturnValue(null)
    mocks.rateLimit.mockResolvedValue({ success: true, resetInMs: 0 })
  })

  it('publishes through the owner-authenticated service', async () => {
    const request = new NextRequest('http://localhost:3001/api/projects/project-1/publish', {
      method: 'POST',
      headers: { origin: 'http://localhost:3001' },
    })

    const response = await POST(request, { params: Promise.resolve({ id: 'project-1' }) })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data).toEqual({ id: 'project-1', status: 'PUBLISHED' })
    expect(mocks.publishProject).toHaveBeenCalledWith('project-1', 'user-1')
  })
})
