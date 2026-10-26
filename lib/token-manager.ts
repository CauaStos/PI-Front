export const DEFAULT_SKEW_MS = 30_000

export type TokenFetcher = () => Promise<{ token?: string | null } | null>

export type TokenManager = {
  /** Token atual em memoria (pode estar expirado). */
  peek: () => string | null
  /** Token valido; renova via cookie quando ausente/expirado. */
  getValid: () => Promise<string | null>
  /** Forca renovacao (ignora cache), respeitando dedupe de requisicoes. */
  refresh: () => Promise<string | null>
  /** Limpa o token e invalida renovacoes pendentes (logout/401). */
  invalidate: () => void
  /** Marca quando o token em cache ja venceu (com folga de clock skew). */
  isExpired: (token: string) => boolean
  subscribe: (listener: () => void) => () => void
}

function base64UrlToJson(segment: string): string | null {
  try {
    const base64 = segment
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(segment.length / 4) * 4, "=")
    return atob(base64)
  } catch {
    return null
  }
}

/** Decodifica o payload de um JWT sem verificar assinatura. */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".")
  if (parts.length !== 3) return null
  const json = base64UrlToJson(parts[1] ?? "")
  if (!json) return null
  try {
    const parsed: unknown = JSON.parse(json)
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

/** `exp` (segundos) convertido para epoch em milissegundos, ou null. */
export function getJwtExpiry(token: string): number | null {
  const payload = decodeJwtPayload(token)
  const exp = payload?.["exp"]
  return typeof exp === "number" ? exp * 1000 : null
}

export function isJwtExpired(
  token: string,
  skewMs = DEFAULT_SKEW_MS,
  now = Date.now()
): boolean {
  const expiry = getJwtExpiry(token)
  if (expiry === null) return true
  return expiry - skewMs <= now
}

export function createTokenManager(
  fetcher: TokenFetcher,
  skewMs = DEFAULT_SKEW_MS
): TokenManager {
  let token: string | null = null
  let epoch = 0
  let pending: Promise<string | null> | null = null
  let pendingEpoch = -1
  const listeners = new Set<() => void>()

  function notify() {
    for (const listener of listeners) listener()
  }

  function invalidate() {
    token = null
    epoch += 1
    notify()
  }

  async function refresh(): Promise<string | null> {
    if (pending && pendingEpoch === epoch) return pending
    const startEpoch = epoch
    pendingEpoch = startEpoch
    pending = (async () => {
      try {
        const result = await fetcher()
        // Logout no meio da renovacao: descarta para nao repopular o token.
        if (startEpoch !== epoch) return null
        const next =
          result && typeof result.token === "string" && result.token
            ? result.token
            : null
        token = next
        notify()
        return next
      } catch {
        if (startEpoch === epoch) {
          token = null
          notify()
        }
        return null
      } finally {
        if (pendingEpoch === startEpoch) pending = null
      }
    })()
    return pending
  }

  async function getValid(): Promise<string | null> {
    if (token && !isJwtExpired(token, skewMs)) return token
    return refresh()
  }

  return {
    peek: () => token,
    getValid,
    refresh,
    invalidate,
    isExpired: (value: string) => isJwtExpired(value, skewMs),
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
