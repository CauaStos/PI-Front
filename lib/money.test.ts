import { describe, expect, it } from "vitest"
import { format, isValidMoney, multiply, parseInput, sum, toMinor } from "./money"

describe("money (contracts)", () => {
  it("parseInput aceita virgula e ponto decimal", () => {
    expect(parseInput("24,90")).toBe(249_000)
    expect(parseInput("24.90")).toBe(249_000)
    expect(parseInput("24")).toBe(240_000)
    expect(parseInput(" 24,90 ")).toBe(249_000)
  })

  it("parseInput devolve NaN para lixo", () => {
    expect(parseInput("abc")).toBeNaN()
    expect(parseInput("")).toBeNaN()
  })

  it("format exibe em reais", () => {
    expect(format(249_000)).toContain("24,90")
    expect(format(0)).toContain("0,00")
  })

  it("toMinor converte reais para unidades menores", () => {
    expect(toMinor(24.9)).toBe(249_000)
    expect(toMinor(0.1)).toBe(1_000)
  })

  it("multiply e sum operam em inteiros sem drift", () => {
    expect(multiply(249_000, 3)).toBe(747_000)
    expect(sum([249_000, 747_000, 1_000])).toBe(997_000)
  })

  it("isValidMoney so aceita inteiro >= 0", () => {
    expect(isValidMoney(249_000)).toBe(true)
    expect(isValidMoney(0)).toBe(true)
    expect(isValidMoney(-1)).toBe(false)
    expect(isValidMoney(24.9)).toBe(false)
    expect(isValidMoney("249000")).toBe(false)
  })
})
