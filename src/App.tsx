import { useEffect } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { AppRoutes } from "@/routes/AppRoutes"
import { BrowserRouter } from "react-router-dom"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "sonner"
import { setUnauthorizedHandler } from "@/lib/api"
import { signOutAndClear } from "@/lib/auth"

export default function App() {
  useEffect(() => {
    setUnauthorizedHandler(() => {
      void signOutAndClear()
    })
    return () => setUnauthorizedHandler(null)
  }, [])

  return (
    <ThemeProvider>
      <TooltipProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster richColors position="top-right" />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  )
}
