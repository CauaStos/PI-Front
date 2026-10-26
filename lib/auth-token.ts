import { authClient } from "./auth-client"
import { createTokenManager } from "./token-manager"

// O JWT fica apenas em memoria. O cookie de sessao (httpOnly) e quem
// sobrevive ao reload e serve para renovar o access token sob demanda.
const manager = createTokenManager(async () => {
  const result = (await authClient.token()) as {
    data?: { token?: string } | null
    error?: { message?: string } | null
  }
  if (result.error || !result.data?.token) {
    throw new Error(result.error?.message ?? "Nao foi possivel obter o token.")
  }
  return { token: result.data.token }
})

export const getValidToken = () => manager.getValid()
export const refreshToken = () => manager.refresh()
export const invalidateToken = () => manager.invalidate()
export const getTokenSnapshot = () => manager.peek()
export const subscribeToken = (listener: () => void) =>
  manager.subscribe(listener)
export const isTokenExpired = (token: string) => manager.isExpired(token)
