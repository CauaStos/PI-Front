import type { LucideIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"

export function StatTile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon
  label: string
  value: number | string
  hint: string
}) {
  return (
    <Card className="py-0 shadow-none">
      <CardContent className="p-4">
        <p className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground">
          <Icon className="size-4" /> {label}
        </p>
        <p className="mt-2 truncate text-3xl font-bold tabular-nums tracking-tight">
          {typeof value === "number" ? value.toLocaleString("pt-BR") : value}
        </p>
        <p className="mt-1 truncate text-xs font-medium text-muted-foreground">
          {hint}
        </p>
      </CardContent>
    </Card>
  )
}
