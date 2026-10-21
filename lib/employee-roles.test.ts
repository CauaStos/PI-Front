import { describe, expect, it } from "vitest"

import {
  canAccessEmployeeManagement,
  isAdminEmployeeRole,
} from "./employee-roles"

describe("acesso a administracao de funcionarios", () => {
  it("permite ADMIN e GERENTE", () => {
    expect(canAccessEmployeeManagement("ADMIN")).toBe(true)
    expect(canAccessEmployeeManagement("admin")).toBe(true)
    expect(canAccessEmployeeManagement("GERENTE")).toBe(true)
  })

  it("nao permite OPERADOR nem CLIENTE", () => {
    expect(canAccessEmployeeManagement("OPERADOR")).toBe(false)
    expect(canAccessEmployeeManagement("garcom")).toBe(false)
    expect(canAccessEmployeeManagement("cozinha")).toBe(false)
    expect(canAccessEmployeeManagement("CLIENTE")).toBe(false)
  })

  it("identifica apenas os valores de administrador", () => {
    expect(isAdminEmployeeRole("ADMIN")).toBe(true)
    expect(isAdminEmployeeRole("admin")).toBe(true)
    expect(isAdminEmployeeRole("GERENTE")).toBe(false)
  })
})
