import { describe, expect, it } from "vitest"
import writeXlsxFile, { type Cell, type CellObject } from "write-excel-file/browser"
import type { Comanda, ComandaOrder } from "@pi/contracts"
import {
  buildHistoryExportFileName,
  buildHistoryExportSheets,
} from "./export-history"
import { buildHistoryRows } from "./shared"

function cellValue(cell: Cell) {
  if (cell && typeof cell === "object" && "value" in cell) {
    return (cell as CellObject).value
  }
  return cell
}

function mkOrder(overrides: Partial<ComandaOrder> = {}): ComandaOrder {
  return {
    id: "ord-1",
    tab: "tab-1",
    product: "prod-1",
    productName: "Cerveja IPA",
    unitPrice: 185_000, // R$ 18,50
    employee: "emp-1",
    employeeName: "Ana Silva",
    employeeAvatar: "AS",
    quantity: 2,
    status: "delivered",
    orderedAt: "2026-09-23T21:15:00Z",
    deliveredAt: "2026-09-23T21:25:00Z",
    ...overrides,
  }
}

function mkComanda(overrides: Partial<Comanda> = {}): Comanda {
  return {
    id: "tab-1",
    tableName: "Mesa 01",
    status: "finished",
    members: [],
    orders: [],
    openedAt: "2026-09-23T21:00:00Z",
    closedAt: "2026-09-23T23:00:00Z",
    ...overrides,
  }
}

describe("export-history", () => {
  it("gera nome de arquivo com a data no fuso de Sao Paulo", () => {
    expect(
      buildHistoryExportFileName(new Date("2026-09-24T01:30:00Z"))
    ).toBe("historico-comandas-2026-09-23.xlsx")
  })

  it("monta as tres abas com todos os dados de resumo, comandas e pedidos", () => {
    const rows = buildHistoryRows([
      mkComanda({
        id: "tab-1",
        tableName: "Comanda 01",
        status: "finished",
        openedAt: "2026-09-23T21:00:00Z",
        closedAt: "2026-09-23T23:00:00Z",
        orders: [
          mkOrder({
            id: "ord-1",
            productName: "Cerveja IPA",
            unitPrice: 185_000,
            quantity: 2,
            status: "delivered",
          }),
          mkOrder({
            id: "ord-2",
            productName: "Porção de Batata",
            employeeName: "Carlos Souza",
            unitPrice: 320_000,
            quantity: 1,
            status: "cancelled",
            deliveredAt: null,
          }),
        ],
      }),
      mkComanda({
        id: "tab-2",
        tableName: "Comanda 02",
        status: "cancelled",
        openedAt: "2026-09-23T22:00:00Z",
        closedAt: "2026-09-23T23:30:00Z",
        orders: [],
      }),
    ])

    const sheets = buildHistoryExportSheets(rows)
    expect(sheets.map((s) => s.sheet)).toEqual([
      "Resumo Diário",
      "Comandas",
      "Pedidos",
    ])

    // Resumo Diário: header + 1 day
    const daily = sheets[0]!.data
    expect(daily).toHaveLength(2)
    expect(daily[1]!.map(cellValue)).toEqual([
      "23/09/2026",
      rows[0]!.label,
      2, // encerradas
      1, // finalizadas
      1, // canceladas
      2, // pedidos da finalizada
      "20:00 - 20:30",
      37, // ticket médio: R$ 37,00
      37, // receita: R$ 37,00
    ])

    // Comandas: header + 2 comandas (sorted by closedAt desc)
    const comandasSheet = sheets[1]!.data
    expect(comandasSheet).toHaveLength(3)
    expect(comandasSheet[1]!.map(cellValue)).toEqual([
      "23/09/2026",
      "tab-2",
      "02",
      "Cancelada",
      "23/09/2026, 19:00",
      "23/09/2026, 20:30",
      0,
      0,
    ])
    expect(comandasSheet[2]!.map(cellValue)).toEqual([
      "23/09/2026",
      "tab-1",
      "01",
      "Finalizada",
      "23/09/2026, 18:00",
      "23/09/2026, 20:00",
      2,
      37,
    ])

    // Pedidos: header + 2 orders
    const ordersSheet = sheets[2]!.data
    expect(ordersSheet).toHaveLength(3)
    expect(ordersSheet[1]!.map(cellValue)).toEqual([
      "23/09/2026",
      "01",
      "Finalizada",
      "ord-1",
      "Cerveja IPA",
      "Ana Silva",
      "Entregue",
      "23/09/2026, 18:15",
      "23/09/2026, 18:25",
      2,
      18.5,
      37,
    ])
    expect(ordersSheet[2]!.map(cellValue)).toEqual([
      "23/09/2026",
      "01",
      "Finalizada",
      "ord-2",
      "Porção de Batata",
      "Carlos Souza",
      "Cancelado",
      "23/09/2026, 18:15",
      "",
      1,
      32,
      32,
    ])
  })

  it("gera um arquivo XLSX valido (ZIP) inclusive quando nao ha pedidos", async () => {
    const rows = buildHistoryRows([
      mkComanda({
        id: "tab-empty",
        status: "cancelled",
        orders: [],
      }),
    ])

    const sheets = buildHistoryExportSheets(rows)
    const blob = await writeXlsxFile(sheets).toBlob()
    const bytes = new Uint8Array(await blob.arrayBuffer())

    expect(bytes.length).toBeGreaterThan(100)
    // Assinatura magica ZIP/XLSX: "PK\x03\x04"
    expect(bytes[0]).toBe(0x50)
    expect(bytes[1]).toBe(0x4b)
    expect(bytes[2]).toBe(0x03)
    expect(bytes[3]).toBe(0x04)
  })
})
