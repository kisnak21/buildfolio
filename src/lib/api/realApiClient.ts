const baseURL =
  process.env.NEXT_PUBLIC_REAL_API_BASE_URL ||
  'http://localhost:3001'

interface RequestOptions {
  method: string
  body?: string
  headers?: Record<string, string>
  timeoutMs?: number
}

let redirectingBlockedAccount = false

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

const request = async <T>(url: string, options: RequestOptions): Promise<{ data: T }> => {
  const controller = new AbortController()
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? 15_000,
  )

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

    if (res.status === 204) return { data: undefined as T }

    const body: Record<string, unknown> = await res.json().catch(() => ({}))

    if (!res.ok) {
      redirectBlockedAccount(body.code)
      const err = new Error(
        typeof body?.error === 'string'
          ? body.error
          : typeof body?.message === 'string'
            ? body.message
            : `Request failed (${res.status})`,
      ) as Error & { response?: { status: number; data: Record<string, unknown> } }
      err.response = { status: res.status, data: body }
      throw err
    }

    return { data: body as T }
  } finally {
    clearTimeout(timeout)
  }
}

const realApiClient = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic defaults preserve axios-like call sites
  get: <T = any>(url: string): Promise<{ data: T }> =>
    request<T>(url, { method: 'GET' }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  post: <T = any>(
    url: string,
    data?: object,
    options?: { timeoutMs?: number },
  ): Promise<{ data: T }> =>
    request<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      timeoutMs: options?.timeoutMs,
    }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  patch: <T = any>(url: string, data?: Record<string, unknown>): Promise<{ data: T }> =>
    request<T>(url, { method: 'PATCH', body: data ? JSON.stringify(data) : undefined }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  put: <T = any>(url: string, data?: Record<string, unknown>): Promise<{ data: T }> =>
    request<T>(url, { method: 'PUT', body: data ? JSON.stringify(data) : undefined }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete: <T = any>(url: string): Promise<{ data: T }> =>
    request<T>(url, { method: 'DELETE' }),
}

export default realApiClient
