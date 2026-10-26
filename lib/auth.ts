import { useCallback, useEffect, useSyncExternalStore } from "react"

import { authClient } from "./auth-client"
import {
  getTokenSnapshot,
  getValidToken,
  invalidateToken,
  subscribeToken,
} from "./auth-token"

export { mapAuthError } from "./auth-errors"

/**
 * Encerra a sessao e limpa o JWT em memoria. Invalida antes do signOut para
 * que qualquer renovacao pendente seja descartada em vez de repopular o token.
 */
export async function signOutAndClear(): Promise<void> {
  invalidateToken()
  try {
    await authClient.signOut()
  } catch {
    // Rede fora do ar nao deve impedir o logout local.
  }
  invalidateToken()
}

/** Sessao (via cookie) + access token (JWT em memoria) em um so hook. */
export function useAuth() {
  const { data: session, isPending, refetch } = authClient.useSession()
  const token = useSyncExternalStore(subscribeToken, getTokenSnapshot, () => null)
  const userId = session?.user?.id ?? null

  useEffect(() => {
    if (!userId) {
      invalidateToken()
      return
    }
    void getValidToken()
  }, [userId])

  const logout = useCallback(() => signOutAndClear(), [])

  return {
    session,
    user: session?.user ?? null,
    token,
    isPending,
    logout,
    refetch,
  }
}
