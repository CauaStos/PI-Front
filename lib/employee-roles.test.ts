import { describe, expect, it } from "vitest"

import {
  canAccessEmployeeManagement,
  canManageSongQueue,
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
