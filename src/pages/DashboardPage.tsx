import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { fetchBoard } from "@/features/comandas/api/board"
import { useBoardChanged } from "@/features/comandas/hooks/useBoardChanged"
import { CashPanel } from "@/features/comandas/components/CashPanel"
import { HistoryTable } from "@/features/comandas/components/HistoryTable"
import {
  buildHistoryRows,
  calcComandaTotal,
  formatCashDate,
  getDayKey,
  isClosedOnDay,
} from "@/features/comandas/shared"
import type { BoardData } from "@pi/contracts"

export default function DashboardPage() {
  const [board, setBoard] = useState<BoardData | null>(null)
  const [error, setError] = useState(false)

  async function reload() {
    try {
      setBoard(await fetchBoard())
    } catch {
      setError(true)
    }
  }

  useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  void reload()
}, [])

  useBoardChanged(() => {
    void reload()
  })

  if (error) {
    return (
      <main className="flex min-h-svh items-center justify-center">
        <p className="text-sm text-muted-foreground">Erro ao carregar dados.</p>
      </main>
    )
  }

  if (!board) {
    return (
      <main className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    )
  }

  const now = new Date()
  const todayKey = getDayKey(now)
  const finishedToday = board.comandas.filter(
    (c) => c.status === "finished" && isClosedOnDay(c, todayKey)
  )
  const cashRevenue = finishedToday.reduce((s, c) => s + calcComandaTotal(c), 0)
  const cashOrders = finishedToday.reduce((s, c) => s + c.orders.length, 0)
  const activeComandas = board.comandas.filter(
    (c) => c.status !== "finished" && c.status !== "cancelled"
  ).length
  const historyRows = buildHistoryRows(board.comandas)

  return (
    <main className="min-h-svh bg-background px-10 py-8 text-foreground max-sm:px-5">
      <div className="mx-auto max-w-290">
        <h1 className="text-[22px] font-bold tracking-normal">Dashboard</h1>
        <div className="mt-4 grid grid-cols-[320px_minmax(0,1fr)] gap-4 max-xl:grid-cols-1">
          <CashPanel
            cashDate={formatCashDate(now)}
            totalRevenue={cashRevenue}
            totalOrders={cashOrders}
            activeComandas={activeComandas}
          />
          <Card className="border-0 py-0 shadow-none ring-0">
            <CardContent className="p-0">
              <HistoryTable rows={historyRows} />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
