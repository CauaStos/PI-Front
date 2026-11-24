import { api } from "@/lib/api"
import type { ProductCategory } from "@/lib/product-categories"

export interface DailyCount {
  /** Dia local (UTC-3), YYYY-MM-DD. */
  date: string
  count: number
}

/** Espelha a resposta de GET /api/v1/dashboard. */
export interface DashboardData {
  generatedAt: string
  activeUsers: { count: number; total: number }
  monthlySignups: {
    month: string
    count: number
    previousMonth: number
    daily: DailyCount[]
  }
  pendingRecords: { total: number; orders: number; tabs: number; songs: number }
  byCategory: Array<{
    category: ProductCategory
    products: number
    itemsSold: number
  }>
  ordersLast7Days: DailyCount[]
}

export function fetchDashboard(): Promise<DashboardData> {
  return api.get<DashboardData>("/dashboard")
}
