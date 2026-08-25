import { Writable } from 'node:stream'
import { describe, expect, it } from 'vitest'
import { createLogger } from '@/lib/logger'

describe('logger redaction', () => {
  it('removes prompts, responses, credentials, and authorization headers', async () => {
    const lines: string[] = []
    const destination = new Writable({
      write(chunk, _encoding, callback) {
        lines.push(chunk.toString())
        callback()
      },
    })
    const logger = createLogger(destination)

    logger.info(
      {
        requestId: 'request-123',
        task: 'ideas',
        prompt: 'private prompt value',
        input: { interests: 'private interest' },
        response: 'private completion',
        apiKey: 'private-key',
        headers: {
          authorization: 'Bearer private-token',
          cookie: 'session=private',
        },
      },
      'AI telemetry',
    )
    await new Promise((resolve) => setImmediate(resolve))

    const entry = JSON.parse(lines.join('')) as Record<string, unknown>
    expect(entry).toMatchObject({ requestId: 'request-123', task: 'ideas' })
    expect(entry).not.toHaveProperty('prompt')
    expect(entry).not.toHaveProperty('input')
    expect(entry).not.toHaveProperty('response')
    expect(entry).not.toHaveProperty('apiKey')
    expect(entry).not.toHaveProperty('headers.authorization')
    expect(entry).not.toHaveProperty('headers.cookie')
    expect(lines.join('')).not.toContain('private')
  })
})
