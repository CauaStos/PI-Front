import { describe, expect, it, vi } from "vitest"
import { ApiError, createApiClient } from "./api-client"

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

function makeClient(overrides: {
  getToken: () => Promise<string | null>
  fetchImpl: typeof fetch
  invalidate?: () => void
  onUnauthorized?: () => void
}) {
  return createApiClient({
    base: "http://api.test/api/v1",
    getToken: overrides.getToken,
    invalidate: overrides.invalidate ?? (() => {}),
    onUnauthorized: overrides.onUnauthorized,
    fetchImpl: overrides.fetchImpl,
  })
}

describe("createApiClient", () => {
  it("envia Authorization Bearer e credenciais", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ ok: true }))
    const api = makeClient({
      getToken: async () => "tok-1",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })

    await api.get("/tabs")

    const [url, init] = fetchImpl.mock.calls[0]!
    expect(url).toBe("http://api.test/api/v1/tabs")
    const headers = new Headers(init.headers)
    expect(headers.get("Authorization")).toBe("Bearer tok-1")
    expect(init.credentials).toBe("include")
  })

  it("nao envia Authorization sem token", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ ok: true }))
    const api = makeClient({
      getToken: async () => null,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })

    await api.get("/tabs")

    const headers = new Headers(fetchImpl.mock.calls[0]![1].headers)
    expect(headers.get("Authorization")).toBeNull()
  })

  it("em 401 limpa o token e repete uma vez com token novo", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: { message: "expirado" } }, 401))
      .mockResolvedValueOnce(jsonResponse({ comandas: [] }))
    const getToken = vi.fn().mockResolvedValue("fresh")
    const invalidate = vi.fn()
    const api = makeClient({
      getToken,
      invalidate,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })

    await expect(api.get("/tabs")).resolves.toEqual({ comandas: [] })
    expect(fetchImpl).toHaveBeenCalledTimes(2)
    expect(invalidate).toHaveBeenCalledTimes(1)
    expect(new Headers(fetchImpl.mock.calls[1]![1].headers).get("Authorization")).toBe(
      "Bearer fresh"
    )
  })

  it("preserva o body ao repetir POST apos 401", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({}, 401))
      .mockResolvedValueOnce(jsonResponse({ id: "c1" }))
    const api = makeClient({
      getToken: async () => "tok",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })

    await api.post("/tabs", { tableName: "Mesa 1" })

    expect(fetchImpl.mock.calls[1]![1].body).toBe(
      JSON.stringify({ tableName: "Mesa 1" })
    )
  })

  it("apos 401 repetido, dispara unauthorized e lanca ApiError", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, 401))
    const invalidate = vi.fn()
    const onUnauthorized = vi.fn()
    const api = makeClient({
      getToken: async () => "tok",
      invalidate,
      onUnauthorized,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })

    await expect(api.get("/tabs")).rejects.toBeInstanceOf(ApiError)
    expect(fetchImpl).toHaveBeenCalledTimes(2)
    expect(invalidate).toHaveBeenCalledTimes(2)
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })

  it("nao repete quando a renovacao falha", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, 401))
    const onUnauthorized = vi.fn()
    const api = makeClient({
      getToken: vi.fn().mockResolvedValueOnce("stale").mockResolvedValue(null),
      invalidate: vi.fn(),
      onUnauthorized,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })

    await expect(api.get("/tabs")).rejects.toMatchObject({ status: 401 })
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })

  it("propaga a mensagem de erro do back em status diferente de 401", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(jsonResponse({ error: { message: "Mesa ocupada" } }, 409))
    const api = makeClient({
      getToken: async () => "tok",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })

    await expect(api.post("/tabs", {})).rejects.toMatchObject({
      status: 409,
      message: "Mesa ocupada",
    })
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it("204 devolve undefined sem tentar parsear JSON", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    const api = makeClient({
      getToken: async () => "tok",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })

    await expect(api.delete("/orders/o1")).resolves.toBeUndefined()
  })
})
