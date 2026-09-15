import { sum, multiply } from "@/lib/money"
import type {
  ComandaBoardData,
  ComandaOrder,
  OrderStatus,
  TabStatus,
} from "@/data/comanda-board"

export type BoardData = ComandaBoardData
export type UiStatus = OrderStatus | TabStatus
export type Comanda = BoardData["comandas"][number]
export type HistoryComanda = {
  id: string
  number: string
  status: OrderStatus
  openedAt: Date
  closedAt: Date
  orders: number
  ordersList: ComandaOrder[]
  revenue: number
}
export type HistoryRow = {
  dayKey: string
  label: string
  closed: number
  finished: number
  cancelled: number
  orders: number
  revenue: number
  averageTicket: number
  firstClosedAt: Date
  lastClosedAt: Date
  comandas: HistoryComanda[]
}
export type PendingAction =
  | { type: "finalizar-comanda"; comanda: Comanda }
  | { type: "cancelar-comanda"; comanda: Comanda }
  | { type: "remover-pedidos"; orders: ComandaOrder[] }
  | null

export const comandaStatusLabel: Record<UiStatus, string> = {
  open: "Aberta",
  in_progress: "Em Andamento",
  delivered: "Entregue",
  finished: "Finalizada",
  cancelled: "Cancelada",
}

export const orderStatusLabel: Record<UiStatus, string> = {
  open: "Aberto",
  in_progress: "Em Andamento",
  delivered: "Entregue",
  finished: "Concluido",
  cancelled: "Cancelado",
}

export const orderStatusOptions: UiStatus[] = [
  "open",
  "in_progress",
  "delivered",
  "finished",
  "cancelled",
]

export const completedOrderStatuses = new Set<OrderStatus>([
  "delivered",
  "finished",
])
export const cashTimeZone = "America/Sao_Paulo"

export const statusClass: Record<UiStatus, string> = {
  open: "bg-zinc-100 text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-200",
  in_progress: "bg-pink-200 text-pink-900 hover:bg-pink-200",
  delivered: "bg-cyan-200 text-cyan-950 hover:bg-cyan-200",
  finished: "bg-emerald-200 text-emerald-950 hover:bg-emerald-200",
  cancelled: "bg-red-200 text-red-950 hover:bg-red-200",
}

export const comandaHeaderClass: Record<UiStatus, string> = {
  open: "bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-50",
  in_progress: "bg-pink-200 text-pink-950",
  delivered: "bg-cyan-200 text-cyan-950",
  finished: "bg-emerald-200 text-emerald-950",
  cancelled: "bg-red-200 text-red-950",
}

export const avatarTones = [
  "bg-violet-200 text-violet-950",
  "bg-pink-200 text-pink-950",
  "bg-cyan-200 text-cyan-950",
]

export const qrCells = new Set([
  0, 1, 2, 4, 5, 6, 7, 9, 11, 13, 14, 15, 16, 18, 20, 22, 24, 25, 27, 28, 30,
  32, 34, 35, 37, 39, 40, 42, 43, 44, 46, 47, 48,
])

export function canDeleteOrder(order: ComandaOrder) {
  return !completedOrderStatuses.has(order.status)
}

export function canEditOrder(order: ComandaOrder) {
  return order.status === "in_progress"
}

export function canCancelOrder(order: ComandaOrder) {
  return order.status !== "cancelled" && order.status !== "finished"
}

export function billableOrderCount(comanda: Comanda) {
  return comanda.orders.filter((order) => order.status !== "cancelled").length
}

export function isTabActive(comanda: Comanda) {
  return comanda.status !== "finished" && comanda.status !== "cancelled"
}

export function isClosedOnDay(comanda: Comanda, dayKey: string) {
  if (!comanda.closedAt) return false
  return getDayKey(new Date(comanda.closedAt)) === dayKey
}

export function isVisibleInToday(comanda: Comanda, todayKey: string) {
  return isTabActive(comanda) || isClosedOnDay(comanda, todayKey)
}

export function buildHistoryRows(comandas: Comanda[]) {
  const rows = new Map<string, HistoryRow>()

  for (const comanda of comandas) {
    if (
      !comanda.closedAt ||
      (comanda.status !== "finished" && comanda.status !== "cancelled")
    ) {
      continue
    }

    const closedAt = new Date(comanda.closedAt)
    const dayKey = getDayKey(closedAt)
    const current = rows.get(dayKey) ?? {
      dayKey,
      label: formatDayLabel(closedAt),
      closed: 0,
      finished: 0,
      cancelled: 0,
      orders: 0,
      revenue: 0,
      averageTicket: 0,
      firstClosedAt: closedAt,
      lastClosedAt: closedAt,
      comandas: [],
    }

    const revenue =
      comanda.status === "finished" ? calcComandaTotal(comanda) : 0

    current.closed += 1
    current.comandas.push({
      id: comanda.id,
      number: displayComandaNumber(comanda.tableName),
      status: comanda.status,
      openedAt: new Date(comanda.openedAt),
      closedAt,
      orders: comanda.orders.length,
      ordersList: comanda.orders,
      revenue,
    })
    if (closedAt < current.firstClosedAt) current.firstClosedAt = closedAt
    if (closedAt > current.lastClosedAt) current.lastClosedAt = closedAt
    if (comanda.status === "finished") {
      current.finished += 1
      current.orders += comanda.orders.length
      current.revenue += revenue
    } else {
      current.cancelled += 1
    }
    current.averageTicket =
      current.finished > 0 ? Math.round(current.revenue / current.finished) : 0
    rows.set(dayKey, current)
  }

  return Array.from(rows.values())
    .map((row) => ({
      ...row,
      comandas: row.comandas.sort(
        (a, b) => b.closedAt.getTime() - a.closedAt.getTime()
      ),
    }))
    .sort((a, b) => b.dayKey.localeCompare(a.dayKey))
}

export function getActionTitle(action: PendingAction) {
  if (action?.type === "finalizar-comanda") return "Finalizar comanda"
  if (action?.type === "cancelar-comanda") return "Cancelar comanda"
  if (action?.type === "remover-pedidos") return "Remover pedidos"
  return "Confirmar acao"
}

export function getActionDescription(action: PendingAction) {
  if (action?.type === "finalizar-comanda")
    return "Confira a comanda antes de finalizar. Depois disso, ela deixa de aceitar alteracoes."
  if (action?.type === "cancelar-comanda")
    return "Esta acao cancela a comanda selecionada e marca seus pedidos como cancelados."
  if (action?.type === "remover-pedidos")
    return "Esta acao remove os pedidos selecionados. Pedidos entregues ou concluidos nao podem ser removidos."
  return "Confirme para continuar."
}

export function isPendingActionEmpty(action: PendingAction) {
  return action?.type === "remover-pedidos" && action.orders.length === 0
}

export function calcComandaTotal(comanda: Comanda): number {
  return sum(
    comanda.orders
      .filter((o) => o.status !== "cancelled")
      .map((o) => multiply(o.unitPrice, o.quantity))
  )
}

export function nextComandaName(index: number) {
  return `Comanda ${String(index).padStart(2, "0")}`
}

export function displayComandaName(name: string) {
  return name.replace(/^Mesa\s*/i, "Comanda ")
}

export function displayComandaNumber(name: string) {
  return name.replace(/^(Mesa|Comanda)\s*/i, "")
}

export function getDayKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: cashTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)
  const year = parts.find((part) => part.type === "year")?.value ?? "0000"
  const month = parts.find((part) => part.type === "month")?.value ?? "00"
  const day = parts.find((part) => part.type === "day")?.value ?? "00"
  return `${year}-${month}-${day}`
}

export function formatCashDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: cashTimeZone,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)
}

export function formatDayLabel(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: cashTimeZone,
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date)
}

export function formatTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: cashTimeZone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: cashTimeZone,
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  }).format(new Date(date))
}
