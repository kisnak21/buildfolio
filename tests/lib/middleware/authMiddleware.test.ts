import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const dependencies = vi.hoisted(() => ({
  verifyToken: vi.fn(),
  findUnique: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ verifyToken: dependencies.verifyToken }))
vi.mock('@/lib/db', () => ({
  default: { user: { findUnique: dependencies.findUnique } },
}))

import {
  assertSameOrigin,
  authenticate,
  requireAdmin,
} from '@/lib/middleware/authMiddleware'

describe('authentication middleware', () => {
  beforeEach(() => vi.clearAllMocks())

  it('prefers the signed httpOnly cookie for authentication', () => {
    dependencies.verifyToken.mockReturnValue({ id: 'user-1', email: 'user@example.com' })
    const request = new NextRequest('http://localhost/api/projects', {
      headers: {
        cookie: 'buildfolio_token=signed-cookie',
        authorization: 'Bearer stale-header-token',
      },
    })

    const result = authenticate(request)

    expect(result.error).toBeNull()
    expect(result.user?.id).toBe('user-1')
    expect(dependencies.verifyToken).toHaveBeenCalledWith('signed-cookie')
  })

  it('checks the database role instead of trusting the JWT role claim', async () => {
    dependencies.verifyToken.mockReturnValue({
      id: 'user-1',
      email: 'user@example.com',
      role: 'admin',
    })
    dependencies.findUnique.mockResolvedValue({
      role: 'user',
      bannedAt: null,
      suspendedUntil: null,
    })

    const result = await requireAdmin(
      new NextRequest('http://localhost/api/admin/users', {
        headers: { cookie: 'buildfolio_token=signed-cookie' },
      }),
    )

    expect(result.admin).toBeNull()
    expect(result.error?.status).toBe(403)
  })

  it('rejects state-changing requests from another origin', () => {
    const response = assertSameOrigin(
      new NextRequest('http://localhost/api/projects', {
        method: 'POST',
        headers: { origin: 'https://attacker.example', host: 'localhost' },
      }),
    )

    expect(response?.status).toBe(403)
  })
})
