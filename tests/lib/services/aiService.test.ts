import { beforeEach, describe, expect, it, vi } from 'vitest'

const sdk = vi.hoisted(() => ({
  create: vi.fn(),
  clientOptions: undefined as Record<string, unknown> | undefined,
}))

vi.mock('openai', () => ({
  default: class OpenAI {
    constructor(options: Record<string, unknown>) {
      sdk.clientOptions = options
    }

    chat = { completions: { create: sdk.create } }
  },
}))

import {
  IDEAS_JSON_SCHEMA,
  generateWithProviders,
  parseAiRequest,
  parseIdeas,
  streamIdeasWithProviders,
  type AiTelemetryEvent,
} from '@/lib/services/aiService'

const validIdeas = {
  ideas: [
    {
      title: 'Local Skills Exchange',
      summary: 'Neighbors exchange practical skills through scheduled sessions.',
      description: 'Build a directory and booking flow for peer-led sessions. Include profiles, availability, and lightweight reviews.',
      category: 'Web App',
      technologies: ['Next.js', 'PostgreSQL'],
    },
    {
      title: 'Accessible Study Planner',
      summary: 'Students organize focused study plans with accessible controls.',
      description: 'Create a planner with keyboard-first task management and clear progress states. Scope the first version to weekly plans and reminders.',
      category: 'SaaS',
      technologies: ['TypeScript'],
    },
    {
      title: 'Community Data Notebook',
      summary: 'Local groups publish small datasets with understandable context.',
      description: 'Create a structured publishing workflow for datasets and notes. Include CSV upload, metadata, and simple visual summaries.',
      category: 'Open Source',
      technologies: ['React', 'PostgreSQL'],
    },
  ],
}

const asyncChunks = (texts: string[], model = 'openai/gpt-oss-120b') => ({
  async *[Symbol.asyncIterator]() {
    for (const text of texts) {
      yield { model, choices: [{ delta: { content: text } }] }
    }
  },
})

const sdkResponse = (
  texts: string[],
  { model = 'openai/gpt-oss-120b', status = 200 } = {},
) => ({
  withResponse: vi.fn().mockResolvedValue({
    data: asyncChunks(texts, model),
    response: new Response(null, { status }),
    request_id: null,
  }),
})

describe('AI request parsing', () => {
  it('normalizes an Ideas request and chooses the default model', () => {
    const parsed = parseAiRequest({
      task: 'ideas',
      input: {
        interests: '  civic technology  ',
        technologies: [' TypeScript ', 'TypeScript'],
        experience: 'intermediate',
      },
    })

    expect(parsed).toMatchObject({
      task: 'ideas',
      model: 'openai/gpt-oss-120b',
      input: {
        interests: 'civic technology',
        technologies: ['TypeScript'],
        experience: 'intermediate',
      },
    })
  })

  it('enforces task-specific required fields', () => {
    expect(() => parseAiRequest({ task: 'description', input: {} })).toThrow(
      'title is required',
    )
    expect(() =>
      parseAiRequest({ task: 'readme', input: { title: 'Buildfolio' } }),
    ).toThrow('description is required')
    expect(() => parseAiRequest({ task: 'ideas', input: {} })).toThrow(
      'Add at least one interest or technology',
    )
    for (const task of ['prd', 'design', 'styleGuide', 'readme']) {
      expect(() =>
        parseAiRequest({ task, input: { title: 'Buildfolio' } }),
      ).toThrow('description is required')
    }
  })

  it('normalizes selected idea context for document tasks', () => {
    expect(
      parseAiRequest({
        task: 'prd',
        input: {
          title: ' Buildfolio ',
          summary: ' A project discovery platform. ',
          description: ' Developers share their work. ',
          category: 'Web App',
          technologies: [' Next.js '],
        },
      }),
    ).toMatchObject({
      task: 'prd',
      input: {
        title: 'Buildfolio',
        summary: 'A project discovery platform.',
        description: 'Developers share their work.',
        technologies: ['Next.js'],
      },
    })
  })

  it('rejects unsupported tasks, models, and experience levels', () => {
    expect(() => parseAiRequest({ task: 'unknown', input: {} })).toThrow(
      'Invalid generation task',
    )
    expect(() =>
      parseAiRequest({ task: 'ideas', model: 'unknown', input: {} }),
    ).toThrow('Unsupported AI model')
    expect(() =>
      parseAiRequest({
        task: 'ideas',
        input: { interests: 'tools', experience: 'expert' },
      }),
    ).toThrow('Invalid experience level')
    expect(() =>
      parseAiRequest({
        task: ['prd'],
        input: { title: 'Buildfolio', description: 'Project description' },
      }),
    ).toThrow('Invalid generation task')
  })
})

describe('Ideas schema and parsing', () => {
  it('defines a strict three-item JSON Schema', () => {
    expect(IDEAS_JSON_SCHEMA).toMatchObject({
      type: 'object',
      additionalProperties: false,
      required: ['ideas'],
      properties: {
        ideas: {
          type: 'array',
          minItems: 3,
          maxItems: 3,
          items: { additionalProperties: false },
        },
      },
    })
  })

  it('parses valid fenced JSON', () => {
    expect(parseIdeas(`\`\`\`json\n${JSON.stringify(validIdeas)}\n\`\`\``)).toHaveLength(3)
  })

  it('rejects duplicate titles and invalid categories', () => {
    const duplicate = structuredClone(validIdeas)
    duplicate.ideas[1].title = duplicate.ideas[0].title.toUpperCase()
    expect(() => parseIdeas(JSON.stringify(duplicate))).toThrow(
      'invalid or duplicate ideas',
    )

    const invalidCategory = structuredClone(validIdeas)
    invalidCategory.ideas[0].category = 'Enterprise'
    expect(() => parseIdeas(JSON.stringify(invalidCategory))).toThrow(
      'invalid or duplicate ideas',
    )
  })

  it('rejects oversized fields instead of silently truncating them', () => {
    const oversized = structuredClone(validIdeas)
    oversized.ideas[0].title = 'x'.repeat(121)
    expect(() => parseIdeas(JSON.stringify(oversized))).toThrow(
      'invalid or duplicate ideas',
    )
  })

  it('rejects additional root and item properties', () => {
    expect(() =>
      parseIdeas(JSON.stringify({ ...validIdeas, debug: true })),
    ).toThrow('invalid idea format')

    const additionalItemProperty = structuredClone(validIdeas) as typeof validIdeas & {
      ideas: Array<(typeof validIdeas.ideas)[number] & { debug?: boolean }>
    }
    additionalItemProperty.ideas[0].debug = true
    expect(() => parseIdeas(JSON.stringify(additionalItemProperty))).toThrow(
      'invalid or duplicate ideas',
    )
  })
})

describe('Provider SDK generation', () => {
  beforeEach(() => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key')
    vi.stubEnv('GROQ_API_KEY', 'test-key')
    sdk.create.mockReset()
  })

  it('uses SDK streaming upstream for a JSON description response', async () => {
    sdk.create.mockReturnValue(sdkResponse(['A useful ', 'project description.']))
    const telemetry: AiTelemetryEvent[] = []

    const result = await generateWithProviders({
      task: 'description',
      model: 'openai/gpt-oss-120b',
      input: { title: 'Buildfolio' },
      onTelemetry: (event) => telemetry.push(event),
    })

    expect(result).toMatchObject({
      task: 'description',
      text: 'A useful project description.',
      model: 'openai/gpt-oss-120b',
    })
    const [body, options] = sdk.create.mock.calls[0]
    expect(body).toMatchObject({
      model: 'openai/gpt-oss-120b',
      stream: true,
      reasoning_effort: 'low',
    })
    expect(body.provider).toBeUndefined()
    expect(options.signal).toBeInstanceOf(AbortSignal)
    expect(sdk.clientOptions).toMatchObject({
      maxRetries: 0,
      timeout: 22_000,
      baseURL: 'https://api.groq.com/openai/v1',
    })
    expect(telemetry.map((event) => event.event)).toEqual([
      'attempt_started',
      'provider_connected',
      'first_token',
      'attempt_succeeded',
    ])
    expect(JSON.stringify(telemetry)).not.toContain('Buildfolio')
  })

  it('uses strict JSON Schema for a verified model', async () => {
    sdk.create.mockReturnValue(
      sdkResponse([JSON.stringify(validIdeas)], {
        model: 'z-ai/glm-5.2:free',
      }),
    )

    await generateWithProviders({
      task: 'ideas',
      model: 'z-ai/glm-5.2:free',
      input: { interests: 'community tools' },
    })

    expect(sdk.create.mock.calls[0][0]).toMatchObject({
      model: 'z-ai/glm-5.2:free',
      provider: {
        require_parameters: true,
        data_collection: 'allow',
      },
      reasoning: { effort: 'low' },
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'buildfolio_project_ideas',
          strict: true,
          schema: IDEAS_JSON_SCHEMA,
        },
      },
    })
  })

  it('falls back to GLM when Groq is not configured', async () => {
    vi.stubEnv('GROQ_API_KEY', '')
    sdk.create.mockReturnValue(
      sdkResponse([JSON.stringify(validIdeas)], {
        model: 'z-ai/glm-5.2:free',
      }),
    )
    const telemetry: AiTelemetryEvent[] = []

    const result = await generateWithProviders({
      task: 'ideas',
      model: 'openai/gpt-oss-120b',
      input: { interests: 'community tools' },
      onTelemetry: (event) => telemetry.push(event),
    })

    expect(result.model).toBe('z-ai/glm-5.2:free')
    expect(sdk.create).toHaveBeenCalledTimes(1)
    expect(sdk.clientOptions).toMatchObject({
      baseURL: 'https://openrouter.ai/api/v1',
    })
    expect(telemetry[0]).toMatchObject({
      event: 'attempt_started',
      model: 'z-ai/glm-5.2:free',
    })
  })

  it('returns 503 when no provider key is configured', async () => {
    vi.stubEnv('GROQ_API_KEY', '')
    vi.stubEnv('OPENROUTER_API_KEY', '')

    await expect(
      generateWithProviders({
        task: 'description',
        model: 'openai/gpt-oss-120b',
        input: { title: 'Buildfolio' },
      }),
    ).rejects.toMatchObject({ statusCode: 503 })
    expect(sdk.create).not.toHaveBeenCalled()
  })

  it('falls back across providers from Groq to GLM for streaming Ideas', async () => {
    const providerError = Object.assign(new Error('groq unavailable'), {
      name: 'APIError',
      status: 503,
    })
    sdk.create
      .mockReturnValueOnce({
        withResponse: vi.fn().mockRejectedValue(providerError),
      })
      .mockReturnValueOnce(
        sdkResponse([JSON.stringify(validIdeas)], {
          model: 'z-ai/glm-5.2:free',
        }),
      )

    const events: AiTelemetryEvent[] = []
    const streamEvents = []
    for await (const event of streamIdeasWithProviders({
      model: 'openai/gpt-oss-120b',
      input: { interests: 'community tools' },
      onTelemetry: (telemetryEvent) => events.push(telemetryEvent),
    })) {
      streamEvents.push(event)
    }

    expect(streamEvents[0]).toMatchObject({
      event: 'meta',
      data: { model: 'openai/gpt-oss-120b', attempt: 1, total: 2 },
    })
    expect(streamEvents.some((event) => event.event === 'fallback')).toBe(true)
    expect(streamEvents.at(-1)).toMatchObject({
      event: 'done',
      data: { data: { model: 'z-ai/glm-5.2:free' } },
    })
    expect(events.some((event) => event.event === 'fallback')).toBe(true)
    const fallback = events.find((event) => event.event === 'fallback')
    expect(fallback).toMatchObject({
      from: 'openai/gpt-oss-120b',
      next: 'z-ai/glm-5.2:free',
    })
  })

  it.each([
    ['prd', 'product requirements document', 2_500],
    ['design', 'design specification', 2_200],
    ['styleGuide', 'UI style guide', 2_200],
    ['readme', 'README draft', 2_200],
  ] as const)(
    'builds the task-specific %s Markdown request',
    async (task, promptText, maxTokens) => {
      sdk.create.mockReturnValue(sdkResponse(['# Generated document']))

      const result = await generateWithProviders({
        task,
        model: 'openai/gpt-oss-120b',
        input: {
          title: 'Buildfolio',
          summary: 'A project showcase.',
          description: 'Developers publish portfolio projects.',
        },
      })

      expect(result).toMatchObject({ task, text: '# Generated document' })
      const body = sdk.create.mock.calls.at(-1)?.[0]
      expect(body.max_tokens).toBe(maxTokens)
      expect(body.messages[1].content).toContain(promptText)
      expect(body.messages[1].content).toContain('"summary": "A project showcase."')
      expect(body.response_format).toBeUndefined()
    },
  )

  it('falls back to GLM when the schema-capable model fails', async () => {
    const providerError = Object.assign(new Error('provider unavailable'), {
      name: 'APIError',
      status: 503,
    })
    sdk.create
      .mockReturnValueOnce({
        withResponse: vi.fn().mockRejectedValue(providerError),
      })
      .mockReturnValueOnce(
        sdkResponse([JSON.stringify(validIdeas)], {
          model: 'z-ai/glm-5.2:free',
        }),
      )

    const events: AiTelemetryEvent[] = []
    const result = await generateWithProviders({
      task: 'ideas',
      model: 'openai/gpt-oss-120b',
      input: { interests: 'community tools' },
      onTelemetry: (event) => events.push(event),
    })

    expect(result.model).toBe('z-ai/glm-5.2:free')
    expect(sdk.create.mock.calls[0][0]).toMatchObject({
      model: 'openai/gpt-oss-120b',
      reasoning_effort: 'low',
    })
    expect(sdk.create.mock.calls[1][0]).toMatchObject({
      model: 'z-ai/glm-5.2:free',
      response_format: {
        type: 'json_schema',
        json_schema: { strict: true },
      },
    })
    expect(events.some((event) => event.event === 'fallback')).toBe(true)
    expect(
      events.find((event) => event.event === 'attempt_failed'),
    ).toMatchObject({ providerStatus: 503, errorClass: 'APIError' })
  })

  it('does not attempt a fallback after caller abort', async () => {
    const controller = new AbortController()
    controller.abort()
    sdk.create.mockImplementation((_body, options) => ({
      withResponse: vi.fn().mockImplementation(async () => {
        expect(options.signal.aborted).toBe(true)
        const error = new Error('aborted')
        error.name = 'APIUserAbortError'
        throw error
      }),
    }))

    await expect(
      generateWithProviders({
        task: 'description',
        model: 'openai/gpt-oss-120b',
        input: { title: 'Buildfolio' },
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({ statusCode: 499 })
    expect(sdk.create).toHaveBeenCalledTimes(1)
  })

  it('reports an empty stream after exhausting fallbacks', async () => {
    sdk.create.mockImplementation(() => sdkResponse([]))
    const events: AiTelemetryEvent[] = []

    await expect(
      generateWithProviders({
        task: 'description',
        model: 'openai/gpt-oss-120b',
        input: { title: 'Buildfolio' },
        onTelemetry: (event) => events.push(event),
      }),
    ).rejects.toMatchObject({
      statusCode: 502,
      errorClass: 'EmptyCompletionError',
    })
    expect(sdk.create).toHaveBeenCalledTimes(2)
    expect(
      events.filter((event) => event.event === 'attempt_failed'),
    ).toHaveLength(2)
  })

  it('stops a stream when the caller aborts after the first token', async () => {
    const controller = new AbortController()
    sdk.create.mockImplementation((_body, options) => ({
      withResponse: vi.fn().mockResolvedValue({
        data: {
          async *[Symbol.asyncIterator]() {
            yield {
              model: 'openai/gpt-oss-120b',
              choices: [{ delta: { content: 'Partial' } }],
            }
            if (options.signal.aborted) {
              const error = new Error('aborted during stream')
              error.name = 'APIUserAbortError'
              throw error
            }
            await new Promise((_resolve, reject) => {
              options.signal.addEventListener('abort', () => {
                const error = new Error('aborted during stream')
                error.name = 'APIUserAbortError'
                reject(error)
              })
            })
          },
        },
        response: new Response(null, { status: 200 }),
        request_id: null,
      }),
    }))

    await expect(
      generateWithProviders({
        task: 'description',
        model: 'openai/gpt-oss-120b',
        input: { title: 'Buildfolio' },
        signal: controller.signal,
        onTelemetry: (event) => {
          if (event.event === 'first_token') controller.abort()
        },
      }),
    ).rejects.toMatchObject({ statusCode: 499 })
    expect(sdk.create).toHaveBeenCalledTimes(1)
  })

  it('falls back when a completed response fails strict parsing', async () => {
    const malformed = structuredClone(validIdeas)
    malformed.ideas[1].title = malformed.ideas[0].title
    sdk.create
      .mockReturnValueOnce(sdkResponse([JSON.stringify(malformed)]))
      .mockReturnValueOnce(
        sdkResponse([JSON.stringify(validIdeas)], {
          model: 'z-ai/glm-5.2:free',
        }),
      )

    const result = await generateWithProviders({
      task: 'ideas',
      model: 'openai/gpt-oss-120b',
      input: { interests: 'community tools' },
    })

    expect(result.model).toBe('z-ai/glm-5.2:free')
    expect(sdk.create).toHaveBeenCalledTimes(2)
  })

  it('aborts a stalled provider attempt before trying the fallback', async () => {
    vi.useFakeTimers()
    sdk.create
      .mockImplementationOnce((_body, options) => ({
        withResponse: () =>
          new Promise((_resolve, reject) => {
            options.signal.addEventListener('abort', () => {
              const error = new Error('aborted')
              error.name = 'APIUserAbortError'
              reject(error)
            })
          }),
      }))
      .mockReturnValueOnce(
        sdkResponse(['Fallback description.'], {
          model: 'z-ai/glm-5.2:free',
        }),
      )

    const generation = generateWithProviders({
      task: 'description',
      model: 'openai/gpt-oss-120b',
      input: { title: 'Buildfolio' },
    })
    await vi.advanceTimersByTimeAsync(22_000)

    await expect(generation).resolves.toMatchObject({
      task: 'description',
      text: 'Fallback description.',
      model: 'z-ai/glm-5.2:free',
    })
    vi.useRealTimers()
  })

  it('streams Ideas events and validates before done', async () => {
    sdk.create.mockReturnValue(
      sdkResponse([JSON.stringify(validIdeas).slice(0, 100), JSON.stringify(validIdeas).slice(100)]),
    )

    const events = []
    for await (const event of streamIdeasWithProviders({
      model: 'openai/gpt-oss-120b',
      input: { interests: 'community tools' },
    })) {
      events.push(event)
    }

    expect(events[0]).toMatchObject({ event: 'meta' })
    expect(events.at(-1)).toMatchObject({
      event: 'done',
      data: { data: { task: 'ideas', ideas: expect.any(Array) } },
    })
  })

  it('cancels Ideas streaming without reporting an attempt failure', async () => {
    const controller = new AbortController()
    controller.abort()
    sdk.create.mockImplementation((_body, options) => ({
      withResponse: vi.fn().mockImplementation(async () => {
        expect(options.signal.aborted).toBe(true)
        const error = new Error('aborted')
        error.name = 'APIUserAbortError'
        throw error
      }),
    }))
    const telemetry: AiTelemetryEvent[] = []

    const stream = streamIdeasWithProviders({
      model: 'openai/gpt-oss-120b',
      input: { interests: 'community tools' },
      signal: controller.signal,
      onTelemetry: (event) => telemetry.push(event),
    })

    const first = await stream.next()
    expect(first.done).toBe(false)
    await expect(stream.next()).rejects.toMatchObject({ statusCode: 499 })
    expect(sdk.create).toHaveBeenCalledTimes(1)
    expect(telemetry.map((event) => event.event)).toEqual(['attempt_started'])
  })
})
