import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format as formatMoney } from "@/lib/money"
import type { Song } from "@pi/contracts"
import { Check, Music2, PackageOpen, Plus } from "lucide-react"
import {
  billableOrderCount,
  calcComandaTotal,
  comandaStatusLabel,
  Comanda,
  displayComandaName,
  formatDate,
  isTabActive,
  orderStatusLabel,
  statusClass,
} from "../shared"

const songStatusLabel: Record<Song["status"], string> = {
  queued: "Na fila",
  playing: "Tocando",
  finished: "Finalizada",
  cancelled: "Cancelada",
}

const songStatusClass: Record<Song["status"], string> = {
  queued: "bg-zinc-100 text-zinc-700",
  playing: "bg-pink-200 text-pink-900",
  finished: "bg-emerald-200 text-emerald-950",
  cancelled: "bg-red-200 text-red-950",
}

export function ComandaDetailsDialog({
  comanda,
  songs,
  open,
  onOpenChange,
  onFinish,
  onAddOrder,
  canManageOrders,
}: {
  comanda: Comanda | null
  songs: Song[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onFinish: () => void
  onAddOrder: () => void
  canManageOrders: boolean
}) {
  if (!comanda) return null

  const comandaActive = isTabActive(comanda)
  const canFinish = comandaActive && billableOrderCount(comanda) > 0

  const comandaSongs = songs
    .filter((song) => song.tab === comanda.id)
    .sort((a, b) => {
      if (a.position === null) return 1
      if (b.position === null) return -1
      return a.position - b.position
    })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes da comanda</DialogTitle>
          <DialogDescription>
            Consulte pedidos, músicas e informações da{" "}
            <strong>{displayComandaName(comanda.tableName)}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 rounded-xl border border-border bg-muted/30 p-4 sm:grid-cols-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Status</p>
            <span
              className={`mt-1 inline-flex rounded-md px-2 py-1 text-xs font-bold ${statusClass[comanda.status]}`}
            >
              {comandaStatusLabel[comanda.status]}
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">
              Aberta em
            </p>
            <p className="mt-1 text-sm font-semibold">
              {formatDate(comanda.openedAt)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Total</p>
            <p className="mt-1 text-sm font-bold">
              {formatMoney(calcComandaTotal(comanda))}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">
              Pessoas vinculadas
            </p>
            <p className="mt-1 text-sm font-bold">{comanda.members.length}</p>
          </div>
        </div>

        <Tabs defaultValue="orders" className="gap-4">
          <TabsList className="w-full">
            <TabsTrigger value="orders" className="gap-2">
              <PackageOpen className="size-4" /> Pedidos ({comanda.orders.length})
            </TabsTrigger>
            <TabsTrigger value="songs" className="gap-2">
              <Music2 className="size-4" /> Músicas ({comandaSongs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-3">
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onAddOrder}
                disabled={!comandaActive || !canManageOrders}
              >
                <Plus className="size-4" /> Adicionar pedido
              </Button>
            </div>
            {comanda.orders.length > 0 ? (
              comanda.orders.map((order) => (
                <div
                  key={order.id}
                  className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div>
                    <p className="font-semibold">{order.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      Responsável: {order.employeeName} · Pedido em{" "}
                      {formatDate(order.orderedAt)}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-semibold">
                      {order.quantity} × {formatMoney(order.unitPrice)}
                    </p>
                    <span
                      className={`inline-flex rounded-md px-2 py-1 text-xs font-bold ${statusClass[order.status]}`}
                    >
                      {orderStatusLabel[order.status]}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState message="Nenhum pedido nesta comanda." />
            )}
          </TabsContent>

          <TabsContent value="songs" className="space-y-3">
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled
                title="A adição de músicas será implementada em uma etapa futura."
              >
                <Plus className="size-4" /> Adicionar música
              </Button>
            </div>
            {comandaSongs.length > 0 ? (
              comandaSongs.map((song) => (
                <div
                  key={song.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{song.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Solicitada em {formatDate(song.requestedAt)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-semibold text-muted-foreground">
                      {song.position === null ? "Sem posição" : `#${song.position}`}
                    </p>
                    <span
                      className={`inline-flex rounded-md px-2 py-1 text-xs font-bold ${songStatusClass[song.status]}`}
                    >
                      {songStatusLabel[song.status]}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState message="Nenhuma música vinculada a esta comanda." />
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end border-t border-border pt-4">
          <Button
            type="button"
            variant="default"
            onClick={onFinish}
            disabled={!canFinish || !canManageOrders}
          >
            <Check className="size-4" /> Finalizar comanda
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm font-medium text-muted-foreground">
      {message}
    </div>
  )
}
