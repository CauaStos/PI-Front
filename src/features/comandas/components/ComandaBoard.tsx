import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ComandaOrder, OrderStatus } from "@pi/contracts"
import { api } from "@/lib/api"
import { useBoardChanged } from "../hooks/useBoardChanged"
import { authClient } from "@/lib/auth-client"
import { useMutate } from "@/lib/use-mutate"
import { History } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import {
  CashPanel,
  ComandaCard,
  CreateComandaCard,
  HistoryTable,
  OrdersTable,
  QrCodeSlot,
} from "."
import { AddOrderDialog } from "./AddOrderDialog"
import { ConfirmActionDialog } from "./ConfirmActionDialog"
import { EditOrderDialog } from "./EditOrderDialog"
import {
  BoardData,
  PendingAction,
  billableOrderCount,
  buildHistoryRows,
  calcComandaTotal,
  canCancelOrder,
  canDeleteOrder,
  canEditOrder,
  displayComandaName,
  formatCashDate,
  formatDate,
  isTabActive,
  getDayKey,
  isClosedOnDay,
  isVisibleInToday,
  nextComandaName,
} from "../shared"

export function ComandaBoard({ initialData }: { initialData: BoardData }) {
  const { data: session } = authClient.useSession()
  const employeeRole =
    (session?.user as { employeeRole?: string } | undefined)?.employeeRole ??
    ((session?.user as { role?: string } | undefined)?.role === "admin"
      ? "admin"
      : "garcom")
  const canManageOrders = employeeRole === "admin" || employeeRole === "garcom"
  const [board, setBoard] = useState(initialData)
  const [now, setNow] = useState(() => new Date())
  const [selectedId, setSelectedId] = useState(initialData.comandas[0]?.id)
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([])
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [editOrder, setEditOrder] = useState<ComandaOrder | null>(null)

  const reload = useCallback(async () => {
    const [tabs, products, employees, songs] = await Promise.all([
      api.get<BoardData["comandas"]>("/tabs"),
      api.get<BoardData["products"]>("/products"),
      api.get<BoardData["employees"]>("/employees"),
      api.get<BoardData["songs"]>("/songs"),
    ])
    const next = { comandas: tabs, products, employees, songs }
    setBoard(next)
    return next
  }, [])

  function afterReload(next: unknown) {
    const nextBoard = next as BoardData
    const stillSelected = nextBoard.comandas.some((c) => c.id === selectedId)
    if (!stillSelected) setSelectedId(nextBoard.comandas[0]?.id)
    setSelectedOrderIds([])
  }

  const { isMutating, message, setMessage, mutate } = useMutate(
    reload,
    afterReload
  )

  const comandas = board.comandas
  const todayKey = getDayKey(now)
  const todayComandas = comandas.filter((comanda) =>
    isVisibleInToday(comanda, todayKey)
  )
  const selected =
    todayComandas.find((c) => c.id === selectedId) ?? todayComandas[0]
  const activeComandas = comandas.filter(
    (c) => c.status !== "finished" && c.status !== "cancelled"
  )
  const finishedToday = comandas.filter(
    (c) => c.status === "finished" && isClosedOnDay(c, todayKey)
  )
  const cashOrders = finishedToday.reduce((s, c) => s + c.orders.length, 0)
  const cashRevenue = finishedToday.reduce(
    (s, c) => s + calcComandaTotal(c),
    0
  )
  const historyRows = buildHistoryRows(comandas)
  const selectedOrders =
    selected?.orders.filter((order) => selectedOrderIds.includes(order.id)) ??
    []
  const selectedActive = selected ? isTabActive(selected) : false

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(interval)
  }, [])

  function selectComanda(id: string) {
    setSelectedId(id)
    setSelectedOrderIds([])
  }

  useBoardChanged(() => {
    void reload()
  })

  async function createComanda() {
    await mutate(async () => {
      await api.post("/tabs", {
        tableName: nextComandaName(comandas.length + 1),
      })
      return "Comanda criada."
    })
  }

  async function addOrder(payload: {
    product: string
    employee: string
    quantity: number
  }): Promise<boolean> {
    if (!selected) return false
    if (!isTabActive(selected)) {
      setMessage({
        type: "error",
        text: "Esta comanda esta finalizada ou cancelada e nao aceita novos pedidos.",
      })
      return false
    }
    const ok = await mutate(async () => {
      await api.post("/orders", {
        tab: selected.id,
        product: payload.product,
        employee: payload.employee,
        quantity: payload.quantity,
      })
      return "Pedido adicionado."
    })
    if (ok) setAddOpen(false)
    return ok
  }

  async function saveEditOrder(
    order: ComandaOrder,
    payload: { product: string; employee: string; quantity: number }
  ): Promise<boolean> {
    if (selected && !isTabActive(selected)) {
      setMessage({
        type: "error",
        text: "Comanda finalizada ou cancelada nao permite editar pedidos.",
      })
      return false
    }
    if (!canEditOrder(order)) {
      setMessage({
        type: "error",
        text: "Pedidos entregues, concluidos ou cancelados nao podem ser editados.",
      })
      return false
    }
    const product = board.products.find((p) => p.id === payload.product)
    if (!product) {
      setMessage({ type: "error", text: "Selecione um produto valido." })
      return false
    }
    if (
      payload.product !== order.product &&
      payload.quantity > product.stock
    ) {
      setMessage({
        type: "error",
        text: `Estoque insuficiente para ${product.name}. Disponivel: ${product.stock}.`,
      })
      return false
    }
    const ok = await mutate(async () => {
      await api.patch(`/orders/${order.id}`, {
        product: payload.product !== order.product ? payload.product : undefined,
        employee:
          payload.employee !== order.employee ? payload.employee : undefined,
        quantity:
          payload.quantity !== order.quantity ? payload.quantity : undefined,
      })
      return "Pedido editado."
    })
    if (ok) setEditOrder(null)
    return ok
  }

  async function updateOrderStatus(order: ComandaOrder, status: OrderStatus) {
    if (order.status === status) return
    if (selected && !isTabActive(selected)) {
      setMessage({
        type: "error",
        text: "Comanda finalizada ou cancelada nao permite alterar pedidos.",
      })
      return
    }
    if (order.status === "cancelled") {
      setMessage({
        type: "error",
        text: "Um pedido cancelado nao pode mudar de status.",
      })
      return
    }
    await mutate(async () => {
      await api.patch(`/orders/${order.id}`, { status })
      return "Status do pedido atualizado."
    })
  }

  async function cancelOrder(order: ComandaOrder) {
    if (!canCancelOrder(order)) {
      setMessage({
        type: "error",
        text: "Este pedido ja esta cancelado ou concluido.",
      })
      return
    }
    await updateOrderStatus(order, "cancelled")
  }

  async function confirmPendingAction() {
    if (!pendingAction) return
    let ok = false

    if (pendingAction.type === "finalizar-comanda") {
      if (!isTabActive(pendingAction.comanda)) {
        setPendingAction(null)
        setMessage({
          type: "error",
          text: "Esta comanda ja foi finalizada ou cancelada.",
        })
        return
      }
      if (billableOrderCount(pendingAction.comanda) === 0) {
        setPendingAction(null)
        setMessage({
          type: "error",
          text: "Nao e possivel finalizar uma comanda sem pedidos ativos.",
        })
        return
      }
      ok = await mutate(async () => {
        await api.patch(`/tabs/${pendingAction.comanda.id}`, {
          status: "finished",
        })
        return "Comanda finalizada."
      })
    }

    if (pendingAction.type === "cancelar-comanda") {
      if (!isTabActive(pendingAction.comanda)) {
        setPendingAction(null)
        setMessage({
          type: "error",
          text: "Esta comanda ja foi finalizada ou cancelada.",
        })
        return
      }
      ok = await mutate(async () => {
        await api.patch(`/tabs/${pendingAction.comanda.id}`, {
          status: "cancelled",
        })
        return "Comanda cancelada."
      })
    }

    if (pendingAction.type === "remover-pedidos") {
      ok = await mutate(async () => {
        await Promise.all(
          pendingAction.orders.map((order) => api.delete(`/orders/${order.id}`))
        )
        return `${pendingAction.orders.length} pedido(s) removido(s).`
      })
    }

    if (ok) setPendingAction(null)
  }

  return (
    <main className="min-h-svh bg-background px-10 py-8 text-foreground max-sm:px-5 max-sm:py-5">
      <div className="mx-auto grid max-w-[1160px] grid-cols-[230px_minmax(0,1fr)] gap-11 max-xl:grid-cols-1">
        <section className="grid content-start gap-6">
          <CashPanel
            cashDate={formatCashDate(now)}
            totalRevenue={cashRevenue}
            totalOrders={cashOrders}
            activeComandas={activeComandas.length}
          />

          {message ? (
            <Alert
              variant={message.type === "error" ? "destructive" : "default"}
            >
              <AlertTitle>
                {message.type === "error" ? "Erro" : "Sucesso"}
              </AlertTitle>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          ) : null}
        </section>

        <section className="min-w-0">
          <Tabs defaultValue="today" className="gap-6">
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-[22px] font-bold tracking-normal">
                Comandas
              </h1>
              <TabsList className="h-8 bg-muted">
                <TabsTrigger value="today" className="px-3 text-xs font-bold">
                  Hoje
                </TabsTrigger>
                <TabsTrigger value="history" className="px-3 text-xs font-bold">
                  <History className="size-3.5" /> Historico
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="today" className="mt-0">
              <div className="grid max-w-[860px] grid-cols-[minmax(0,1fr)_180px] gap-4 max-md:max-w-none max-md:grid-cols-1">
                <div className="h-[520px] overflow-y-auto px-2 pt-2 shadow-[inset_0_-18px_18px_-22px_rgba(0,0,0,0.35)] max-sm:h-[440px]">
                  <div className="grid grid-cols-3 gap-3 max-md:grid-cols-2 max-sm:grid-cols-1">
                    <CreateComandaCard
                      onClick={createComanda}
                      disabled={isMutating || !canManageOrders}
                    />
                    {todayComandas.map((comanda) => (
                      <ComandaCard
                        key={comanda.id}
                        comanda={comanda}
                        selected={selected?.id === comanda.id}
                        onClick={() => selectComanda(comanda.id)}
                        onFinish={() =>
                          setPendingAction({
                            type: "finalizar-comanda",
                            comanda,
                          })
                        }
                        onCancel={() =>
                          setPendingAction({
                            type: "cancelar-comanda",
                            comanda,
                          })
                        }
                        songs={board.songs}
                      />
                    ))}
                  </div>
                </div>
                <QrCodeSlot comanda={selected} />
              </div>

              <section className="mt-6 max-w-245">
                <div className="flex items-end justify-between gap-4">
                  <h2 className="text-[22px] font-bold tracking-normal">
                    Pedidos
                  </h2>
                  <span className="text-sm font-semibold text-muted-foreground">
                    {selected
                      ? `${displayComandaName(selected.tableName)} - ${formatDate(selected.openedAt)}`
                      : "Nenhuma comanda"}
                  </span>
                </div>
                <OrdersTable
                  orders={selected?.orders ?? []}
                  selectedIds={selectedOrderIds}
                  comandaActive={selectedActive}
                  isMutating={isMutating}
                  onSelectedIdsChange={setSelectedOrderIds}
                  onAdd={() => setAddOpen(true)}
                  onEdit={setEditOrder}
                  onCancel={cancelOrder}
                  onStatusChange={updateOrderStatus}
                  canManageOrders={canManageOrders}
                  onRemoveSelected={() =>
                    setPendingAction({
                      type: "remover-pedidos",
                      orders: selectedOrders.filter((order) =>
                        canDeleteOrder(order)
                      ),
                    })
                  }
                />
              </section>
            </TabsContent>

            <TabsContent value="history" className="mt-0 max-w-[860px]">
              <HistoryTable rows={historyRows} />
            </TabsContent>
          </Tabs>
        </section>
      </div>

      <AddOrderDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        products={board.products}
        employees={board.employees}
        comandaName={selected?.tableName}
        selectedActive={selectedActive}
        isMutating={isMutating}
        setMessage={setMessage}
        onSubmit={addOrder}
      />

      <EditOrderDialog
        order={editOrder}
        products={board.products}
        employees={board.employees}
        isMutating={isMutating}
        setMessage={setMessage}
        onSubmit={saveEditOrder}
        onClose={() => setEditOrder(null)}
      />

      <ConfirmActionDialog
        action={pendingAction}
        isMutating={isMutating}
        onConfirm={confirmPendingAction}
        onClose={() => setPendingAction(null)}
      />
    </main>
  )
}
