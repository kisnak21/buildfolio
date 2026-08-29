import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'

import { GET } from '@/app/api/ai/quota/route'

const request = () => new NextRequest('http://localhost:3001/api/ai/quota')

describe('AI quota route while paused', () => {
  it('returns 503 Coming Soon with X-Request-ID', async () => {
    const response = await GET(request())
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(response.headers.get('X-Request-ID')).toMatch(/^[0-9a-f-]{36}$/)
    expect(body.message).toMatch(/coming soon/i)
    expect(body.success).toBe(false)
  })
})
