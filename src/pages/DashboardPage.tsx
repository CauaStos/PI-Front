import {
  Ban,
  Hourglass,
  ListMusic,
  Loader2,
  Music,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { RetryState } from "@/components/retry-state"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useBoardChanged } from "@/features/comandas/hooks/useBoardChanged"
import {
  DASHBOARD_RANGES,
  fetchDashboard,
  type DashboardData,
  type DashboardRange,
} from "@/features/dashboard/api"
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

type Section = "faturamento" | "musicas"

const MONTHS = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
]
const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"]
const CHART_HEIGHT = "h-36"

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

function parseRange(raw: string | null): DashboardRange {
  const n = Number(raw)
  return (DASHBOARD_RANGES as readonly number[]).includes(n)
    ? (n as DashboardRange)
    : 7
}

/** "2026-11-22" -> { day: 22, month: "nov", weekday: "dom" } sem fuso. */
function parseDay(date: string) {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number]
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  return { day: d, month: MONTHS[m - 1]!, weekday: WEEKDAYS[weekday]! }
}

function formatMinutes(minutes: number | null) {
  if (minutes === null) return "—"
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h}h ${m}min` : `${h}h`
}

/** "+12% vs 7 dias anteriores" ou texto alternativo quando nao ha base. */
function comparison(current: number, previous: number, days: number) {
  if (previous === 0) return `sem registros nos ${days} dias anteriores`
  const pct = Math.round(((current - previous) / previous) * 100)
  return `${pct >= 0 ? "+" : ""}${pct}% vs ${days} dias anteriores`
}

/** Colunas por dia; rotulos espacados conforme o tamanho da janela. */
function dayColumns(points: Array<{ date: string; value: number }>): Column[] {
  const every = points.length <= 7 ? 1 : points.length <= 14 ? 2 : 5
  return points.map(({ date, value }, i) => {
    const { day, month, weekday } = parseDay(date)
    const axisLabel =
      points.length <= 7
        ? weekday
        : i === points.length - 1 || (points.length - 1 - i) % every === 0
          ? String(day)
          : ""
    return { key: date, axisLabel, tooltipLabel: `${weekday}, ${day} ${month}`, value }
  })
}

function hourColumns(hours: Array<{ hour: number; value: number }>): Column[] {
  return hours.map(({ hour, value }) => ({
    key: String(hour),
    axisLabel: hour % 3 === 0 ? `${hour}h` : "",
    tooltipLabel: `${hour}h–${hour + 1}h`,
    value,
  }))
}

function peakHour(hours: Array<{ hour: number; value: number }>) {
  const peak = hours.reduce((best, h) => (h.value > best.value ? h : best), {
    hour: 0,
    value: 0,
  })
  return peak.value > 0 ? `pico ${peak.hour}h–${peak.hour + 1}h` : "sem registros"
}

export default function DashboardPage() {
  const [params, setParams] = useSearchParams()
  const section: Section = params.get("aba") === "musicas" ? "musicas" : "faturamento"
  const days = parseRange(params.get("dias"))

  const [stats, setStats] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [forbidden, setForbidden] = useState(false)
  const latest = useRef(0)

  const reload = useCallback(async () => {
    const id = ++latest.current
    setLoading(true)
    try {
      const data = await fetchDashboard(days)
      if (id !== latest.current) return
      setStats(data)
      setError(false)
    } catch (cause) {
      if (id !== latest.current) return
      setForbidden(cause instanceof ApiError && cause.status === 403)
      setError(true)
    } finally {
      if (id === latest.current) setLoading(false)
    }
  }, [days])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload()
  }, [reload])

  useBoardChanged(() => {
    void reload()
  })

  function update(key: "aba" | "dias", value: string) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set(key, value)
        return next
      },
      { replace: true }
    )
  }

  if (forbidden) {
    return (
      <main className="grid min-h-svh place-items-center px-5 py-8">
        <section className="max-w-md space-y-3 text-center">
          <h1 className="text-2xl font-bold">Acesso não permitido</h1>
          <p className="text-sm text-muted-foreground">
            O dashboard é restrito a administradores e gerentes.
          </p>
          <Button nativeButton={false} render={<Link to="/comandas" />}>Voltar às comandas</Button>
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
          loading={loading}
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
  const n = stats.days
  const updatedAt = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(stats.generatedAt))

  return (
    <main className="min-h-svh bg-background px-8 py-6 text-foreground max-sm:px-4">
      <Tabs
        value={section}
        onValueChange={(v) => update("aba", String(v))}
        className="mx-auto max-w-290 gap-4"
      >
        <header className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="text-[22px] font-bold tracking-normal">Dashboard</h1>
          <TabsList className="h-8 bg-muted">
            <TabsTrigger value="faturamento" className="px-3 text-xs font-bold">
              Faturamento
            </TabsTrigger>
            <TabsTrigger value="musicas" className="px-3 text-xs font-bold">
              Músicas
            </TabsTrigger>
          </TabsList>
          <div className="ml-auto flex items-center gap-3">
            {loading ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            ) : (
              <span className="text-xs font-medium text-muted-foreground max-sm:hidden">
                Atualizado às {updatedAt}
              </span>
            )}
            <Tabs value={String(days)} onValueChange={(v) => update("dias", String(v))}>
              <TabsList className="h-8 bg-muted" aria-label="Período">
                {DASHBOARD_RANGES.map((r) => (
                  <TabsTrigger key={r} value={String(r)} className="px-2.5 text-xs font-bold">
                    {r} dias
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </header>

        <TabsContent value="faturamento" className="grid gap-3">
          <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
            <StatTile
              icon={TrendingUp}
              label={`Faturamento (${n} dias)`}
              value={formatMoney(money.total)}
              hint={comparison(money.total, money.previousTotal, n)}
            />
            <StatTile
              icon={Wallet}
              label="Faturamento hoje"
              value={formatMoney(money.today)}
              hint={`${operations.openTabs} comandas abertas · ${operations.ordersInProgress} pedidos em preparo`}
            />
            <StatTile
              icon={Receipt}
              label="Ticket médio"
              value={formatMoney(money.averageTicket)}
              hint={`${money.finishedTabs} comandas · permanência ${formatMinutes(operations.averageTabMinutes)}`}
            />
            <StatTile
              icon={Music}
              label={`Músicas tocadas (${n} dias)`}
              value={songs.played}
              hint={`${songs.queued} na fila agora`}
            />
          </div>

          <div className="grid grid-cols-3 gap-3 max-lg:grid-cols-1">
            <div className="col-span-2 max-lg:col-span-1">
              <ChartCard title="Faturamento por dia" subtitle={`Últimos ${n} dias`}>
                <ColumnChart
                  columns={dayColumns(money.daily.map((d) => ({ date: d.date, value: d.revenue })))}
                  ariaLabel={`Faturamento por dia nos últimos ${n} dias`}
                  formatValue={formatMoney}
                  formatAxis={formatMoneyAxis}
                  heightClass={CHART_HEIGHT}
                />
              </ChartCard>
            </div>
            <ChartCard title="Produtos que mais faturam" subtitle="Top 5 (qtd. vendida)">
              <BarList
                ariaLabel="Produtos com maior faturamento"
                wideValue
                formatValue={formatMoney}
                rows={money.topProducts.map((p) => ({
                  key: p.name,
                  label: `${p.name} (${p.quantity})`,
                  value: p.revenue,
                }))}
              />
            </ChartCard>
            <ChartCard title="Por categoria">
              <BarList
                ariaLabel="Faturamento por categoria"
                wideValue
                formatValue={formatMoney}
                rows={money.byCategory
                  .filter((c) => c.revenue > 0)
                  .map((c) => ({
                    key: c.category,
                    label: CATEGORY_LABELS[c.category],
                    value: c.revenue,
                  }))}
              />
            </ChartCard>
            <ChartCard title="Por hora do pedido" subtitle={peakHour(money.byHour)}>
              <ColumnChart
                columns={hourColumns(money.byHour)}
                ariaLabel="Faturamento por hora do pedido"
                formatValue={formatMoney}
                formatAxis={formatMoneyAxis}
                heightClass={CHART_HEIGHT}
              />
            </ChartCard>
            <ChartCard title="Por funcionário">
              <BarList
                ariaLabel="Faturamento por funcionário"
                wideValue
                formatValue={formatMoney}
                rows={money.byEmployee.map((e) => ({
                  key: e.name,
                  label: e.name,
                  value: e.revenue,
                }))}
              />
            </ChartCard>
          </div>
        </TabsContent>

        <TabsContent value="musicas" className="grid gap-3">
          <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
            <StatTile
              icon={Music}
              label={`Tocadas (${n} dias)`}
              value={songs.played}
              hint={comparison(songs.played, songs.previousPlayed, n)}
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
              hint="do pedido até começar a tocar"
            />
            <StatTile
              icon={Ban}
              label="Canceladas"
              value={songs.cancelled}
              hint={`${songs.requested > 0 ? Math.round((songs.cancelled / songs.requested) * 100) : 0}% de ${songs.requested} pedidas`}
            />
          </div>

          <div className="grid grid-cols-3 gap-3 max-lg:grid-cols-1">
            <div className="col-span-2 max-lg:col-span-1">
              <ChartCard title="Tocadas por dia" subtitle={`Últimos ${n} dias · ${songs.playedToday} hoje`}>
                <ColumnChart
                  columns={dayColumns(songs.daily.map((d) => ({ date: d.date, value: d.count })))}
                  unit={["música", "músicas"]}
                  ariaLabel={`Músicas tocadas por dia nos últimos ${n} dias`}
                  heightClass={CHART_HEIGHT}
                />
              </ChartCard>
            </div>
            <ChartCard title="Mais pedidas" subtitle="Top 5">
              <BarList
                ariaLabel="Músicas mais pedidas"
                emptyText="Nenhuma música pedida no período"
                rows={songs.topSongs.map((s) => ({ key: s.title, label: s.title, value: s.count }))}
              />
            </ChartCard>
            <div className="col-span-2 max-lg:col-span-1">
              <ChartCard title="Pedidos por hora" subtitle={peakHour(songs.requestsByHour)}>
                <ColumnChart
                  columns={hourColumns(songs.requestsByHour)}
                  unit={["pedido", "pedidos"]}
                  ariaLabel="Músicas pedidas por hora"
                  heightClass={CHART_HEIGHT}
                />
              </ChartCard>
            </div>
            <ChartCard title="Mesas que mais pedem" subtitle="Top 5">
              <BarList
                ariaLabel="Mesas que mais pediram músicas"
                emptyText="Nenhuma música pedida no período"
                rows={songs.topTabs.map((t) => ({ key: t.tabName, label: t.tabName, value: t.count }))}
              />
            </ChartCard>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  )
}
