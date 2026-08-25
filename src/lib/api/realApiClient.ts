const baseURL =
  process.env.NEXT_PUBLIC_REAL_API_BASE_URL ||
  'http://localhost:3001'

interface RequestOptions {
  method: string
  body?: string
  headers?: Record<string, string>
  timeoutMs?: number
  signal?: AbortSignal
}

interface ApiResult<T> {
  data: T
  headers: Record<string, string>
}

let redirectingBlockedAccount = false

const TRACKED_HEADERS = [
  'retry-after',
  'x-ratelimit-remaining-hour',
  'x-ratelimit-remaining-day',
] as const

const trackedHeaders = (res: Response) => {
  const headers: Record<string, string> = {}
  for (const name of TRACKED_HEADERS) {
    const value = res.headers.get(name)
    if (value !== null) headers[name] = value
  }
  return headers
}

const redirectBlockedAccount = (code: unknown) => {
  if (
    typeof window === 'undefined' ||
    redirectingBlockedAccount ||
    (code !== 'ACCOUNT_BANNED' && code !== 'ACCOUNT_SUSPENDED')
  ) {
    return
  }

  redirectingBlockedAccount = true
  localStorage.removeItem('buildfolio_user')
  document.cookie = 'buildfolio_session=; path=/; max-age=0'
  const blocked = code === 'ACCOUNT_BANNED' ? 'banned' : 'suspended'
  void fetch('/api/users/logout', { method: 'POST' }).finally(() => {
    window.location.assign(`/login?blocked=${blocked}`)
  })
}

const request = async <T>(url: string, options: RequestOptions): Promise<ApiResult<T>> => {
  const controller = new AbortController()
  const abortFromCaller = () => controller.abort(options.signal?.reason)
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? 15_000,
  )
  if (options.signal?.aborted) abortFromCaller()
  else options.signal?.addEventListener('abort', abortFromCaller, { once: true })

  try {
    const res = await fetch(`${baseURL}${url}`, {
      method: options.method,
      body: options.body,
      credentials: 'include',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (res.status === 204) return { data: undefined as T, headers: {} }

    const body: Record<string, unknown> = await res.json().catch(() => ({}))

    if (!res.ok) {
      redirectBlockedAccount(body.code)
      const err = new Error(
        typeof body?.error === 'string'
          ? body.error
          : typeof body?.message === 'string'
            ? body.message
            : `Request failed (${res.status})`,
      ) as Error & { response?: { status: number; data: Record<string, unknown>; headers?: Record<string, string> } }
      err.response = { status: res.status, data: body, headers: trackedHeaders(res) }
      throw err
    }

    return { data: body as T, headers: trackedHeaders(res) }
  } finally {
    clearTimeout(timeout)
    options.signal?.removeEventListener('abort', abortFromCaller)
  }
}

const streamRequest = async (
  url: string,
  options: { method: string; body?: string; signal?: AbortSignal },
): Promise<ReadableStream<Uint8Array>> => {
  const res = await fetch(`${baseURL}${url}`, {
    method: options.method,
    body: options.body,
    credentials: 'include',
    signal: options.signal,
    headers: { 'Content-Type': 'application/json' },
  })

  if (!res.ok) {
    const body: Record<string, unknown> = await res.json().catch(() => ({}))
    redirectBlockedAccount(body.code)
    const err = new Error(
      typeof body.error === 'string'
        ? body.error
        : typeof body.message === 'string'
          ? body.message
          : `Request failed (${res.status})`,
    ) as Error & { response?: { status: number; data: Record<string, unknown>; headers?: Record<string, string> } }
    err.response = { status: res.status, data: body, headers: trackedHeaders(res) }
    throw err
  }

  if (!res.body) throw new Error('The AI stream was empty.')
  return res.body
}

const realApiClient = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic defaults preserve axios-like call sites
  get: <T = any>(url: string): Promise<ApiResult<T>> =>
    request<T>(url, { method: 'GET' }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  post: <T = any>(
    url: string,
    data?: object,
    options?: { timeoutMs?: number; signal?: AbortSignal },
  ): Promise<ApiResult<T>> =>
    request<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      timeoutMs: options?.timeoutMs,
      signal: options?.signal,
    }),
  postStream: (
    url: string,
    data?: object,
    options?: { signal?: AbortSignal },
  ): Promise<ReadableStream<Uint8Array>> =>
    streamRequest(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      signal: options?.signal,
    }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  patch: <T = any>(url: string, data?: Record<string, unknown>): Promise<ApiResult<T>> =>
    request<T>(url, { method: 'PATCH', body: data ? JSON.stringify(data) : undefined }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  put: <T = any>(url: string, data?: Record<string, unknown>): Promise<ApiResult<T>> =>
    request<T>(url, { method: 'PUT', body: data ? JSON.stringify(data) : undefined }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete: <T = any>(url: string): Promise<ApiResult<T>> =>
    request<T>(url, { method: 'DELETE' }),
}

export default realApiClient
