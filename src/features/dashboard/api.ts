import { api } from "@/lib/api"
import type { ProductCategory } from "@/lib/product-categories"

/** Valores em unidades menores (escala 10^4), formatar com `format` de @/lib/money. */
type Money = number

/** Espelha a resposta de GET /api/v1/dashboard. Dias no formato YYYY-MM-DD (UTC-3). */
export interface DashboardData {
  generatedAt: string
  money: {
    month: string
    today: Money
    last7Days: Money
    monthTotal: Money
    previousMonthTotal: Money
    finishedTabsMonth: number
    averageTicketMonth: Money
    dailyLast30Days: Array<{ date: string; revenue: Money }>
    byCategory: Array<{ category: ProductCategory; revenue: Money; items: number }>
    topProducts: Array<{ name: string; revenue: Money; quantity: number }>
    byEmployee: Array<{ name: string; revenue: Money; orders: number }>
    byHour: Array<{ hour: number; revenue: Money }>
  }
  songs: {
    playedToday: number
    queued: number
    playing: string | null
    requestedMonth: number
    cancelledMonth: number
    averageWaitMinutes: number | null
    playedLast7Days: Array<{ date: string; count: number }>
    topSongs: Array<{ title: string; count: number }>
    topTabs: Array<{ tabName: string; count: number }>
  }
  operations: {
    openTabs: number
    ordersInProgress: number
    averageTabMinutes: number | null
  }
}

export function fetchDashboard(): Promise<DashboardData> {
  return api.get<DashboardData>("/dashboard")
}
