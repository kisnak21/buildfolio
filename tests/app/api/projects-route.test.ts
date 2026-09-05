import { describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const dependencies = vi.hoisted(() => ({
  assertSameOrigin: vi.fn(() => null),
  requireActiveUser: vi.fn(),
  rateLimit: vi.fn(),
  createProject: vi.fn(),
  getAllProjects: vi.fn(),
}))

vi.mock('@/lib/middleware/authMiddleware', () => ({
  assertSameOrigin: dependencies.assertSameOrigin,
  requireActiveUser: dependencies.requireActiveUser,
}))
vi.mock('@/lib/rateLimit', () => ({ rateLimit: dependencies.rateLimit }))
vi.mock('@/lib/services/projectService', () => ({
  createProject: dependencies.createProject,
  getAllProjects: dependencies.getAllProjects,
}))

import { GET, POST } from '@/app/api/projects/route'

describe('projects API route', () => {
  it('uses the authenticated user when creating a project', async () => {
    dependencies.requireActiveUser.mockResolvedValue({
      user: { id: 'owner-1', name: 'Owner', email: 'owner@example.com' },
      error: null,
    })
    dependencies.rateLimit.mockResolvedValue({ success: true, resetInMs: 0 })
    dependencies.createProject.mockResolvedValue({ id: 'project-1' })

    const request = new NextRequest('http://localhost/api/projects', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: 'A project',
        slug: 'a-project',
        description: 'A useful project',
        user_id: 'attacker-1',
      }),
    })

    const response = await POST(request)

    expect(response.status).toBe(201)
    expect(dependencies.createProject).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'owner-1' }),
    )
    expect(dependencies.createProject).not.toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'attacker-1' }),
    )
  })

  it('passes server-side discovery filters through to the service', async () => {
    dependencies.getAllProjects.mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    })

    const request = new NextRequest(
      'http://localhost/api/projects?search=react&category=SaaS&technology=TypeScript&sort=likes&page=2',
    )
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(dependencies.getAllProjects).toHaveBeenCalledWith({
      search: 'react',
      category: 'SaaS',
      technology: 'TypeScript',
      sort: 'likes',
      page: 2,
      limit: 20,
    })
  })
})
