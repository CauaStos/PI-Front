import { AppSidebar } from "@/components/app-sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppRoutes } from "@/src/routes/AppRoutes"
import { BrowserRouter } from "react-router-dom"

export default function App() {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <BrowserRouter>
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
              <AppRoutes />
            </SidebarInset>
          </SidebarProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  )
}
