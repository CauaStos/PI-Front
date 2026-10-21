import {
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/api"

type EmployeeRole =
  | "admin"
  | "garcom"
  | "cozinha"
  | "ADMIN"
  | "GERENTE"
  | "OPERADOR"
  | "CLIENTE"

type Employee = {
  id: string
  name: string
  email: string
  role: EmployeeRole
  avatar: string
  createdAt?: string
}

type EmployeeForm = {
  name: string
  email: string
  role: EmployeeRole
  avatar: string
  password: string
}

const roleOptions: { value: EmployeeRole; label: string }[] = [
  { value: "ADMIN", label: "Administrador" },
  { value: "GERENTE", label: "Gerente" },
  { value: "OPERADOR", label: "Operador" },
  { value: "CLIENTE", label: "Cliente" },
  { value: "garcom", label: "Garçom (legado)" },
  { value: "cozinha", label: "Cozinha (legado)" },
]

function isAdminRole(role: EmployeeRole) {
  return role === "admin" || role === "ADMIN"
}

function roleLabel(role: EmployeeRole) {
  return (
    roleOptions.find((option) => option.value === role)?.label ??
    (role === "admin" ? "Administrador" : role)
  )
}

function emptyForm(): EmployeeForm {
  return {
    name: "",
    email: "",
    role: "OPERADOR",
    avatar: "",
    password: "",
  }
}

export default function FuncionariosPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [form, setForm] = useState<EmployeeForm>(emptyForm)

  const isAdmin = currentEmployee ? isAdminRole(currentEmployee.role) : false
  const isManager = currentEmployee?.role === "GERENTE"
  const canManage = isAdmin || isManager

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR")
    if (!query) return employees
    return employees.filter(
      (employee) =>
        employee.name.toLocaleLowerCase("pt-BR").includes(query) ||
        employee.email.toLocaleLowerCase("pt-BR").includes(query) ||
        roleLabel(employee.role).toLocaleLowerCase("pt-BR").includes(query)
    )
  }, [employees, search])

  async function loadEmployees() {
    const [me, list] = await Promise.all([
      api.get<Employee>("/employees/me"),
      api.get<Employee[]>("/employees"),
    ])
    setCurrentEmployee(me)
    setEmployees(list)
    setError("")
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [me, list] = await Promise.all([
          api.get<Employee>("/employees/me"),
          api.get<Employee[]>("/employees"),
        ])
        if (cancelled) return
        setCurrentEmployee(me)
        setEmployees(list)
      } catch (cause) {
        if (!cancelled) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Não foi possível carregar os funcionários."
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm())
    setDialogOpen(true)
  }

  function openEdit(employee: Employee) {
    setEditing(employee)
    setForm({
      name: employee.name,
      email: employee.email,
      role: employee.role,
      avatar: employee.avatar,
      password: "",
    })
    setDialogOpen(true)
  }

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.name.trim()) {
      toast.error("Informe o nome do funcionário.")
      return
    }

    if (!editing && !form.password) {
      toast.error("Informe uma senha para o novo funcionário.")
      return
    }
    if (!editing && form.password.length < 8) {
      toast.error("A senha deve ter pelo menos 8 caracteres.")
      return
    }

    setSaving(true)
    try {
      if (editing) {
        const employeePath =
          isAdmin || !isManager ? `/employees/${editing.id}` : "/employees/me"
        await api.patch(employeePath, {
          name: form.name.trim(),
          ...(isAdmin ? { email: form.email.trim(), role: form.role } : {}),
          avatar: form.avatar.trim(),
        })
        toast.success("Funcionário atualizado.")
      } else {
        await api.post("/employees", {
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          avatar: form.avatar.trim() || undefined,
          password: form.password,
        })
        toast.success("Funcionário cadastrado.")
      }
      await loadEmployees()
      setDialogOpen(false)
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : "Não foi possível salvar o funcionário."
      )
    } finally {
      setSaving(false)
    }
  }

  async function deleteEmployee(employee: Employee) {
    if (employee.id === currentEmployee?.id) {
      toast.error("Você não pode remover sua própria conta.")
      return
    }
    if (!window.confirm(`Excluir o funcionário ${employee.name}?`)) return

    setSaving(true)
    try {
      await api.delete(`/employees/${employee.id}`)
      await loadEmployees()
      toast.success("Funcionário removido.")
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : "Não foi possível remover o funcionário."
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="grid min-h-svh place-items-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    )
  }

  if (error || !canManage) {
    return (
      <main className="min-h-svh px-5 py-8 text-zinc-950 sm:px-10 dark:text-zinc-50">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-bold">Funcionários</h1>
          <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            {error ||
              "Seu perfil não tem permissão para administrar funcionários."}
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-svh bg-white px-5 py-8 text-zinc-950 sm:px-10 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto max-w-6xl">
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-violet-700 dark:text-violet-300">
              <Users className="size-4" />
              Equipe
            </p>
            <h1 className="text-2xl font-bold tracking-tight">
              Funcionários
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Cadastre, consulte e atualize os acessos da equipe.
            </p>
          </div>
          {isAdmin ? (
            <Button
              className="bg-purple-300 text-purple-950 hover:bg-purple-400"
              onClick={openCreate}
              disabled={saving}
            >
              <Plus className="size-4" />
              Novo funcionário
            </Button>
          ) : null}
        </header>

        <Card className="rounded-2xl shadow-none">
          <CardContent className="p-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
              <div>
                <p className="font-semibold">Equipe cadastrada</p>
                <p className="text-sm text-muted-foreground">
                  {employees.length}{" "}
                  {employees.length === 1 ? "funcionário" : "funcionários"}
                </p>
              </div>
              <label className="relative block w-full sm:max-w-xs">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por nome, email ou papel"
                  aria-label="Buscar funcionário"
                  className="h-9 pl-9"
                />
              </label>
            </div>

            {filteredEmployees.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">
                {employees.length
                  ? "Nenhum funcionário encontrado para essa busca."
                  : "Ainda não há funcionários cadastrados."}
              </div>
            ) : (
              <>
                <div className="divide-y md:hidden">
                  {filteredEmployees.map((employee) => (
                    <EmployeeCard
                      key={employee.id}
                      employee={employee}
                      isCurrent={employee.id === currentEmployee?.id}
                      canEdit={
                        isAdmin ||
                        (isManager && employee.id === currentEmployee?.id)
                      }
                      canDelete={isAdmin}
                      disabled={saving}
                      onEdit={openEdit}
                      onDelete={deleteEmployee}
                    />
                  ))}
                </div>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-50 text-xs text-zinc-500 dark:bg-zinc-900">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Funcionário</th>
                        <th className="px-5 py-3 font-semibold">Papel</th>
                        <th className="px-5 py-3 text-right font-semibold">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredEmployees.map((employee) => (
                        <tr key={employee.id}>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <EmployeeAvatar employee={employee} />
                              <div className="min-w-0">
                                <p className="truncate font-semibold">
                                  {employee.name}
                                  {employee.id === currentEmployee?.id ? (
                                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                                      Você
                                    </span>
                                  ) : null}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                  {employee.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <RoleBadge role={employee.role} />
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              {isAdmin ||
                              (isManager &&
                                employee.id === currentEmployee?.id) ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEdit(employee)}
                                  disabled={saving}
                                >
                                  <Pencil className="size-3.5" />
                                  Editar
                                </Button>
                              ) : null}
                              {isAdmin ? (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => void deleteEmployee(employee)}
                                  disabled={
                                    saving ||
                                    employee.id === currentEmployee?.id
                                  }
                                  aria-label={`Excluir ${employee.name}`}
                                >
                                  <Trash2 className="size-3.5" />
                                  Excluir
                                </Button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar funcionário" : "Cadastrar funcionário"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Atualize os dados do funcionário."
                : "O funcionário poderá entrar com o email e a senha cadastrados."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitForm} className="space-y-4">
            <FormField label="Nome">
              <Input
                autoComplete="name"
                required
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
              />
            </FormField>
            <FormField label="Email">
              <Input
                type="email"
                autoComplete="email"
                required
                disabled={Boolean(editing && !isAdmin)}
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
              />
            </FormField>
            {editing && isAdmin ? (
              <FormField label="Papel">
                <select
                  value={form.role}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      role: event.target.value as EmployeeRole,
                    })
                  }
                  className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                  {form.role === "admin" ? (
                    <option value="admin">Administrador (legado)</option>
                  ) : null}
                </select>
              </FormField>
            ) : !editing && isAdmin ? (
              <FormField label="Papel">
                <select
                  value={form.role}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      role: event.target.value as EmployeeRole,
                    })
                  }
                  className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FormField>
            ) : null}
            <FormField label="Avatar (URL ou texto)">
              <Input
                value={form.avatar}
                onChange={(event) =>
                  setForm({ ...form, avatar: event.target.value })
                }
                placeholder="Opcional"
              />
            </FormField>
            {!editing ? (
              <FormField label="Senha (mínimo de 8 caracteres)">
                <Input
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={form.password}
                  onChange={(event) =>
                    setForm({ ...form, password: event.target.value })
                  }
                />
              </FormField>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                {editing ? "Salvar alterações" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  )
}

function FormField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-1.5 text-sm font-medium">
      {label}
      {children}
    </label>
  )
}

function EmployeeAvatar({ employee }: { employee: Employee }) {
  const initials = employee.name.trim().charAt(0).toUpperCase() || "?"
  return (
    <Avatar className="size-10 bg-violet-200 text-violet-950">
      {employee.avatar.startsWith("http") ? (
        <AvatarImage
          src={employee.avatar}
          alt=""
        />
      ) : null}
      <AvatarFallback className="bg-violet-200 font-bold text-violet-950">
        {employee.avatar && !employee.avatar.startsWith("http")
          ? employee.avatar
          : initials}
      </AvatarFallback>
    </Avatar>
  )
}

function RoleBadge({ role }: { role: EmployeeRole }) {
  return (
    <Badge variant="secondary" className="font-medium">
      {roleLabel(role)}
    </Badge>
  )
}

function EmployeeCard({
  employee,
  isCurrent,
  canEdit,
  canDelete,
  disabled,
  onEdit,
  onDelete,
}: {
  employee: Employee
  isCurrent: boolean
  canEdit: boolean
  canDelete: boolean
  disabled: boolean
  onEdit: (employee: Employee) => void
  onDelete: (employee: Employee) => void
}) {
  return (
    <div className="flex items-center gap-3 p-4">
      <EmployeeAvatar employee={employee} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">
          {employee.name}
          {isCurrent ? (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              Você
            </span>
          ) : null}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {employee.email}
        </p>
        <div className="mt-1">
          <RoleBadge role={employee.role} />
        </div>
      </div>
      {canEdit ? (
        <Button
          variant="outline"
          size="icon"
          onClick={() => onEdit(employee)}
          disabled={disabled}
          aria-label={`Editar ${employee.name}`}
        >
          <Pencil className="size-4" />
        </Button>
      ) : null}
      {canDelete ? (
        <Button
          variant="destructive"
          size="icon"
          onClick={() => onDelete(employee)}
          disabled={disabled || isCurrent}
          aria-label={`Excluir ${employee.name}`}
        >
          <Trash2 className="size-4" />
        </Button>
      ) : null}
    </div>
  )
}
