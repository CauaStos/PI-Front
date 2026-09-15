import { Card, CardContent } from "@/components/ui/card"
import {
  Comanda,
  PendingAction,
  comandaStatusLabel,
  displayComandaName,
} from "../shared"

export function ActionSummary({ action }: { action: PendingAction }) {
  if (!action) return null

  if (action.type === "remover-pedidos") {
    return (
      <Card className="shadow-none">
        <CardContent className="space-y-2 p-4 text-sm">
          <div className="flex justify-between">
            <span>Pedidos</span>
            <strong>{action.orders.length}</strong>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-none">
      <CardContent className="space-y-2 p-4 text-sm">
        <div className="flex justify-between">
          <span>Comanda</span>
          <strong>{displayComandaName(action.comanda.tableName)}</strong>
        </div>
        <div className="flex justify-between">
          <span>Status</span>
          <strong>{comandaStatusLabel[action.comanda.status]}</strong>
        </div>
        <div className="flex justify-between">
          <span>Pedidos</span>
          <strong>{action.comanda.orders.length}</strong>
        </div>
      </CardContent>
    </Card>
  )
}
