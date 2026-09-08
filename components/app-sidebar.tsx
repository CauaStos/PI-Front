import { ThemeToggle } from "@/components/theme-toggle"
import {
  Mic2,
  Music,
  PackageSearch,
  ReceiptText,
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"

import { authClient } from "@/lib/auth-client"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"

const navItems = [
  { label: "Comandas", href: "/comandas", icon: ReceiptText },
  { label: "Produtos", href: "/produtos", icon: PackageSearch },
  { label: "Musicas", href: "/musicas", icon: Music },
]

export function AppSidebar() {
  const { pathname } = useLocation()
  const { data: session } = authClient.useSession()
  const user = session?.user
  const initials = user?.name?.trim().charAt(0).toUpperCase() || "U"

  return (
    <Sidebar
      className="border-r-0 bg-white dark:bg-zinc-950"
      collapsible="icon"
    >
      <SidebarHeader className="px-4 py-5">
        <div className="flex items-center gap-2 px-1">
          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-zinc-950 text-white">
            <Mic2 className="size-4" />
          </span>
          <span className="text-xl font-bold tracking-normal group-data-[collapsible=icon]:hidden">
            OnStage
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon
                const active =
                  pathname === item.href ||
                  (item.href === "/comandas" && pathname === "/")

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<NavLink to={item.href} />}
                      isActive={active}
                      tooltip={item.label}
                      className="h-11 rounded-lg text-sm font-bold data-active:bg-zinc-100 data-active:text-zinc-950 dark:data-active:bg-zinc-800 dark:data-active:text-zinc-50"
                    >
                      <Icon className="size-5 stroke-[2.2]" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator className="mx-3" />
      </SidebarContent>
      <SidebarFooter className="p-3">
        <div className="mb-2 group-data-[collapsible=icon]:hidden">
          <ThemeToggle />
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:shadow-none dark:border-zinc-800 dark:bg-zinc-900">
          <Avatar size="sm" className="bg-violet-200 text-violet-950">
            <AvatarFallback className="bg-violet-200 text-xs font-bold text-violet-950">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-bold">
              {user?.name ?? "Funcionario"}
            </p>
            <p className="truncate text-xs font-medium text-zinc-500">
              {user?.email ?? ""}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
          onClick={() => void authClient.signOut()}
        >
          Sair
        </button>
      </SidebarFooter>
    </Sidebar>
  )
}
