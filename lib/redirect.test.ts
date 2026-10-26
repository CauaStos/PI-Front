import { describe, expect, it } from "vitest"
import { safeRedirect } from "./redirect"

describe("safeRedirect", () => {
  it("mantem caminhos internos", () => {
    expect(safeRedirect("/comandas")).toBe("/comandas")
    expect(safeRedirect("/produtos?tab=1")).toBe("/produtos?tab=1")
  })

  it("usa fallback para valores invalidos", () => {
    expect(safeRedirect(undefined)).toBe("/comandas")
    expect(safeRedirect(null)).toBe("/comandas")
    expect(safeRedirect("")).toBe("/comandas")
    expect(safeRedirect("https://evil.test")).toBe("/comandas")
    expect(safeRedirect("//evil.test")).toBe("/comandas")
  })

  it("nunca devolve para telas publicas de auth", () => {
    expect(safeRedirect("/login")).toBe("/comandas")
    expect(safeRedirect("/login?x=1")).toBe("/comandas")
    expect(safeRedirect("/cadastro")).toBe("/comandas")
    expect(safeRedirect("/redefinir-senha?token=abc")).toBe("/comandas")
    expect(safeRedirect("/comandas", "/dashboard")).toBe("/comandas")
  })
})
