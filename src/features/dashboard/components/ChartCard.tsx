import type { ReactNode } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <Card className="gap-3 shadow-none">
      <CardHeader>
        <CardTitle className="text-sm font-bold">{title}</CardTitle>
        {subtitle ? (
          <p className="text-xs font-medium text-muted-foreground">{subtitle}</p>
        ) : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
