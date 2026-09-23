import { MemberAvatar } from "./ComandaCard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, MoreHorizontal, Pencil, Plus, Trash2, X } from "lucide-react"
import type { ComandaOrder, OrderStatus } from "@/data/comanda-board"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  canCancelOrder,
  canDeleteOrder,
  canEditOrder,
  formatDate,
  orderStatusLabel,
  orderStatusOptions,
  statusClass,
} from "../shared"

export function OrdersTable({
  orders,
  selectedIds,
  comandaActive,
  isMutating,
  onSelectedIdsChange,
  onAdd,
  onEdit,
  onCancel,
  onStatusChange,
  onRemoveSelected,
  canManageOrders,
}: {
  orders: ComandaOrder[]
  selectedIds: string[]
  comandaActive: boolean
  isMutating: boolean
  onSelectedIdsChange: (ids: string[]) => void
  onAdd: () => void
  onEdit: (order: ComandaOrder) => void
  onCancel: (order: ComandaOrder) => void
  onStatusChange: (order: ComandaOrder, status: OrderStatus) => void
  onRemoveSelected: () => void
  canManageOrders: boolean
}) {
  const deletableOrders = comandaActive ? orders.filter(canDeleteOrder) : []
  const allSelected =
    deletableOrders.length > 0 &&
    deletableOrders.every((o) => selectedIds.includes(o.id))
  const selectedCount = selectedIds.length

  function toggleAll() {
    onSelectedIdsChange(
      allSelected ? [] : deletableOrders.map((order) => order.id)
    )
  }

  function toggleOrder(order: ComandaOrder) {
    if (!comandaActive || !canDeleteOrder(order)) return
    onSelectedIdsChange(
      selectedIds.includes(order.id)
        ? selectedIds.filter((id) => id !== order.id)
        : [...selectedIds, order.id]
    )
  }

  return (
    <div className="mt-4 overflow-hidden">
      <div className="mb-3 flex justify-end lg:hidden">
        <button
          type="button"
          title={comandaActive ? "Adicionar pedido" : "Comanda encerrada"}
          onClick={onAdd}
          disabled={!comandaActive || !canManageOrders}
          className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
        >
          <Plus className="size-4" />
        </button>
      </div>
      {selectedCount > 0 ? (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2">
          <span className="text-sm font-semibold text-muted-foreground">
            {selectedCount} pedido(s) selecionado(s)
          </span>
          <Button
            size="sm"
            className="bg-red-900 text-white hover:bg-red-950"
            onClick={onRemoveSelected}
            disabled={isMutating || !canManageOrders}
          >
            <Trash2 className="size-4" /> Remover
          </Button>
        </div>
      ) : null}
      <Table>
        <TableHeader className="max-lg:hidden">
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="w-10 px-4">
              <input
                type="checkbox"
                checked={allSelected}
                disabled={deletableOrders.length === 0 || !canManageOrders}
                onChange={toggleAll}
                aria-label="Selecionar pedidos"
                className="size-4 rounded border-border accent-zinc-950"
              />
            </TableHead>
            <TableHead className="px-4 text-xs font-bold text-muted-foreground">
              Pedido
            </TableHead>
            <TableHead className="text-xs font-bold text-muted-foreground">
              Nome
            </TableHead>
            <TableHead className="text-xs font-bold text-muted-foreground">
              Status
            </TableHead>
            <TableHead className="text-xs font-bold text-muted-foreground">
              Pedido Em
            </TableHead>
            <TableHead className="px-4 text-right text-xs font-bold text-muted-foreground">
              Qtd
            </TableHead>
            <TableHead className="w-20 px-2 text-right">
              <button
                type="button"
                title={comandaActive ? "Adicionar pedido" : "Comanda encerrada"}
                onClick={onAdd}
                disabled={!comandaActive || !canManageOrders}
                className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
              >
                <Plus className="size-4" />
              </button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length ? (
            orders.map((order) => {
              const selected = selectedIds.includes(order.id)
              const locked = !comandaActive || !canDeleteOrder(order)
              return (
                <TableRow
                  key={order.id}
                  data-state={selected ? "selected" : undefined}
                  className="border-border hover:bg-muted/60 max-lg:grid max-lg:grid-cols-1"
                >
                  <TableCell className="px-4 max-lg:pb-0">
                    <input
                      type="checkbox"
                      checked={selected}
                      disabled={locked}
                      onChange={() => toggleOrder(order)}
                      aria-label={`Selecionar ${order.productName}`}
                      className="size-4 rounded border-border accent-zinc-950 disabled:opacity-35"
                    />
                  </TableCell>
                  <TableCell className="px-4 font-semibold underline underline-offset-4">
                    {order.productName}
                  </TableCell>
                  <TableCell className="font-semibold">
                    <span className="flex items-center gap-2">
                      <MemberAvatar label={order.employeeAvatar} tone={1} />{" "}
                      {order.employeeName}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusSelector
                      order={order}
                      disabled={!comandaActive || order.status === "cancelled"}
                      onStatusChange={onStatusChange}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatDate(order.orderedAt)}
                  </TableCell>
                  <TableCell className="px-4 text-right font-semibold max-lg:text-left">
                    {String(order.quantity).padStart(2, "0")}
                  </TableCell>
                  <TableCell className="px-2 text-right max-lg:text-left">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        aria-label={`Acoes do pedido ${order.productName}`}
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          onClick={() => onEdit(order)}
                          disabled={!comandaActive || !canEditOrder(order)}
                        >
                          <Pencil className="size-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => onCancel(order)}
                          disabled={!comandaActive || !canCancelOrder(order)}
                        >
                          <X className="size-4" /> Cancelar pedido
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })
          ) : (
            <TableRow>
              <TableCell
                colSpan={7}
                className="px-4 py-10 text-sm font-medium text-muted-foreground"
              >
                Nenhum pedido nesta comanda.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export function StatusSelector({
  order,
  disabled,
  onStatusChange,
}: {
  order: ComandaOrder
  disabled: boolean
  onStatusChange: (order: ComandaOrder, status: OrderStatus) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        className="rounded-md focus:ring-2 focus:ring-ring focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
      >
        <Badge
          className={cn(
            "rounded-md px-2 py-1 text-xs font-bold",
            statusClass[order.status]
          )}
        >
          {orderStatusLabel[order.status]}
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        {orderStatusOptions
          .filter((status): status is OrderStatus => status !== "open")
          .map((status) => (
            <DropdownMenuItem
              key={status}
              onClick={() => onStatusChange(order, status)}
              disabled={status === order.status}
            >
              {status === order.status ? <Check className="size-4" /> : null}
              {orderStatusLabel[status]}
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
