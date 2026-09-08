import { Navigate, Outlet, useLocation } from "react-router-dom"
import { authClient } from "@/lib/auth-client"

export function AuthGuard() {
  const location = useLocation()
  const { data: session, isPending } = authClient.useSession()
  if (isPending)
    return (
      <main className="grid min-h-screen place-items-center">
        Carregando...
      </main>
    )
  if (!session)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}
