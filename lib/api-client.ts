export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

export type ApiClientDeps = {
  base: string
  getToken: () => Promise<string | null>
  invalidate: () => void
  onUnauthorized?: () => void
  fetchImpl?: typeof fetch
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as {
      error?: { message?: string }
      message?: string
    }
    return body.error?.message ?? body.message ?? `HTTP ${response.status}`
  } catch {
    return `HTTP ${response.status}`
  }
}

export function createApiClient({
  base,
  getToken,
  invalidate,
  onUnauthorized,
  fetchImpl = fetch,
}: ApiClientDeps) {
  async function send(
    path: string,
    init: RequestInit | undefined,
    token: string | null
  ): Promise<Response> {
    const headers = new Headers(init?.headers)
    if (!headers.has("Content-Type"))
      headers.set("Content-Type", "application/json")
    if (token) headers.set("Authorization", `Bearer ${token}`)
    else headers.delete("Authorization")
    return fetchImpl(`${base}${path}`, {
      ...init,
      headers,
      credentials: "include",
    })
  }

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    // O body e sempre string nestes helpers, entao pode ser reusado no retry.
    let response = await send(path, init, await getToken())

    if (response.status === 401) {
      // Token expirado/revogado: descarta o stale e tenta renovar via cookie.
      invalidate()
      const renewed = await getToken()
      if (renewed) response = await send(path, init, renewed)
      if (response.status === 401) {
        invalidate()
        onUnauthorized?.()
        throw new ApiError("Sessao expirada. Faca login novamente.", 401)
      }
    }

    if (!response.ok) {
      throw new ApiError(await readErrorMessage(response), response.status)
    }

    if (response.status === 204) return undefined as T
    return (await response.json()) as T
  }

  return {
    get: <T>(path: string) => request<T>(path),
    post: <T>(path: string, body: unknown) =>
      request<T>(path, { method: "POST", body: JSON.stringify(body) }),
    patch: <T>(path: string, body: unknown) =>
      request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
    delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  }
}

export type ApiClient = ReturnType<typeof createApiClient>
