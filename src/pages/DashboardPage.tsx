import {
  Ban,
  Clock,
  Hourglass,
  ListMusic,
  Loader2,
  Music,
  Receipt,
  ReceiptText,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
  Timer,
} from "lucide-react"
import { useEffect, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { RetryState } from "@/components/retry-state"
import { useBoardChanged } from "@/features/comandas/hooks/useBoardChanged"
import { fetchDashboard, type DashboardData } from "@/features/dashboard/api"
import { BarList } from "@/features/dashboard/components/BarList"
import { ChartCard } from "@/features/dashboard/components/ChartCard"
import {
  ColumnChart,
  type Column,
} from "@/features/dashboard/components/ColumnChart"
import { StatTile } from "@/features/dashboard/components/StatTile"
import { ApiError } from "@/lib/api"
import { format as formatMoney, MONEY_SCALE } from "@/lib/money"
import { CATEGORY_LABELS } from "@/lib/product-categories"

const MONTHS = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
]
const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"]

const compactBrl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
})

/** Eixo dos graficos de dinheiro: "R$ 1,2 mil". */
function formatMoneyAxis(minor: number) {
  return compactBrl.format(minor / MONEY_SCALE)
}

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

function formatMinutes(minutes: number | null) {
  if (minutes === null) return "—"
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h}h ${m}min` : `${h}h`
}

function percentChange(current: number, previous: number) {
  if (previous === 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

function dailyRevenueColumns(days: DashboardData["money"]["dailyLast30Days"]): Column[] {
  return days.map(({ date, revenue }, i) => {
    const { day, month } = parseDay(date)
    const showLabel = day === 1 || day % 5 === 0 || i === days.length - 1
    return {
      key: date,
      axisLabel: showLabel ? `${day}` : "",
      tooltipLabel: `${day} ${month}`,
      value: revenue,
    }
  })
}

function hourColumns(hours: DashboardData["money"]["byHour"]): Column[] {
  return hours.map(({ hour, revenue }) => ({
    key: String(hour),
    axisLabel: hour % 3 === 0 ? `${hour}h` : "",
    tooltipLabel: `${hour}h–${hour + 1}h`,
    value: revenue,
  }))
}

function weekColumns(days: DashboardData["songs"]["playedLast7Days"]): Column[] {
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

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="mt-7 first:mt-4">
      <h2 className="mb-3 text-sm font-bold tracking-wide text-muted-foreground uppercase">
        {title}
      </h2>
      {children}
    </section>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardData | null>(null)
  const [error, setError] = useState(false)
  const [forbidden, setForbidden] = useState(false)
  const [retrying, setRetrying] = useState(false)

  async function reload() {
    setRetrying(true)
    try {
      setStats(await fetchDashboard())
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

  if (!stats) {
    return (
      <main className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    )
  }

  const { money, songs, operations } = stats
  const change = percentChange(money.monthTotal, money.previousMonthTotal)
  const peak = money.byHour.reduce(
    (best, h) => (h.revenue > best.revenue ? h : best),
    money.byHour[0] ?? { hour: 0, revenue: 0 }
  )
  const revenue30 = money.dailyLast30Days.reduce((s, d) => s + d.revenue, 0)
  const played7 = songs.playedLast7Days.reduce((s, d) => s + d.count, 0)
  const cancelRate =
    songs.requestedMonth > 0
      ? Math.round((songs.cancelledMonth / songs.requestedMonth) * 100)
      : 0
  const updatedAt = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(stats.generatedAt))

  return (
    <main className="min-h-svh bg-background px-10 py-8 text-foreground max-sm:px-4">
      <div className="mx-auto max-w-290">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-[22px] font-bold tracking-normal">Dashboard</h1>
          <p className="text-xs font-medium text-muted-foreground">
            Atualizado às {updatedAt}
          </p>
        </div>

        <Section title="Dinheiro">
          <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
            <StatTile
              icon={Wallet}
              label="Faturamento hoje"
              value={formatMoney(money.today)}
              hint={`${formatMoney(money.last7Days)} nos últimos 7 dias`}
            />
            <StatTile
              icon={TrendingUp}
              label={`Faturamento de ${monthLabel(money.month)}`}
              value={formatMoney(money.monthTotal)}
              hint={
                change === null
                  ? "sem faturamento no mês anterior"
                  : `${change >= 0 ? "+" : ""}${change}% vs mês anterior (${formatMoney(money.previousMonthTotal)})`
              }
            />
            <StatTile
              icon={Receipt}
              label="Ticket médio"
              value={formatMoney(money.averageTicketMonth)}
              hint={`${money.finishedTabsMonth} comandas finalizadas no mês`}
            />
            <StatTile
              icon={Clock}
              label="Horário de pico"
              value={peak.revenue > 0 ? `${peak.hour}h–${peak.hour + 1}h` : "—"}
              hint={
                peak.revenue > 0
                  ? `${formatMoney(peak.revenue)} faturados nessa hora no mês`
                  : "sem vendas no mês"
              }
            />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3 max-lg:grid-cols-1">
            <div className="col-span-2 max-lg:col-span-1">
              <ChartCard
                title="Faturamento por dia"
                subtitle={`${formatMoney(revenue30)} nos últimos 30 dias`}
              >
                <ColumnChart
                  columns={dailyRevenueColumns(money.dailyLast30Days)}
                  ariaLabel="Faturamento por dia nos últimos 30 dias"
                  formatValue={formatMoney}
                  formatAxis={formatMoneyAxis}
                />
              </ChartCard>
            </div>
            <ChartCard title="Por categoria" subtitle="Faturamento do mês">
              <BarList
                ariaLabel="Faturamento do mês por categoria"
                wideValue
                formatValue={formatMoney}
                rows={money.byCategory.map((c) => ({
                  key: c.category,
                  label: CATEGORY_LABELS[c.category],
                  value: c.revenue,
                }))}
              />
            </ChartCard>
            <ChartCard title="Produtos que mais faturam" subtitle="Top 5 do mês">
              <BarList
                ariaLabel="Produtos com maior faturamento no mês"
                wideValue
                formatValue={formatMoney}
                rows={money.topProducts.map((p) => ({
                  key: p.name,
                  label: `${p.name} (${p.quantity})`,
                  value: p.revenue,
                }))}
              />
            </ChartCard>
            <ChartCard title="Por funcionário" subtitle="Faturamento dos pedidos lançados no mês">
              <BarList
                ariaLabel="Faturamento do mês por funcionário"
                wideValue
                formatValue={formatMoney}
                rows={money.byEmployee.map((e) => ({
                  key: e.name,
                  label: e.name,
                  value: e.revenue,
                }))}
              />
            </ChartCard>
            <ChartCard title="Faturamento por hora" subtitle="Hora do pedido, no mês">
              <ColumnChart
                columns={hourColumns(money.byHour)}
                ariaLabel="Faturamento do mês por hora do pedido"
                formatValue={formatMoney}
                formatAxis={formatMoneyAxis}
              />
            </ChartCard>
          </div>
        </Section>

        <Section title="Músicas">
          <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
            <StatTile
              icon={Music}
              label="Tocadas hoje"
              value={songs.playedToday}
              hint={`${played7} nos últimos 7 dias`}
            />
            <StatTile
              icon={ListMusic}
              label="Na fila agora"
              value={songs.queued}
              hint={songs.playing ? `tocando: ${songs.playing}` : "nada tocando agora"}
            />
            <StatTile
              icon={Hourglass}
              label="Espera média"
              value={formatMinutes(songs.averageWaitMinutes)}
              hint="do pedido até começar a tocar, no mês"
            />
            <StatTile
              icon={Ban}
              label="Canceladas no mês"
              value={songs.cancelledMonth}
              hint={`${cancelRate}% de ${songs.requestedMonth} pedidas`}
            />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3 max-lg:grid-cols-1">
            <ChartCard title="Tocadas por dia" subtitle="Últimos 7 dias">
              <ColumnChart
                columns={weekColumns(songs.playedLast7Days)}
                unit={["música", "músicas"]}
                ariaLabel="Músicas tocadas por dia nos últimos 7 dias"
              />
            </ChartCard>
            <ChartCard title="Mais pedidas" subtitle="Top 5 do mês">
              <BarList
                ariaLabel="Músicas mais pedidas no mês"
                emptyText="Nenhuma música pedida no mês"
                rows={songs.topSongs.map((s) => ({
                  key: s.title,
                  label: s.title,
                  value: s.count,
                }))}
              />
            </ChartCard>
            <ChartCard title="Mesas que mais pedem" subtitle="Top 5 do mês">
              <BarList
                ariaLabel="Mesas que mais pediram músicas no mês"
                emptyText="Nenhuma música pedida no mês"
                rows={songs.topTabs.map((t) => ({
                  key: t.tabName,
                  label: t.tabName,
                  value: t.count,
                }))}
              />
            </ChartCard>
          </div>
        </Section>

        <Section title="Operação agora">
          <div className="grid grid-cols-3 gap-3 max-sm:grid-cols-1">
            <StatTile
              icon={ReceiptText}
              label="Comandas abertas"
              value={operations.openTabs}
              hint="abertas ou em andamento"
            />
            <StatTile
              icon={UtensilsCrossed}
              label="Pedidos em preparo"
              value={operations.ordersInProgress}
              hint="aguardando entrega"
            />
            <StatTile
              icon={Timer}
              label="Permanência média"
              value={formatMinutes(operations.averageTabMinutes)}
              hint="comandas finalizadas no mês"
            />
          </div>
        </Section>
      </div>
    </main>
  )
}
