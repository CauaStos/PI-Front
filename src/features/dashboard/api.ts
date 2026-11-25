import { api } from "@/lib/api"
import type { ProductCategory } from "@/lib/product-categories"

export const DASHBOARD_RANGES = [7, 14, 30] as const
export type DashboardRange = (typeof DASHBOARD_RANGES)[number]

/** Valores em unidades menores (escala 10^4), formatar com `format` de @/lib/money. */
type Money = number
type Hourly<T> = Array<{ hour: number; value: T }>

/** Espelha a resposta de GET /api/v1/dashboard?days=N. Dias em YYYY-MM-DD (UTC-3). */
export interface DashboardData {
  generatedAt: string
  days: number
  money: {
    total: Money
    previousTotal: Money
    today: Money
    finishedTabs: number
    averageTicket: Money
    daily: Array<{ date: string; revenue: Money }>
    byCategory: Array<{ category: ProductCategory; revenue: Money; items: number }>
    topProducts: Array<{ name: string; revenue: Money; quantity: number }>
    byEmployee: Array<{ name: string; revenue: Money; orders: number }>
    byHour: Hourly<Money>
  }
  songs: {
    played: number
    previousPlayed: number
    playedToday: number
    queued: number
    playing: string | null
    requested: number
    cancelled: number
    averageWaitMinutes: number | null
    daily: Array<{ date: string; count: number }>
    requestsByHour: Hourly<number>
    topSongs: Array<{ title: string; count: number }>
    topTabs: Array<{ tabName: string; count: number }>
  }
  operations: {
    openTabs: number
    ordersInProgress: number
    averageTabMinutes: number | null
  }
}

export function fetchDashboard(days: DashboardRange): Promise<DashboardData> {
  return api.get<DashboardData>(`/dashboard?days=${days}`)
}
