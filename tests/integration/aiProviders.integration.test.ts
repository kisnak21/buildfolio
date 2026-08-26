import { existsSync } from 'node:fs'
import { beforeAll, describe, expect, it } from 'vitest'

if (existsSync('.env.local')) process.loadEnvFile('.env.local')

const shouldRun = process.env.RUN_AI_INTEGRATION === 'true'

describe.skipIf(!shouldRun)('AI provider integration', () => {
  beforeAll(() => {
    if (!process.env.GROQ_API_KEY || !process.env.OPENROUTER_API_KEY) {
      throw new Error(
        'GROQ_API_KEY and OPENROUTER_API_KEY are required for AI integration tests',
      )
    }
  })

  it(
    'returns three strict ideas from Groq GPT-OSS 120B',
    async () => {
      const { generateWithProviders } = await import(
        '@/lib/services/aiService'
      )
      const result = await generateWithProviders({
        task: 'ideas',
        model: 'openai/gpt-oss-120b',
        input: {
          interests: 'accessible community tools',
          technologies: ['TypeScript', 'PostgreSQL'],
          experience: 'intermediate',
        },
      })

      expect(result.task).toBe('ideas')
      expect(result.model).toContain('gpt-oss-120b')
      if (result.task === 'ideas') expect(result.ideas).toHaveLength(3)
    },
    60_000,
  )

  it(
    'returns three strict ideas from the OpenRouter GLM fallback',
    async () => {
      const { generateWithProviders } = await import(
        '@/lib/services/aiService'
      )
      const result = await generateWithProviders({
        task: 'ideas',
        model: 'z-ai/glm-5.2:free',
        input: {
          interests: 'accessible community tools',
          technologies: ['TypeScript', 'PostgreSQL'],
          experience: 'intermediate',
        },
      })

      expect(result.task).toBe('ideas')
      expect(result.model).toContain('glm-5.2')
      if (result.task === 'ideas') expect(result.ideas).toHaveLength(3)
    },
    60_000,
  )
})
