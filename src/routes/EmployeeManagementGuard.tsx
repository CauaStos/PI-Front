import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { Link, Outlet } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import {
  canAccessEmployeeManagement,
  type Employee,
} from "@/lib/employee-roles"

export function EmployeeManagementGuard() {
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    api
      .get<Employee>("/employees/me")
      .then((profile) => {
        if (!cancelled) setEmployee(profile)
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Não foi possível verificar seu acesso."
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <main className="grid min-h-svh place-items-center">
        <Loader2
          className="size-6 animate-spin text-muted-foreground"
          aria-label="Verificando acesso"
        />
      </main>
    )
  }

  if (error || !employee || !canAccessEmployeeManagement(employee.role)) {
    return (
      <main className="grid min-h-svh place-items-center px-5 py-8">
        <section className="max-w-md space-y-3 text-center">
          <h1 className="text-2xl font-bold">Acesso não permitido</h1>
          <p className="text-sm text-muted-foreground">
            {error ||
              "Seu papel atual não permite acessar a administração de funcionários."}
          </p>
          <Button render={<Link to="/comandas" />}>Voltar às comandas</Button>
        </section>
      </main>
    )
  }

  return <Outlet />
}
