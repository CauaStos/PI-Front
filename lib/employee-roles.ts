export type EmployeeRole =
  | "admin"
  | "garcom"
  | "cozinha"
  | "ADMIN"
  | "GERENTE"
  | "OPERADOR"
  | "CLIENTE"

export type Employee = {
  id: string
  name: string
  email: string
  role: EmployeeRole
  avatar: string
  createdAt?: string
}

/** Converte papeis antigos (admin/garcom/cozinha) para o equivalente atual. */
export function normalizeEmployeeRole(role: EmployeeRole): EmployeeRole {
  if (role === "admin") return "ADMIN"
  if (role === "garcom" || role === "cozinha") return "OPERADOR"
  return role
}

export function isAdminEmployeeRole(role: string) {
  return role === "admin" || role === "ADMIN"
}

export function canAccessEmployeeManagement(role: string) {
  return isAdminEmployeeRole(role) || role === "GERENTE"
}

/** Espelha a permissao `dashboard.read` do backend (ADMIN e GERENTE). */
export function canViewDashboard(role: string) {
  return isAdminEmployeeRole(role) || role === "GERENTE"
}

export function canManageSongQueue(role: string) {
  return (
    isAdminEmployeeRole(role) ||
    role === "OPERADOR" ||
    role === "garcom" ||
    role === "cozinha"
  )
}
