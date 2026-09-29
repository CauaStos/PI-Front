import { createApiClient, ApiError } from "./api-client"
import { getValidToken, invalidateToken } from "./auth-token"

// Em produção o front e a API ficam na mesma origem (nginx na 3001, publicado
// pelo Tailscale Serve); em dev o proxy do Vite cobre /api. VITE_API_URL só é
// necessária para apontar para um backend externo.
const BASE =
  (import.meta.env["VITE_API_URL"] as string | undefined) ?? "/api/v1"

let unauthorizedHandler: (() => void) | null = null

/**
 * Registra o que fazer quando o token nao pode ser renovado (sessao
 * revogada). O componente raiz conecta isso ao signOut.
 */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler
}

export const api = createApiClient({
  base: BASE,
  getToken: getValidToken,
  invalidate: invalidateToken,
  onUnauthorized: () => unauthorizedHandler?.(),
})

export { ApiError }
