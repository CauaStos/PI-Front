import { Navigate, Outlet, useLocation } from "react-router-dom"

import { useAuth } from "@/lib/auth"
import { safeRedirect } from "@/lib/redirect"

/** Bloqueia as telas publicas para quem ja tem sessao. */
export function PublicOnly() {
  const location = useLocation()
  const { session, isPending } = useAuth()

  if (isPending)
    return (
      <main className="grid min-h-screen place-items-center">
        Carregando...
      </main>
    )

  if (session) {
    const from = (location.state as { from?: unknown } | null)?.from
    return <Navigate to={safeRedirect(from)} replace />
  }

  return <Outlet />
}
