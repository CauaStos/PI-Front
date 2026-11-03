import { describe, expect, it } from "vitest"
import type { Comanda, ComandaOrder } from "@pi/contracts"
import {
  billableOrderCount,
  buildHistoryRows,
  calcComandaTotal,
  canCancelOrder,
  canDeleteOrder,
  canEditOrder,
  displayComandaName,
  getDayKey,
  isClosedOnDay,
  isTabActive,
  isVisibleInToday,
  nextComandaName,
  sortComandasForBoard,
} from "./shared"

type ComandaOverride = Partial<Comanda> & { tableName?: string; status?: Comanda["status"] }

function mkOrder(overrides: Partial<ComandaOrder> = {}): ComandaOrder {
  return {
    id: "o1",
    status: "in_progress",
    unitPrice: 249_000,
    quantity: 2,
    ...overrides,
  } as unknown as ComandaOrder
}

function mkComanda(overrides: ComandaOverride = {}): Comanda {
  return {
    id: "c1",
    tableName: "Mesa 01",
    status: "in_progress",
    openedAt: "2026-09-23T18:00:00Z",
    closedAt: null,
    orders: [],
    ...overrides,
  } as unknown as Comanda
}

describe("calcComandaTotal", () => {
  it("soma pedidos e ignora cancelados", () => {
    const comanda = mkComanda({
      orders: [
        mkOrder({ unitPrice: 249_000, quantity: 2 }),
        mkOrder({ id: "o2", unitPrice: 1_000, quantity: 1 }),
        mkOrder({ id: "o3", unitPrice: 999_999, quantity: 5, status: "cancelled" }),
      ],
    })
    expect(calcComandaTotal(comanda)).toBe(499_000)
  })

  it("comanda sem pedidos vale zero", () => {
    expect(calcComandaTotal(mkComanda())).toBe(0)
  })
})

describe("regras de status", () => {
  it("comanda ativa nao esta finalizada nem cancelada", () => {
    expect(isTabActive(mkComanda({ status: "open" }))).toBe(true)
    expect(isTabActive(mkComanda({ status: "in_progress" }))).toBe(true)
    expect(isTabActive(mkComanda({ status: "finished" }))).toBe(false)
    expect(isTabActive(mkComanda({ status: "cancelled" }))).toBe(false)
  })

  it("so pedido em andamento pode ser editado", () => {
    expect(canEditOrder(mkOrder({ status: "in_progress" }))).toBe(true)
    expect(canEditOrder(mkOrder({ status: "delivered" }))).toBe(false)
    expect(canEditOrder(mkOrder({ status: "cancelled" }))).toBe(false)
  })

  it("cancelar bloqueia cancelado e concluido", () => {
    expect(canCancelOrder(mkOrder({ status: "in_progress" }))).toBe(true)
    expect(canCancelOrder(mkOrder({ status: "cancelled" }))).toBe(false)
    expect(canCancelOrder(mkOrder({ status: "finished" }))).toBe(false)
  })

  it("remover bloqueia entregue e concluido", () => {
    expect(canDeleteOrder(mkOrder({ status: "in_progress" }))).toBe(true)
    expect(canDeleteOrder(mkOrder({ status: "delivered" }))).toBe(false)
    expect(canDeleteOrder(mkOrder({ status: "finished" }))).toBe(false)
  })

  it("billableOrderCount ignora cancelados", () => {
    const comanda = mkComanda({
      orders: [
        mkOrder(),
        mkOrder({ id: "o2", status: "cancelled" }),
        mkOrder({ id: "o3" }),
      ],
    })
    expect(billableOrderCount(comanda)).toBe(2)
  })
})

describe("nomes", () => {
  it("nextComandaName preenche com zero", () => {
    expect(nextComandaName(1)).toBe("Comanda 01")
    expect(nextComandaName(42)).toBe("Comanda 42")
  })

  it("displayComandaName troca Mesa por Comanda", () => {
    expect(displayComandaName("Mesa 5")).toBe("Comanda 5")
    expect(displayComandaName("Comanda 5")).toBe("Comanda 5")
  })
})

describe("dia de caixa (America/Sao_Paulo)", () => {
  it("getDayKey usa o fuso de Sao Paulo", () => {
    expect(getDayKey(new Date("2026-09-23T23:30:00Z"))).toBe("2026-09-23")
    expect(getDayKey(new Date("2026-09-24T01:30:00Z"))).toBe("2026-09-23")
  })

  it("isClosedOnDay so fecha no mesmo dia", () => {
    const comanda = mkComanda({ closedAt: "2026-09-23T18:00:00Z" })
    expect(isClosedOnDay(comanda, "2026-09-23")).toBe(true)
    expect(isClosedOnDay(comanda, "2026-09-22")).toBe(false)
    expect(isClosedOnDay(mkComanda(), "2026-09-23")).toBe(false)
  })

  it("isVisibleInToday mantem ativas e as fechadas no dia", () => {
    const finished = mkComanda({
      status: "finished",
      closedAt: "2026-09-23T18:00:00Z",
    })
    const finishedYesterday = mkComanda({
      status: "finished",
      closedAt: "2026-09-22T18:00:00Z",
    })
    expect(isVisibleInToday(finished, "2026-09-23")).toBe(true)
    expect(isVisibleInToday(finishedYesterday, "2026-09-23")).toBe(false)
    expect(isVisibleInToday(mkComanda(), "2026-09-23")).toBe(true)
  })
})

describe("ordenação da lista de comandas", () => {
 it("mantem ativas primeiro, finalizadas depois e canceladas por ultimo", () => {
   const comandas = [
     mkComanda({
       id: "cancelled",
       status: "cancelled",
       openedAt: "2026-09-23T10:00:00Z",
       closedAt: "2026-09-23T12:00:00Z",
     }),
     mkComanda({
       id: "finished",
       status: "finished",
       openedAt: "2026-09-23T09:00:00Z",
       closedAt: "2026-09-23T11:00:00Z",
     }),
     mkComanda({
       id: "open",
       status: "open",
       openedAt: "2026-09-23T08:00:00Z",
     }),
   ]

   expect(sortComandasForBoard(comandas).map((comanda) => comanda.id)).toEqual([
     "open",
     "finished",
     "cancelled",
   ])
 })

 it("usa a data e depois o id como desempate", () => {
   const comandas = [
     mkComanda({ id: "b", status: "open", openedAt: "2026-09-23T10:00:00Z" }),
     mkComanda({ id: "a", status: "open", openedAt: "2026-09-23T10:00:00Z" }),
     mkComanda({ id: "c", status: "open", openedAt: "2026-09-23T09:00:00Z" }),
   ]

   expect(sortComandasForBoard(comandas).map((comanda) => comanda.id)).toEqual([
     "c",
     "a",
     "b",
   ])
 })
})

describe("buildHistoryRows", () => {
  it("agrega por dia: finalizada conta receita, cancelada nao", () => {
    const rows = buildHistoryRows([
      mkComanda({
        id: "f1",
        status: "finished",
        closedAt: "2026-09-23T20:00:00Z",
        orders: [mkOrder({ unitPrice: 249_000, quantity: 2 })],
      }),
      mkComanda({
        id: "x1",
        tableName: "Mesa 02",
        status: "cancelled",
        closedAt: "2026-09-23T21:00:00Z",
        orders: [mkOrder()],
      }),
      mkComanda({ status: "in_progress" }),
    ])

    expect(rows).toHaveLength(1)
    const row = rows[0]!
    expect(row.dayKey).toBe("2026-09-23")
    expect(row.closed).toBe(2)
    expect(row.finished).toBe(1)
    expect(row.cancelled).toBe(1)
    expect(row.revenue).toBe(498_000)
    expect(row.averageTicket).toBe(498_000)
    expect(row.comandas).toHaveLength(2)
  })
})
