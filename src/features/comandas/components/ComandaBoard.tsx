import { format as formatMoney, multiply, sum } from "@/lib/money"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ComandaOrder, OrderStatus } from "@/data/comanda-board"
import { api } from "@/lib/api"
import { useBoardChanged } from "../hooks/useBoardChanged"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import { History } from "lucide-react"
import { useEffect, useState } from "react"
import {
  ActionSummary,
  CashPanel,
  ComandaCard,
  CreateComandaCard,
  HistoryTable,
  OrdersTable,
  QrCodeSlot,
} from "."
import {
  BoardData,
  Comanda,
  PendingAction,
  billableOrderCount,
  buildHistoryRows,
  canCancelOrder,
  canDeleteOrder,
  canEditOrder,
  displayComandaName,
  formatCashDate,
  formatDate,
  getActionDescription,
  getActionTitle,
  getDayKey,
  isClosedOnDay,
  isPendingActionEmpty,
  isTabActive,
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
  const [message, setMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [editOrder, setEditOrder] = useState<ComandaOrder | null>(null)
  const [isMutating, setIsMutating] = useState(false)

  const [productId, setProductId] = useState(initialData.products[0]?.id ?? "")
  const [employeeId, setEmployeeId] = useState(
    initialData.employees[0]?.id ?? ""
  )
  const [quantity, setQuantity] = useState(1)

  const [editProductId, setEditProductId] = useState("")
  const [editEmployeeId, setEditEmployeeId] = useState("")
  const [editQuantity, setEditQuantity] = useState(1)

  const comandas = board.comandas
  const todayKey = getDayKey(now)
  const todayComandas = comandas.filter((comanda) =>
    isVisibleInToday(comanda, todayKey)
  )
  const selected =
    todayComandas.find((c) => c.id === selectedId) ?? todayComandas[0]
  const productOptions = board.products
  const activeComandas = comandas.filter(
    (c) => c.status !== "finished" && c.status !== "cancelled"
  )
  const finishedToday = comandas.filter(
    (c) => c.status === "finished" && isClosedOnDay(c, todayKey)
  )
  const cashOrders = finishedToday.reduce((s, c) => s + c.orders.length, 0)
  const cashRevenue = finishedToday.reduce((s, c) => s + calcTotal(c), 0)
  const historyRows = buildHistoryRows(comandas)
  const selectedOrders =
    selected?.orders.filter((order) => selectedOrderIds.includes(order.id)) ??
    []
  const selectedActive = selected ? isTabActive(selected) : false

  const selectedProduct = board.products.find((p) => p.id === productId)
  const addQuantityValid =
    Number.isInteger(quantity) &&
    quantity >= 1 &&
    !!selectedProduct &&
    quantity <= selectedProduct.stock

  const editProduct = board.products.find((p) => p.id === editProductId)
  const editProductChanged = !!editOrder && editProductId !== editOrder.product
  const editQuantityValid =
    Number.isInteger(editQuantity) &&
    editQuantity >= 1 &&
    !!editProduct &&
    (!editProductChanged || editQuantity <= editProduct.stock)

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(interval)
  }, [])

  function selectComanda(id: string) {
    setSelectedId(id)
    setSelectedOrderIds([])
  }

  function calcTotal(comanda: Comanda): number {
    return sum(
      comanda.orders
        .filter((o) => o.status !== "cancelled")
        .map((o) => multiply(o.unitPrice, o.quantity))
    )
  }

  useBoardChanged(() => {
    void reload()
  })

  async function reload() {
    const [tabs, products, employees, songs] = await Promise.all([
      api.get<BoardData["comandas"]>("/tabs"),
      api.get<BoardData["products"]>("/products"),
      api.get<BoardData["employees"]>("/employees"),
      api.get<BoardData["songs"]>("/songs"),
    ])
    const next = { comandas: tabs, products, employees, songs }
    setBoard(next)
    return next
  }

  async function mutate(action: () => Promise<string>) {
    setIsMutating(true)
    setMessage(null)
    try {
      const text = await action()
      const next = await reload()
      const stillSelected = next.comandas.some((c) => c.id === selectedId)
      if (!stillSelected) setSelectedId(next.comandas[0]?.id)
      setSelectedOrderIds([])
      setMessage({ type: "success", text })
      return true
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Operacao falhou.",
      })
      return false
    } finally {
      setIsMutating(false)
    }
  }

  async function createComanda() {
    await mutate(async () => {
      await api.post("/tabs", {
        tableName: nextComandaName(comandas.length + 1),
      })
      return "Comanda criada."
    })
  }

  async function addOrder() {
    if (!selected) return
    if (!isTabActive(selected)) {
      setMessage({
        type: "error",
        text: "Esta comanda esta finalizada ou cancelada e nao aceita novos pedidos.",
      })
      return
    }
    const product = board.products.find((p) => p.id === productId)
    if (!product) {
      setMessage({ type: "error", text: "Selecione um produto valido." })
      return
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      setMessage({
        type: "error",
        text: "Informe uma quantidade valida (minimo 1).",
      })
      return
    }
    if (quantity > product.stock) {
      setMessage({
        type: "error",
        text: `Estoque insuficiente para ${product.name}. Disponivel: ${product.stock}.`,
      })
      return
    }
    const ok = await mutate(async () => {
      await api.post("/orders", {
        tab: selected.id,
        product: productId,
        employee: employeeId,
        quantity,
      })
      return "Pedido adicionado."
    })
    if (ok) {
      setAddOpen(false)
      setQuantity(1)
    }
  }

  function openEditDialog(order: ComandaOrder) {
    setEditOrder(order)
    setEditProductId(order.product)
    setEditEmployeeId(order.employee)
    setEditQuantity(order.quantity)
  }

  async function saveEditOrder() {
    if (!editOrder) return
    if (selected && !isTabActive(selected)) {
      setMessage({
        type: "error",
        text: "Comanda finalizada ou cancelada nao permite editar pedidos.",
      })
      return
    }
    if (!canEditOrder(editOrder)) {
      setMessage({
        type: "error",
        text: "Pedidos entregues, concluidos ou cancelados nao podem ser editados.",
      })
      return
    }
    const product = board.products.find((p) => p.id === editProductId)
    if (!product) {
      setMessage({ type: "error", text: "Selecione um produto valido." })
      return
    }
    if (!Number.isInteger(editQuantity) || editQuantity < 1) {
      setMessage({
        type: "error",
        text: "Informe uma quantidade valida (minimo 1).",
      })
      return
    }
    if (editProductId !== editOrder.product && editQuantity > product.stock) {
      setMessage({
        type: "error",
        text: `Estoque insuficiente para ${product.name}. Disponivel: ${product.stock}.`,
      })
      return
    }
    const ok = await mutate(async () => {
      await api.patch(`/orders/${editOrder.id}`, {
        product:
          editProductId !== editOrder.product ? editProductId : undefined,
        employee:
          editEmployeeId !== editOrder.employee ? editEmployeeId : undefined,
        quantity:
          editQuantity !== editOrder.quantity ? editQuantity : undefined,
      })
      return "Pedido editado."
    })
    if (ok) setEditOrder(null)
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
                  onEdit={openEditDialog}
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

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar pedido</DialogTitle>
            <DialogDescription>
              Selecione produto, funcionario responsavel e quantidade para{" "}
              {selected ? displayComandaName(selected.tableName) : "a comanda"}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <label className="grid gap-1 text-sm font-semibold">
              Produto
              <select
                className="h-9 rounded-lg border border-input bg-background px-3"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
              >
                {productOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} - {formatMoney(p.price)}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Funcionario
              <select
                className="h-9 rounded-lg border border-input bg-background px-3"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              >
                {board.employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Quantidade
              <input
                className="h-9 rounded-lg border border-input bg-background px-3"
                min={1}
                max={selectedProduct?.stock}
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
              {selectedProduct ? (
                <span className="text-xs font-medium text-muted-foreground">
                  {selectedProduct.stock} em estoque
                  {quantity > selectedProduct.stock
                    ? " - quantidade acima do disponivel"
                    : ""}
                </span>
              ) : null}
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={addOrder}
              disabled={isMutating || !selectedActive || !addQuantityValid}
            >
              {isMutating ? "Salvando..." : "Adicionar pedido"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editOrder !== null}
        onOpenChange={(open) => !open && setEditOrder(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar pedido</DialogTitle>
            <DialogDescription>
              Altere produto, funcionario ou quantidade do pedido.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <label className="grid gap-1 text-sm font-semibold">
              Produto
              <select
                className="h-9 rounded-lg border border-input bg-background px-3"
                value={editProductId}
                onChange={(e) => setEditProductId(e.target.value)}
              >
                {board.products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} - {formatMoney(p.price)}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Funcionario
              <select
                className="h-9 rounded-lg border border-input bg-background px-3"
                value={editEmployeeId}
                onChange={(e) => setEditEmployeeId(e.target.value)}
              >
                {board.employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Quantidade
              <input
                className="h-9 rounded-lg border border-input bg-background px-3"
                min={1}
                max={editProductChanged ? editProduct?.stock : undefined}
                type="number"
                value={editQuantity}
                onChange={(e) => setEditQuantity(Number(e.target.value))}
              />
              {editProductChanged && editProduct ? (
                <span className="text-xs font-medium text-muted-foreground">
                  {editProduct.stock} em estoque
                  {editQuantity > editProduct.stock
                    ? " - quantidade acima do disponivel"
                    : ""}
                </span>
              ) : null}
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOrder(null)}>
              Cancelar
            </Button>
            <Button
              onClick={saveEditOrder}
              disabled={isMutating || !editQuantityValid}
            >
              {isMutating ? "Salvando..." : "Salvar alteracoes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={pendingAction !== null}
        onOpenChange={(open) => !open && setPendingAction(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getActionTitle(pendingAction)}</DialogTitle>
            <DialogDescription>
              {getActionDescription(pendingAction)}
            </DialogDescription>
          </DialogHeader>
          <ActionSummary action={pendingAction} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingAction(null)}>
              Voltar
            </Button>
            <Button
              onClick={confirmPendingAction}
              disabled={isMutating || isPendingActionEmpty(pendingAction)}
              className={cn(
                (pendingAction?.type === "cancelar-comanda" ||
                  pendingAction?.type === "remover-pedidos") &&
                  "bg-red-900 text-white hover:bg-red-950"
              )}
            >
              {isMutating ? "Processando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
