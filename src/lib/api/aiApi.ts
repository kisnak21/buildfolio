import realApiClient from './realApiClient'
import type {
  AiGenerationInput,
  AiGenerationResult,
  AiModelId,
  AiTask,
} from '@/lib/aiModels'

export interface AiQuotaWindow {
  remaining: number
  limit: number
}

export interface AiQuotaSnapshot {
  hourly: AiQuotaWindow
  daily: AiQuotaWindow
}

export interface AiIdeasStreamEvent {
  event: 'meta' | 'progress' | 'fallback' | 'quota' | 'done' | 'error'
  data: Record<string, unknown>
}

interface AiGenerationOptions {
  onEvent?: (event: AiIdeasStreamEvent) => void
  signal?: AbortSignal
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const streamError = (
  message: string,
  status = 502,
  retryAfterSeconds?: number,
) => {
  const error = new Error(message) as Error & {
    response?: {
      status: number
      data: Record<string, unknown>
      headers?: Record<string, string>
    }
  }
  error.response = {
    status,
    data: { message },
    ...(retryAfterSeconds
      ? { headers: { 'retry-after': String(retryAfterSeconds) } }
      : {}),
  }
  return error
}

const generateAiIdeas = async (
  model: AiModelId | undefined,
  input: AiGenerationInput,
  options?: AiGenerationOptions,
): Promise<AiGenerationResult> => {
  const controller = new AbortController()
  let timedOut = false
  const timeout = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, 65_000)
  const abortFromCaller = () => controller.abort(options?.signal?.reason)
  if (options?.signal?.aborted) abortFromCaller()
  else options?.signal?.addEventListener('abort', abortFromCaller, { once: true })
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined
  let result: AiGenerationResult | undefined

  try {
    const body = await realApiClient.postStream(
      '/ai/generate',
      { task: 'ideas', ...(model ? { model } : {}), input },
      { signal: controller.signal },
    )
    reader = body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    const consumeFrame = (frame: string) => {
      let event: AiIdeasStreamEvent['event'] = 'progress'
      let dataText = ''
      for (const line of frame.split(/\r?\n/)) {
        if (line.startsWith('event:')) event = line.slice(6).trim() as AiIdeasStreamEvent['event']
        if (line.startsWith('data:')) dataText += line.slice(5).trimStart()
      }
      if (!dataText) return

      let parsed: unknown
      try {
        parsed = JSON.parse(dataText)
      } catch {
        throw streamError('AI returned an invalid stream event.')
      }
      if (!isRecord(parsed)) throw streamError('AI returned an invalid stream event.')

      const streamEvent = { event, data: parsed }
      options?.onEvent?.(streamEvent)
      if (event === 'error') {
        const message =
          typeof parsed.message === 'string'
            ? parsed.message
            : 'AI generation failed.'
        const status =
          typeof parsed.status === 'number' ? parsed.status : 502
        const retryAfterSeconds =
          typeof parsed.retryAfterSeconds === 'number'
            ? parsed.retryAfterSeconds
            : undefined
        throw streamError(message, status, retryAfterSeconds)
      }
      if (event === 'done') {
        const data = parsed.data
        if (!isRecord(data) || data.task !== 'ideas' || !Array.isArray(data.ideas)) {
          throw streamError('AI returned an invalid idea result.')
        }
        result = data as AiGenerationResult
      }
    }

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const frames = buffer.split(/\r?\n\r?\n/)
      buffer = frames.pop() ?? ''
      for (const frame of frames) consumeFrame(frame)
    }
    buffer += decoder.decode()
    if (buffer.trim()) consumeFrame(buffer)

    if (!result) throw streamError('AI stream ended without a result.')
    return result
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      if (options?.signal?.aborted) {
        throw streamError('AI generation cancelled.')
      }
      if (timedOut) {
        throw streamError('AI generation timed out. Please try again.')
      }
      throw streamError('AI generation timed out. Please try again.')
    }
    throw error
  } finally {
    clearTimeout(timeout)
    options?.signal?.removeEventListener('abort', abortFromCaller)
    reader?.releaseLock()
  }
}

export const getAiQuota = async (): Promise<AiQuotaSnapshot> => {
  const response = await realApiClient.get<{
    success: boolean
    data: AiQuotaSnapshot
  }>('/ai/quota')
  return response.data.data
}

export const generateAiContent = async (
  task: AiTask,
  model: AiModelId | undefined,
  input: AiGenerationInput,
  options?: AiGenerationOptions,
): Promise<AiGenerationResult> => {
  if (task === 'ideas') return generateAiIdeas(model, input, options)

  const response = await realApiClient.post(
    '/ai/generate',
    { task, model, input },
    { timeoutMs: 65_000, signal: options?.signal },
  )
  return response.data.data as AiGenerationResult
}
