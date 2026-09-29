import { describe, expect, it } from "vitest"
import { mapAuthError } from "./auth-errors"

describe("mapAuthError", () => {
  it("normaliza email duplicado (409 e codes)", () => {
    expect(
      mapAuthError({ status: 409, message: "User already exists" }, "x")
    ).toMatch(/já está cadastrado/)
    expect(mapAuthError({ code: "EMAIL_ALREADY_REGISTERED" }, "x")).toMatch(
      /já está cadastrado/
    )
    expect(
      mapAuthError({ message: "Email already registered" }, "x")
    ).toMatch(/já está cadastrado/)
  })

  it("traduz credenciais invalidas", () => {
    expect(
      mapAuthError({ message: "Invalid email or password" }, "x")
    ).toBe("Email ou senha incorretos.")
  })

  it("traduz token de reset invalido", () => {
    expect(mapAuthError({ message: "Invalid token" }, "x")).toMatch(
      /Link inválido ou expirado/
    )
    expect(mapAuthError({ message: "Token expired" }, "x")).toMatch(
      /Link inválido ou expirado/
    )
  })

  it("preserva mensagens do back e usa fallback quando vazio", () => {
    expect(mapAuthError({ message: "Mesa ocupada" }, "x")).toBe("Mesa ocupada")
    expect(mapAuthError(null, "falhou")).toBe("falhou")
  })
})
