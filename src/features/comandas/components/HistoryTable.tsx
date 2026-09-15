import { format as formatMoney, parseInput, multiply, sum } from "@/lib/money"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ChevronDown } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Fragment, useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import {
  Comanda,
  HistoryComanda,
  HistoryRow,
  comandaStatusLabel,
  formatDate,
  formatTime,
  orderStatusLabel,
  statusClass,
} from "../shared"

export function HistoryTable({ rows }: { rows: HistoryRow[] }) {
  const [expandedDays, setExpandedDays] = useState<string[]>(
    rows[0] ? [rows[0].dayKey] : []
  )
  const [selectedComanda, setSelectedComanda] = useState<HistoryComanda | null>(
    null
  )

  function toggleDay(dayKey: string) {
    setExpandedDays((current) =>
      current.includes(dayKey)
        ? current.filter((key) => key !== dayKey)
        : [...current, dayKey]
    )
  }

  return (
    <>
      <Card className="rounded-xl py-0 shadow-none">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dia</TableHead>
              <TableHead className="text-right">Encerradas</TableHead>
              <TableHead className="text-right">Finalizadas</TableHead>
              <TableHead className="text-right">Canceladas</TableHead>
              <TableHead>Pedidos</TableHead>
              <TableHead>Periodo</TableHead>
              <TableHead className="text-right">Ticket Medio</TableHead>
              <TableHead className="text-right">Receita</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((row) => {
                const expanded = expandedDays.includes(row.dayKey)

                return (
                  <Fragment key={row.dayKey}>
                    <TableRow>
                      <TableCell className="font-semibold">
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 rounded-md text-left hover:text-foreground"
                          onClick={() => toggleDay(row.dayKey)}
                          aria-expanded={expanded}
                        >
                          <ChevronDown
                            className={cn(
                              "size-4 text-muted-foreground transition-transform",
                              !expanded && "-rotate-90"
                            )}
                          />
                          {row.label}
                        </button>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {row.closed}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.finished}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.cancelled}
                      </TableCell>
                      <TableCell>{row.orders}</TableCell>
                      <TableCell className="font-medium text-muted-foreground">
                        {formatTime(row.firstClosedAt)} -{" "}
                        {formatTime(row.lastClosedAt)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatMoney(row.averageTicket)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatMoney(row.revenue)}
                      </TableCell>
                    </TableRow>
                    {expanded ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell
                          colSpan={8}
                          className="bg-muted/25 px-4 py-3"
                        >
                          <div className="grid gap-2">
                            {row.comandas.map((comanda) => (
                              <div
                                key={comanda.id}
                                onClick={() => setSelectedComanda(comanda)}
                                className="grid cursor-pointer grid-cols-[minmax(120px,1.2fr)_minmax(110px,0.9fr)_minmax(135px,1fr)_80px_100px] items-center gap-3 rounded-lg bg-background px-3 py-2 text-sm transition-colors hover:bg-muted/50 max-lg:grid-cols-2 max-sm:grid-cols-1"
                              >
                                <div className="min-w-0">
                                  <p className="text-[11px] font-bold text-muted-foreground uppercase">
                                    Comanda
                                  </p>
                                  <p className="truncate font-bold">
                                    {comanda.number}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[11px] font-bold text-muted-foreground uppercase">
                                    Status
                                  </p>
                                  <Badge
                                    className={cn(
                                      "mt-1 rounded-md px-2 py-1 text-xs font-bold",
                                      statusClass[comanda.status]
                                    )}
                                  >
                                    {comandaStatusLabel[comanda.status]}
                                  </Badge>
                                </div>
                                <div>
                                  <p className="text-[11px] font-bold text-muted-foreground uppercase">
                                    Periodo
                                  </p>
                                  <p className="font-semibold text-muted-foreground">
                                    {formatTime(comanda.openedAt)} -{" "}
                                    {formatTime(comanda.closedAt)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[11px] font-bold text-muted-foreground uppercase">
                                    Pedidos
                                  </p>
                                  <p className="font-semibold">
                                    {String(comanda.orders).padStart(2, "0")}
                                  </p>
                                </div>
                                <div className="text-right max-lg:text-left">
                                  <p className="text-[11px] font-bold text-muted-foreground uppercase">
                                    Total
                                  </p>
                                  <p className="font-bold">
                                    {formatMoney(comanda.revenue)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
                )
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="px-4 py-10 text-sm font-medium text-muted-foreground"
                >
                  Nenhuma comanda encerrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog
        open={selectedComanda !== null}
        onOpenChange={(open) => !open && setSelectedComanda(null)}
      >
        <DialogContent className="max-w-5xl sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>
              Pedidos da Comanda {selectedComanda?.number}
            </DialogTitle>
            <DialogDescription>
              Listagem de todos os itens registrados nesta comanda.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto pr-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Funcionario</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pedido Em</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Preco Un.</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedComanda?.ordersList.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.productName}
                    </TableCell>
                    <TableCell>{order.employeeName}</TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "rounded-md px-2 py-1 text-xs font-bold",
                          statusClass[order.status]
                        )}
                      >
                        {orderStatusLabel[order.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(order.orderedAt)}</TableCell>
                    <TableCell className="text-right">
                      {order.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatMoney(order.unitPrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatMoney(order.unitPrice * order.quantity)}
                    </TableCell>
                  </TableRow>
                ))}
                {selectedComanda?.ordersList.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-6 text-center text-muted-foreground"
                    >
                      Nenhum pedido
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
