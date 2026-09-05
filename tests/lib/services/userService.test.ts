import { describe, expect, it, vi } from 'vitest'

const prisma = vi.hoisted(() => ({
  user: { findFirst: vi.fn() },
}))

vi.mock('@/lib/db', () => ({ default: prisma }))

import { getUserByUsername } from '@/lib/services/userService'

describe('user service profiles', () => {
  it('loads a public profile by username and excludes inactive accounts', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'user-1',
      name: 'Alice',
      username: 'alice_1',
      image: null,
      bio: 'Builder',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    })

    await getUserByUsername('alice_1')

    expect(prisma.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          username: { equals: 'alice_1', mode: 'insensitive' },
          bannedAt: null,
        }),
      }),
    )
  })
})
