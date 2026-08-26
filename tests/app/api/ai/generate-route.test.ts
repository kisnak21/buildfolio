import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'

import { POST } from '@/app/api/ai/generate/route'

const request = () =>
  new NextRequest('http://localhost:3001/api/ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task: 'description', input: { title: 'Test' } }),
  })

describe('AI generation route while paused', () => {
  it('returns 503 Coming Soon with X-Request-ID', async () => {
    const response = await POST(request())
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(response.headers.get('X-Request-ID')).toMatch(/^[0-9a-f-]{36}$/)
    expect(body.message).toMatch(/coming soon/i)
    expect(body.success).toBe(false)
  })
})
