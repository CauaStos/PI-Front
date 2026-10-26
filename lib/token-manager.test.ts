import { describe, expect, it, vi } from "vitest"
import {
  createTokenManager,
  decodeJwtPayload,
  getJwtExpiry,
  isJwtExpired,
} from "./token-manager"

function encodeSegment(value: unknown): string {
  return btoa(JSON.stringify(value))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

function makeJwt(payload: Record<string, unknown>): string {
  return `${encodeSegment({ alg: "none" })}.${encodeSegment(payload)}.signature`
}

const nowSeconds = () => Math.floor(Date.now() / 1000)

describe("jwt helpers", () => {
  it("decodifica o payload sem validar assinatura", () => {
    const token = makeJwt({ sub: "u1", exp: 123 })
    expect(decodeJwtPayload(token)).toMatchObject({ sub: "u1", exp: 123 })
  })

  it("devolve null para token malformado", () => {
    expect(decodeJwtPayload("nao-e-jwt")).toBeNull()
    expect(decodeJwtPayload("a.@@@.c")).toBeNull()
  })

  it("getJwtExpiry converte exp para milissegundos", () => {
    expect(getJwtExpiry(makeJwt({ exp: 1000 }))).toBe(1_000_000)
    expect(getJwtExpiry(makeJwt({ sub: "x" }))).toBeNull()
  })

  it("isJwtExpired respeita a folga de clock skew", () => {
    const future = makeJwt({ exp: nowSeconds() + 600 })
    const soon = makeJwt({ exp: nowSeconds() + 10 })
    const past = makeJwt({ exp: nowSeconds() - 10 })
    expect(isJwtExpired(future, 30_000)).toBe(false)
    expect(isJwtExpired(soon, 30_000)).toBe(true)
    expect(isJwtExpired(past, 30_000)).toBe(true)
    expect(isJwtExpired("invalido")).toBe(true)
  })
})

describe("createTokenManager", () => {
  it("reusa token em cache enquanto valido, sem chamar o fetcher", async () => {
    const token = makeJwt({ exp: nowSeconds() + 600 })
    const fetcher = vi.fn().mockResolvedValue({ token })
    const manager = createTokenManager(fetcher)

    expect(await manager.getValid()).toBe(token)
    expect(await manager.getValid()).toBe(token)
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(manager.peek()).toBe(token)
  })

  it("renova quando o token esta expirado", async () => {
    const expired = makeJwt({ exp: nowSeconds() - 5 })
    const fresh = makeJwt({ exp: nowSeconds() + 600 })
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({ token: expired })
      .mockResolvedValueOnce({ token: fresh })
    const manager = createTokenManager(fetcher)

    expect(await manager.getValid()).toBe(expired)
    expect(await manager.getValid()).toBe(fresh)
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it("deduplica renovacoes concorrentes", async () => {
    const token = makeJwt({ exp: nowSeconds() + 600 })
    let resolve!: (value: { token: string }) => void
    const fetcher = vi.fn(
      () => new Promise<{ token: string }>((r) => (resolve = r))
    )
    const manager = createTokenManager(fetcher)

    const a = manager.getValid()
    const b = manager.getValid()
    resolve({ token })
    expect(await a).toBe(token)
    expect(await b).toBe(token)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it("invalidate durante renovacao impede repopular o token", async () => {
    const token = makeJwt({ exp: nowSeconds() + 600 })
    let resolve!: (value: { token: string }) => void
    const fetcher = vi.fn(
      () => new Promise<{ token: string }>((r) => (resolve = r))
    )
    const manager = createTokenManager(fetcher)

    const pending = manager.getValid()
    manager.invalidate()
    resolve({ token })

    expect(await pending).toBeNull()
    expect(manager.peek()).toBeNull()
  })

  it("falha do fetcher devolve null e nao guarda token", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("sem sessao"))
    const manager = createTokenManager(fetcher)

    expect(await manager.getValid()).toBeNull()
    expect(manager.peek()).toBeNull()
  })

  it("invalidate limpa o token cacheado", async () => {
    const token = makeJwt({ exp: nowSeconds() + 600 })
    const manager = createTokenManager(vi.fn().mockResolvedValue({ token }))

    await manager.getValid()
    manager.invalidate()
    expect(manager.peek()).toBeNull()
  })

  it("notifica assinantes ao guardar e ao invalidar", async () => {
    const token = makeJwt({ exp: nowSeconds() + 600 })
    const manager = createTokenManager(vi.fn().mockResolvedValue({ token }))
    const listener = vi.fn()
    const unsubscribe = manager.subscribe(listener)

    await manager.getValid()
    manager.invalidate()
    expect(listener).toHaveBeenCalledTimes(2)

    unsubscribe()
    manager.invalidate()
    expect(listener).toHaveBeenCalledTimes(2)
  })
})
