import {
  ClipboardList,
  Loader2,
  PackageSearch,
  UserPlus,
  Users,
} from "lucide-react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RetryState } from "@/components/retry-state"
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
import { fetchDashboard, type DashboardData } from "@/features/dashboard/api"
import { BarList } from "@/features/dashboard/components/BarList"
import { ChartCard } from "@/features/dashboard/components/ChartCard"
import {
  ColumnChart,
  type Column,
} from "@/features/dashboard/components/ColumnChart"
import { StatTile } from "@/features/dashboard/components/StatTile"
import { ApiError } from "@/lib/api"
import { CATEGORY_LABELS } from "@/lib/product-categories"
import type { BoardData } from "@pi/contracts"

const MONTHS = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
]
const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"]

/** "2026-11-22" -> { day: 22, month: "nov", weekday: "dom" } sem fuso. */
function parseDay(date: string) {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number]
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  return { day: d, month: MONTHS[m - 1]!, weekday: WEEKDAYS[weekday]! }
}

function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number) as [number, number]
  return `${MONTHS[m - 1]} ${y}`
}

function signupColumns(daily: DashboardData["monthlySignups"]["daily"]): Column[] {
  return daily.map(({ date, count }, i) => {
    const { day, month } = parseDay(date)
    const showLabel = day === 1 || day % 5 === 0 || i === daily.length - 1
    return {
      key: date,
      axisLabel: showLabel ? String(day) : "",
      tooltipLabel: `${day} ${month}`,
      value: count,
    }
  })
}

function weekColumns(days: DashboardData["ordersLast7Days"]): Column[] {
  return days.map(({ date, count }) => {
    const { day, month, weekday } = parseDay(date)
    return {
      key: date,
      axisLabel: weekday,
      tooltipLabel: `${weekday}, ${day} ${month}`,
      value: count,
    }
  })
}

export default function DashboardPage() {
  const [board, setBoard] = useState<BoardData | null>(null)
  const [stats, setStats] = useState<DashboardData | null>(null)
  const [error, setError] = useState(false)
  const [forbidden, setForbidden] = useState(false)
  const [retrying, setRetrying] = useState(false)

  async function reload() {
    setRetrying(true)
    try {
      const [nextBoard, nextStats] = await Promise.all([
        fetchBoard(),
        fetchDashboard(),
      ])
      setBoard(nextBoard)
      setStats(nextStats)
      setError(false)
    } catch (cause) {
      setForbidden(cause instanceof ApiError && cause.status === 403)
      setError(true)
    } finally {
      setRetrying(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload()
  }, [])

  useBoardChanged(() => {
    void reload()
  })

  if (forbidden) {
    return (
      <main className="grid min-h-svh place-items-center px-5 py-8">
        <section className="max-w-md space-y-3 text-center">
          <h1 className="text-2xl font-bold">Acesso não permitido</h1>
          <p className="text-sm text-muted-foreground">
            O dashboard é restrito a administradores e gerentes.
          </p>
          <Button render={<Link to="/comandas" />}>Voltar às comandas</Button>
        </section>
      </main>
    )
  }

  if (error && !stats) {
    return (
      <main className="flex min-h-svh items-center justify-center px-5">
        <RetryState
          message="Não foi possível carregar o dashboard."
          onRetry={() => void reload()}
          loading={retrying}
        />
      </main>
    )
  }

  if (!board || !stats) {
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

  const { activeUsers, monthlySignups, pendingRecords, byCategory } = stats
  const totalProducts = byCategory.reduce((s, c) => s + c.products, 0)
  const totalSold = byCategory.reduce((s, c) => s + c.itemsSold, 0)
  const ordersThisWeek = stats.ordersLast7Days.reduce((s, d) => s + d.count, 0)
  const updatedAt = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(stats.generatedAt))

  return (
    <main className="min-h-svh bg-background px-10 py-8 text-foreground max-sm:px-5">
      <div className="mx-auto max-w-290">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-[22px] font-bold tracking-normal">Dashboard</h1>
          <p className="text-xs font-medium text-muted-foreground">
            Atualizado as {updatedAt}
          </p>
        </div>

        <section
          aria-label="Indicadores"
          className="mt-4 grid grid-cols-4 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1"
        >
          <StatTile
            icon={Users}
            label="Usuarios ativos"
            value={activeUsers.count}
            hint={`com sessao aberta, de ${activeUsers.total} funcionarios`}
          />
          <StatTile
            icon={UserPlus}
            label="Cadastros do mes"
            value={monthlySignups.count}
            hint={`${monthlySignups.previousMonth} no mes anterior`}
          />
          <StatTile
            icon={ClipboardList}
            label="Registros pendentes"
            value={pendingRecords.total}
            hint="pedidos, comandas e musicas"
          />
          <StatTile
            icon={PackageSearch}
            label="Produtos cadastrados"
            value={totalProducts}
            hint={`em ${byCategory.filter((c) => c.products > 0).length} categorias`}
          />
        </section>

        <section
          aria-label="Graficos"
          className="mt-3 grid grid-cols-3 gap-3 max-lg:grid-cols-1"
        >
          <div className="col-span-2 max-lg:col-span-1">
            <ChartCard
              title="Cadastros do mes"
              subtitle={`Novos funcionarios por dia, ${monthLabel(monthlySignups.month)}`}
            >
              <ColumnChart
                columns={signupColumns(monthlySignups.daily)}
                unit={["cadastro", "cadastros"]}
                ariaLabel="Cadastros de funcionarios por dia no mes corrente"
              />
            </ChartCard>
          </div>
          <ChartCard
            title="Registros pendentes"
            subtitle={`${pendingRecords.total} aguardando atendimento`}
          >
            <BarList
              ariaLabel="Registros pendentes por tipo"
              rows={[
                { key: "orders", label: "Pedidos", value: pendingRecords.orders },
                { key: "tabs", label: "Comandas", value: pendingRecords.tabs },
                { key: "songs", label: "Musicas", value: pendingRecords.songs },
              ]}
            />
          </ChartCard>
          <ChartCard
            title="Produtos por categoria"
            subtitle={`${totalProducts} no cardapio`}
          >
            <BarList
              ariaLabel="Quantidade de produtos por categoria"
              rows={byCategory.map((c) => ({
                key: c.category,
                label: CATEGORY_LABELS[c.category],
                value: c.products,
              }))}
            />
          </ChartCard>
          <ChartCard
            title="Itens vendidos por categoria"
            subtitle={`${totalSold} itens pedidos, exceto cancelados`}
          >
            <BarList
              ariaLabel="Itens vendidos por categoria"
              rows={byCategory.map((c) => ({
                key: c.category,
                label: CATEGORY_LABELS[c.category],
                value: c.itemsSold,
              }))}
            />
          </ChartCard>
          <ChartCard
            title="Pedidos nos ultimos 7 dias"
            subtitle={`${ordersThisWeek} pedidos na semana`}
          >
            <ColumnChart
              columns={weekColumns(stats.ordersLast7Days)}
              unit={["pedido", "pedidos"]}
              ariaLabel="Pedidos por dia nos ultimos 7 dias"
            />
          </ChartCard>
        </section>

        <div className="mt-8 grid grid-cols-[320px_minmax(0,1fr)] gap-4 max-xl:grid-cols-1">
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
