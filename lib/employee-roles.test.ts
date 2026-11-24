import { describe, expect, it } from "vitest"

import {
  canAccessEmployeeManagement,
  canManageSongQueue,
  canViewDashboard,
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

describe("gerenciamento da fila de musicas", () => {
  it("permite ADMIN e papeis operacionais com song.manage", () => {
    expect(canManageSongQueue("ADMIN")).toBe(true)
    expect(canManageSongQueue("admin")).toBe(true)
    expect(canManageSongQueue("OPERADOR")).toBe(true)
    expect(canManageSongQueue("garcom")).toBe(true)
    expect(canManageSongQueue("cozinha")).toBe(true)
  })

  it("restringe GERENTE e CLIENTE apenas a visualizacao", () => {
    expect(canManageSongQueue("GERENTE")).toBe(false)
    expect(canManageSongQueue("CLIENTE")).toBe(false)
  })
})

describe("dashboard", () => {
  it("libera ADMIN e GERENTE, como dashboard.read no backend", () => {
    expect(canViewDashboard("ADMIN")).toBe(true)
    expect(canViewDashboard("admin")).toBe(true)
    expect(canViewDashboard("GERENTE")).toBe(true)
  })

  it("esconde de OPERADOR, CLIENTE e papeis legados operacionais", () => {
    expect(canViewDashboard("OPERADOR")).toBe(false)
    expect(canViewDashboard("CLIENTE")).toBe(false)
    expect(canViewDashboard("garcom")).toBe(false)
    expect(canViewDashboard("cozinha")).toBe(false)
  })
})
