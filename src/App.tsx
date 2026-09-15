import { ThemeProvider } from "@/components/theme-provider"
import { AppRoutes } from "@/routes/AppRoutes"
import { BrowserRouter } from "react-router-dom"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "sonner"

export default function App() {
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
