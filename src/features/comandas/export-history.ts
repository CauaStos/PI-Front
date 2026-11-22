import type { Cell, Row, Sheet } from "write-excel-file/browser"
import { MONEY_SCALE, multiply } from "@/lib/money"
import {
  type HistoryRow,
  cashTimeZone,
  comandaStatusLabel,
  formatTime,
  getDayKey,
  orderStatusLabel,
} from "./shared"

const CURRENCY_FORMAT = "R$ #,##0.00"
const INTEGER_FORMAT = "#,##0"

function toReais(minor: number): number {
  return Number((minor / MONEY_SCALE).toFixed(2))
}

function formatDateOnly(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: cashTimeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}

function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: cashTimeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

function headerCell(
  value: string,
  align: "left" | "right" = "left"
): Cell {
  return {
    value,
    type: String,
    fontWeight: "bold",
    backgroundColor: "#F4F4F5",
    bottomBorderStyle: "thin",
    bottomBorderColor: "#D4D4D8",
    align,
  }
}

function textCell(value: string): Cell {
  return {
    value,
    type: String,
    align: "left",
  }
}

function integerCell(value: number): Cell {
  return {
    value,
    type: Number,
    format: INTEGER_FORMAT,
    align: "right",
  }
}

function currencyCell(minor: number): Cell {
  return {
    value: toReais(minor),
    type: Number,
    format: CURRENCY_FORMAT,
    align: "right",
  }
}

export function buildHistoryExportFileName(referenceDate = new Date()): string {
  return `historico-comandas-${getDayKey(referenceDate)}.xlsx`
}

export function buildHistoryExportSheets(rows: HistoryRow[]): Sheet<Blob>[] {
  const dailyData: Row[] = [
    [
      headerCell("Data"),
      headerCell("Dia"),
      headerCell("Encerradas", "right"),
      headerCell("Finalizadas", "right"),
      headerCell("Canceladas", "right"),
      headerCell("Pedidos", "right"),
      headerCell("Período"),
      headerCell("Ticket Médio", "right"),
      headerCell("Receita", "right"),
    ],
  ]

  const comandasData: Row[] = [
    [
      headerCell("Data"),
      headerCell("ID Comanda"),
      headerCell("Comanda"),
      headerCell("Status"),
      headerCell("Abertura"),
      headerCell("Fechamento"),
      headerCell("Pedidos", "right"),
      headerCell("Total", "right"),
    ],
  ]

  const ordersData: Row[] = [
    [
      headerCell("Data"),
      headerCell("Comanda"),
      headerCell("Status Comanda"),
      headerCell("ID Pedido"),
      headerCell("Produto"),
      headerCell("Funcionário"),
      headerCell("Status Pedido"),
      headerCell("Pedido Em"),
      headerCell("Entregue Em"),
      headerCell("Quantidade", "right"),
      headerCell("Preço Unitário", "right"),
      headerCell("Subtotal", "right"),
    ],
  ]

  for (const row of rows) {
    const dayDate = formatDateOnly(row.firstClosedAt)

    dailyData.push([
      textCell(dayDate),
      textCell(row.label),
      integerCell(row.closed),
      integerCell(row.finished),
      integerCell(row.cancelled),
      integerCell(row.orders),
      textCell(
        `${formatTime(row.firstClosedAt)} - ${formatTime(row.lastClosedAt)}`
      ),
      currencyCell(row.averageTicket),
      currencyCell(row.revenue),
    ])

    for (const comanda of row.comandas) {
      const comandaStatus = comandaStatusLabel[comanda.status]

      comandasData.push([
        textCell(dayDate),
        textCell(comanda.id),
        textCell(comanda.number),
        textCell(comandaStatus),
        textCell(formatDateTime(comanda.openedAt)),
        textCell(formatDateTime(comanda.closedAt)),
        integerCell(comanda.orders),
        currencyCell(comanda.revenue),
      ])

      for (const order of comanda.ordersList) {
        ordersData.push([
          textCell(dayDate),
          textCell(comanda.number),
          textCell(comandaStatus),
          textCell(order.id),
          textCell(order.productName),
          textCell(order.employeeName),
          textCell(orderStatusLabel[order.status]),
          textCell(formatDateTime(order.orderedAt)),
          textCell(order.deliveredAt ? formatDateTime(order.deliveredAt) : ""),
          integerCell(order.quantity),
          currencyCell(order.unitPrice),
          currencyCell(multiply(order.unitPrice, order.quantity)),
        ])
      }
    }
  }

  return [
    {
      sheet: "Resumo Diário",
      columns: [
        { width: 14 },
        { width: 24 },
        { width: 14 },
        { width: 14 },
        { width: 14 },
        { width: 12 },
        { width: 18 },
        { width: 18 },
        { width: 18 },
      ],
      data: dailyData,
    },
    {
      sheet: "Comandas",
      columns: [
        { width: 14 },
        { width: 26 },
        { width: 16 },
        { width: 16 },
        { width: 20 },
        { width: 20 },
        { width: 12 },
        { width: 18 },
      ],
      data: comandasData,
    },
    {
      sheet: "Pedidos",
      columns: [
        { width: 14 },
        { width: 16 },
        { width: 18 },
        { width: 26 },
        { width: 28 },
        { width: 24 },
        { width: 18 },
        { width: 20 },
        { width: 20 },
        { width: 14 },
        { width: 18 },
        { width: 18 },
      ],
      data: ordersData,
    },
  ]
}

export async function exportHistoryToExcel(
  rows: HistoryRow[],
  referenceDate = new Date()
): Promise<void> {
  const { default: writeXlsxFile } = await import("write-excel-file/browser")
  const sheets = buildHistoryExportSheets(rows)
  const fileName = buildHistoryExportFileName(referenceDate)
  await writeXlsxFile(sheets).toFile(fileName)
}
