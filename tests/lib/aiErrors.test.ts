import { describe, expect, it } from 'vitest'
import { aiResponseMessage, retryAfterSecondsFrom } from '@/lib/aiErrors'

describe('AI client error helpers', () => {
  it('reads the provider message and falls back otherwise', () => {
    expect(
      aiResponseMessage(
        { response: { data: { message: 'AI hourly limit reached.' } } },
        'Fallback',
      ),
    ).toBe('AI hourly limit reached.')
    expect(aiResponseMessage(new Error('boom'), 'Fallback')).toBe('Fallback')
    expect(aiResponseMessage(undefined, 'Fallback')).toBe('Fallback')
  })

  it('parses Retry-After seconds from error headers', () => {
    expect(
      retryAfterSecondsFrom({
        response: { status: 429, headers: { 'retry-after': '30' } },
      }),
    ).toBe(30)
    expect(
      retryAfterSecondsFrom({
        response: { status: 429, headers: { 'retry-after': '2.4' } },
      }),
    ).toBe(3)
  })

  it('returns zero when Retry-After is missing or invalid', () => {
    expect(retryAfterSecondsFrom({ response: { status: 429 } })).toBe(0)
    expect(
      retryAfterSecondsFrom({
        response: { status: 429, headers: { 'retry-after': 'soon' } },
      }),
    ).toBe(0)
    expect(
      retryAfterSecondsFrom({
        response: { status: 429, headers: { 'retry-after': '-5' } },
      }),
    ).toBe(0)
  })
})
