import {
  ArrowUpRight,
  CircleDollarSign,
  Music2,
  ReceiptText,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const linePoints = [12, 20, 28, 34, 42, 39, 48, 46, 57, 68, 73, 82]

export default function DashboardPage() {
  return (
    <main className="min-h-svh bg-background px-10 py-8 text-foreground max-sm:px-5">
      <div className="mx-auto max-w-290">
        <h1 className="text-[22px] font-bold tracking-normal">Dashboard</h1>

        <div className="mt-4 grid grid-cols-[320px_minmax(0,1fr)] gap-4 max-xl:grid-cols-1">
          <section className="grid gap-4">
            <MetricCard
              icon={CircleDollarSign}
              label="Balanca"
              value="R$ 2347,93"
              trend="30%"
            />
            <MetricCard
              icon={ReceiptText}
              label="Receita"
              value="R$ 1320"
              trend="20%"
            />
            <MetricCard
              icon={Music2}
              label="Musicas cantadas"
              value="82"
              trend="12%"
            />
          </section>

          <Card className="min-h-59 rounded-xl border border-border bg-card text-card-foreground shadow-none ring-0">
            <CardHeader className="pb-0">
              <CardTitle className="text-base font-bold">Vendas</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <LineChart values={linePoints} color="#16a34a" />
            </CardContent>
          </Card>
        </div>

        <div className="mt-4 grid grid-cols-[minmax(0,1fr)_420px] gap-4 max-xl:grid-cols-1">
          <Card className="rounded-xl border border-border bg-card text-card-foreground shadow-none ring-0">
            <CardHeader className="pb-0">
              <CardTitle className="text-base font-bold">
                Servicos e Produtos
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4"></CardContent>
          </Card>

          <Card className="rounded-xl border border-border bg-card text-card-foreground shadow-none ring-0">
            <CardHeader className="pb-0">
              <CardTitle className="text-base font-bold">Pagamentos</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex items-center justify-center py-2">
                <div
                  className="size-40 rounded-full"
                  style={{
                    background:
                      "conic-gradient(#16a34a 0 74%, #f97316 74% 100%)",
                  }}
                >
                  <div className="m-10 size-20 rounded-full bg-white" />
                </div>
              </div>
              <Separator className="my-4" />
              <div className="space-y-2 text-sm font-semibold">
                <div className="flex justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span
                      className="size-3 rounded-full"
                      style={{ backgroundColor: "#16a34a" }}
                    />
                    Concluidos
                  </span>
                  <span>74%</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span
                      className="size-3 rounded-full"
                      style={{ backgroundColor: "#f97316" }}
                    />
                    Pendentes
                  </span>
                  <span>26%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  trend,
}: {
  icon: typeof CircleDollarSign
  label: string
  value: string
  trend: string
}) {
  return (
    <Card className="rounded-xl border border-border bg-card text-card-foreground shadow-none ring-0">
      <CardContent className="flex min-h-26.25 items-center justify-between p-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold text-zinc-500">
            <Icon className="size-4" /> {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
        </div>
        <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300">
          <ArrowUpRight className="size-3" /> {trend}
        </Badge>
      </CardContent>
    </Card>
  )
}

function LineChart({ values, color }: { values: number[]; color: string }) {
  const points = values
    .map(
      (value, index) => `${(index / (values.length - 1)) * 100},${100 - value}`
    )
    .join(" ")

  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: .
    <svg viewBox="0 0 100 100" className="h-44 w-full overflow-visible">
      <line
        x1="0"
        x2="100"
        y1="30"
        y2="30"
        className="stroke-border"
        strokeDasharray="2 2"
      />
      <line
        x1="0"
        x2="100"
        y1="70"
        y2="70"
        className="stroke-border"
        strokeDasharray="2 2"
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
