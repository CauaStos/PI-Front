import { describe, expect, it } from "vitest"
import {
  MIN_PASSWORD_LENGTH,
  isValidEmail,
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  validateRegistration,
  validateReset,
} from "./validation"

describe("validacao de email", () => {
  it("aceita emails validos", () => {
    expect(isValidEmail("garcom@onstage.com")).toBe(true)
    expect(isValidEmail("  a.b+c@x.co  ")).toBe(true)
  })

  it("rejeita emails invalidos", () => {
    expect(isValidEmail("sem-arroba")).toBe(false)
    expect(isValidEmail("a@b")).toBe(false)
    expect(isValidEmail("")).toBe(false)
    expect(validateEmail("")).toMatch(/Informe o email/)
    expect(validateEmail("x")).toMatch(/email válido/)
  })
})

describe("validacao de senha", () => {
  it("exige o tamanho minimo", () => {
    expect(MIN_PASSWORD_LENGTH).toBe(8)
    expect(validatePassword("curta")).toMatch(/8 caracteres/)
    expect(validatePassword("12345678")).toBeNull()
    expect(validatePassword("")).toMatch(/Informe a senha/)
  })

  it("confirma que as senhas coincidem", () => {
    expect(validatePasswordConfirmation("12345678", "")).toMatch(/Confirme/)
    expect(validatePasswordConfirmation("12345678", "87654321")).toMatch(
      /não coincidem/
    )
    expect(validatePasswordConfirmation("12345678", "12345678")).toBeNull()
  })
})

describe("validateRegistration", () => {
  const base = {
    name: "Ana",
    email: "ana@onstage.com",
    password: "12345678",
    confirmation: "12345678",
  }

  it("aceita cadastro valido", () => {
    expect(validateRegistration(base)).toBeNull()
  })

  it("barra nome vazio, email invalido e senha fraca", () => {
    expect(validateRegistration({ ...base, name: "  " })).toMatch(/Informe o nome/)
    expect(validateRegistration({ ...base, email: "x" })).toMatch(/email válido/)
    expect(validateRegistration({ ...base, password: "123" })).toMatch(
      /8 caracteres/
    )
    expect(validateRegistration({ ...base, confirmation: "outra" })).toMatch(
      /não coincidem/
    )
  })
})

describe("validateReset", () => {
  it("exige token", () => {
    expect(
      validateReset({ password: "12345678", confirmation: "12345678", token: null })
    ).toMatch(/Link de redefinicao/)
  })

  it("valida senha e confirmacao quando ha token", () => {
    expect(
      validateReset({
        password: "12345678",
        confirmation: "12345678",
        token: "abc",
      })
    ).toBeNull()
    expect(
      validateReset({ password: "123", confirmation: "123", token: "abc" })
    ).toMatch(/8 caracteres/)
  })
})
