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

export function isAdminEmployeeRole(role: string) {
  return role === "admin" || role === "ADMIN"
}

export function canAccessEmployeeManagement(role: string) {
  return isAdminEmployeeRole(role) || role === "GERENTE"
}
