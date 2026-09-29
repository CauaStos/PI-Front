import { Navigate, Outlet, useLocation } from "react-router-dom"

import { AppSidebar } from "@/components/app-sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useAuth } from "@/lib/auth"

export function AuthGuard() {
  const location = useLocation()
  const { session, isPending } = useAuth()

  if (isPending)
    return (
      <main className="grid min-h-screen place-items-center">
        Carregando...
      </main>
    )

  if (!session)
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    )

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-white dark:bg-zinc-950">
        <div className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-white px-4 md:hidden dark:border-zinc-800 dark:bg-zinc-950">
          <SidebarTrigger />
          <span className="text-base font-bold">OnStage</span>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  )
}
