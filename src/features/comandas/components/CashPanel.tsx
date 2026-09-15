import { format as formatMoney, parseInput, multiply, sum } from "@/lib/money"
import { Calendar, CircleDollarSign, Clock3, ReceiptText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function CashPanel({
  cashDate,
  totalRevenue,
  totalOrders,
  activeComandas,
}: {
  cashDate: string
  totalRevenue: number
  totalOrders: number
  activeComandas: number
}) {
  return (
    <Card className="h-fit self-start border-0 bg-transparent py-0 shadow-none ring-0">
      <CardHeader className="px-0">
        <CardTitle className="text-[22px] font-bold tracking-normal">
          Caixa
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-0 text-sm">
        <Metric icon={Calendar} label="Caixa de hoje" value={cashDate} />
        <Metric icon={Clock3} label="Virada" value="00:00" />
        <Metric icon={Clock3} label="Proxima virada" value="Amanha, 00:00" />
        <Metric
          icon={CircleDollarSign}
          label="Balanca"
          value={formatMoney(totalRevenue)}
        />
        <Metric
          icon={ReceiptText}
          label="Pedidos"
          value={String(totalOrders).padStart(2, "0")}
        />
        <Metric
          icon={ReceiptText}
          label="Comandas abertas"
          value={String(activeComandas).padStart(2, "0")}
        />
      </CardContent>
    </Card>
  )
}

export function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3
  label: string
  value: string
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground">
        <Icon className="size-4" /> {label}
      </p>
      <p className="mt-1 text-[13px] leading-snug font-semibold text-foreground">
        {value}
      </p>
    </div>
  )
}
