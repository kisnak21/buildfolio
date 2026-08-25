export interface AiRequestErrorLike {
  response?: {
    status?: number
    data?: { message?: string }
    headers?: Record<string, string>
  }
  message?: string
}

export const aiResponseMessage = (error: unknown, fallback: string) => {
  const requestError = error as AiRequestErrorLike
  return requestError?.response?.data?.message || fallback
}

export const retryAfterSecondsFrom = (error: unknown) => {
  const raw = (error as AiRequestErrorLike)?.response?.headers?.['retry-after']
  const seconds = Number(raw)
  if (!Number.isFinite(seconds) || seconds <= 0) return 0
  return Math.ceil(seconds)
}
