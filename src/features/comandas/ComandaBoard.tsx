import {
  Calendar,
  Check,
  CircleDollarSign,
  Clock3,
  History,
  ListMusic,
  Loader2,
  Package,
  Plus,
  ReceiptText,
  Trash2,
  X,
} from "lucide-react"
import { useState } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { ComandaBoardData } from "@/src/data/comanda-board"

type BoardData = ComandaBoardData
type Comanda = BoardData["comandas"][number]
type Order = Comanda["orders"][number]
type Status = Order["status"]
type PendingAction = "finalizar" | "cancelar" | "remover" | null

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

const statusLabel: Record<Status, string> = {
  aberta: "Aberta",
  em_andamento: "Em Andamento",
  entregue: "Entregue",
  finalizada: "Finalizada",
  cancelada: "Cancelada",
}

const statusClass: Record<Status, string> = {
  aberta:
    "bg-zinc-100 text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-200",
  em_andamento: "bg-pink-200 text-pink-900 hover:bg-pink-200",
  entregue: "bg-cyan-200 text-cyan-950 hover:bg-cyan-200",
  finalizada: "bg-emerald-200 text-emerald-950 hover:bg-emerald-200",
  cancelada: "bg-red-200 text-red-950 hover:bg-red-200",
}

const avatarTones = [
  "bg-violet-200 text-violet-950",
  "bg-pink-200 text-pink-950",
  "bg-cyan-200 text-cyan-950",
]

const queueByTable: Record<number, string[]> = {
  1: ["Evidencias", "Tempo Perdido", "Pais e Filhos"],
  2: ["Malandragem", "Anna Julia"],
  3: ["Boate Azul", "Garcom", "Dormi na Praca"],
}

const historyRows = [
  { date: "24 de Abril, 2026", comandas: 18, songs: 64, revenue: 1320 },
  { date: "23 de Abril, 2026", comandas: 14, songs: 51, revenue: 980 },
  { date: "22 de Abril, 2026", comandas: 21, songs: 77, revenue: 1645 },
]

export function ComandaBoard({ initialData }: { initialData: BoardData }) {
  const [board, setBoard] = useState(initialData)
  const [selectedId, setSelectedId] = useState(initialData.comandas[0]?.id)
  const [message, setMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [tableName, setTableName] = useState(
    `Mesa ${String(initialData.comandas.length + 1).padStart(2, "0")}`
  )
  const [productId, setProductId] = useState(
    String(initialData.products[0]?.id ?? "")
  )
  const [employeeId, setEmployeeId] = useState(
    String(initialData.employees[0]?.id ?? "")
  )
  const [quantity, setQuantity] = useState(1)
  const [isMutating, setIsMutating] = useState(false)

  const comandas = board.comandas
  const selected =
    comandas.find((comanda) => comanda.id === selectedId) ?? comandas[0]
  const productOptions = board.products.filter((product) => product.stock > 0)
  const removableOrder = selected?.orders.at(-1)
  const totalOrders = comandas.reduce(
    (sum, comanda) => sum + comanda.orders.length,
    0
  )
  const totalSongs = comandas.reduce(
    (sum, comanda) => sum + getQueue(comanda.id).length,
    0
  )
  const selectedTotal = selected
    ? calculateClientTotal(selected, board.products)
    : 0
  const totalRevenue = comandas.reduce(
    (sum, comanda) => sum + calculateClientTotal(comanda, board.products),
    0
  )

  function commitBoard(nextBoard: BoardData, text: string) {
    setBoard(nextBoard)
    const hasSelected = nextBoard.comandas.some(
      (comanda) => comanda.id === selectedId
    )
    if (!hasSelected) {
      setSelectedId(nextBoard.comandas[0]?.id)
    }
    setMessage({ type: "success", text })
  }

  function mutate(action: () => { board: BoardData; message: string }) {
    setIsMutating(true)
    setMessage(null)

    try {
      const result = action()
      commitBoard(result.board, result.message)
      return true
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Operacao falhou.",
      })
      return false
    } finally {
      setIsMutating(false)
    }
  }

  function createComanda() {
    const ok = mutate(() => {
      const nextId = Math.max(0, ...board.comandas.map((comanda) => comanda.id)) + 1
      const members = board.employees.slice(0, 3).map((employee) => ({
        comandaId: nextId,
        name: employee.name,
        avatar: employee.avatar,
      }))

      return {
        message: "Comanda criada.",
        board: {
          ...board,
          comandas: [
            ...board.comandas,
            {
              id: nextId,
              tableName: tableName.trim() || `Mesa ${String(nextId).padStart(2, "0")}`,
              status: "aberta",
              openedAt: new Date(),
              closedAt: null,
              members,
              orders: [],
            },
          ],
        },
      }
    })

    if (ok) {
      setTableName(`Mesa ${String(board.comandas.length + 2).padStart(2, "0")}`)
    }
  }

  function addOrder() {
    if (!selected) return

    const ok = mutate(() => {
      const product = board.products.find((item) => item.id === Number(productId))
      const employee = board.employees.find((item) => item.id === Number(employeeId))
      const nextQuantity = Math.max(1, quantity)

      if (!product || !employee) {
        throw new Error("Produto ou funcionario invalido.")
      }
      if (product.stock < nextQuantity) {
        throw new Error("Quantidade maior que o estoque disponivel.")
      }

      const nextOrderId =
        Math.max(
          0,
          ...board.comandas.flatMap((comanda) =>
            comanda.orders.map((order) => order.id)
          )
        ) + 1

      return {
        message: "Pedido adicionado.",
        board: {
          ...board,
          comandas: board.comandas.map((comanda) =>
            comanda.id === selected.id
              ? {
                  ...comanda,
                  status: "em_andamento",
                  orders: [
                    ...comanda.orders,
                    {
                      id: nextOrderId,
                      comandaId: comanda.id,
                      product: product.name,
                      employee: employee.name,
                      employeeAvatar: employee.avatar,
                      quantity: nextQuantity,
                      status: "em_andamento",
                      orderedAt: new Date(),
                      deliveredAt: null,
                    },
                  ],
                }
              : comanda
          ),
          products: board.products.map((item) =>
            item.id === product.id
              ? { ...item, stock: item.stock - nextQuantity }
              : item
          ),
        },
      }
    })

    if (ok) {
      setAddOpen(false)
      setQuantity(1)
    }
  }

  function confirmPendingAction() {
    if (!selected || !pendingAction) return

    let ok = false
    if (pendingAction === "finalizar") {
      ok = mutate(() => ({
        message: "Comanda finalizada.",
        board: {
          ...board,
          comandas: board.comandas.map((comanda) =>
            comanda.id === selected.id
              ? {
                  ...comanda,
                  status: "finalizada",
                  closedAt: new Date(),
                  orders: comanda.orders.map((order) => ({
                    ...order,
                    status: order.status === "cancelada" ? order.status : "entregue",
                    deliveredAt: order.deliveredAt ?? new Date(),
                  })),
                }
              : comanda
          ),
        },
      }))
    }
    if (pendingAction === "cancelar") {
      ok = mutate(() => ({
        message: "Comanda cancelada.",
        board: {
          ...board,
          comandas: board.comandas.map((comanda) =>
            comanda.id === selected.id
              ? {
                  ...comanda,
                  status: "cancelada",
                  closedAt: new Date(),
                  orders: comanda.orders.map((order) => ({
                    ...order,
                    status: "cancelada",
                  })),
                }
              : comanda
          ),
        },
      }))
    }
    if (pendingAction === "remover" && removableOrder) {
      ok = mutate(() => ({
        message: "Pedido removido.",
        board: {
          ...board,
          comandas: board.comandas.map((comanda) =>
            comanda.id === selected.id
              ? {
                  ...comanda,
                  orders: comanda.orders.filter(
                    (order) => order.id !== removableOrder.id
                  ),
                }
              : comanda
          ),
        },
      }))
    }

    if (ok) {
      setPendingAction(null)
    }
  }

  return (
    <main className="min-h-svh bg-background px-10 py-8 text-foreground max-sm:px-5 max-sm:py-5">
      <div className="mx-auto grid max-w-[1160px] grid-cols-[230px_minmax(0,1fr)] gap-11 max-xl:grid-cols-1">
        <section className="flex min-h-[720px] flex-col pt-[230px] max-xl:min-h-0 max-xl:pt-0">
          <CashPanel
            totalRevenue={totalRevenue}
            totalOrders={totalOrders}
            totalSongs={totalSongs}
          />

          {message ? (
            <Alert
              className="mt-5"
              variant={message.type === "error" ? "destructive" : "default"}
            >
              <AlertTitle>
                {message.type === "error" ? "Erro" : "Sucesso"}
              </AlertTitle>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          ) : null}

          <div className="mt-auto grid gap-3 max-xl:mt-8 max-xl:grid-cols-5 max-lg:grid-cols-2 max-sm:grid-cols-1">
            <ActionButton
              onClick={createComanda}
              disabled={isMutating}
              tone="primary"
            >
              {isMutating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-5" />
              )}{" "}
              Criar Comanda
            </ActionButton>
            <ActionButton
              onClick={() => setAddOpen(true)}
              disabled={!selected || isMutating}
            >
              <Package className="size-4" /> Adicionar
            </ActionButton>
            <ActionButton
              onClick={() => setPendingAction("remover")}
              disabled={!selected || !removableOrder || isMutating}
            >
              <Trash2 className="size-4" /> Remover
            </ActionButton>
            <ActionButton
              onClick={() => setPendingAction("finalizar")}
              disabled={!selected || isMutating}
              tone="success"
            >
              <Check className="size-4" /> Finalizar
            </ActionButton>
            <ActionButton
              onClick={() => setPendingAction("cancelar")}
              disabled={!selected || isMutating}
              tone="danger"
            >
              <X className="size-4" /> Cancelar
            </ActionButton>
          </div>
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
              <div className="grid max-w-[650px] grid-cols-3 gap-3 max-md:max-w-none max-md:grid-cols-2 max-sm:grid-cols-1">
                {comandas.map((comanda) => (
                  <ComandaCard
                    key={comanda.id}
                    comanda={comanda}
                    selected={selected?.id === comanda.id}
                    onClick={() => setSelectedId(comanda.id)}
                  />
                ))}
              </div>

              <section className="mt-6 max-w-[980px]">
                <div className="flex items-end justify-between gap-4">
                  <h2 className="text-[22px] font-bold tracking-normal">
                    Pedidos
                  </h2>
                  <span className="text-sm font-semibold text-muted-foreground">
                    {selected
                      ? `${selected.tableName} - ${formatDate(selected.openedAt)}`
                      : "Nenhuma comanda"}
                  </span>
                </div>
                <OrdersTable orders={selected?.orders ?? []} />
              </section>
            </TabsContent>

            <TabsContent value="history" className="mt-0 max-w-[860px]">
              <HistoryTable />
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
              {selected?.tableName}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <label className="grid gap-1 text-sm font-semibold">
              Produto
              <select
                className="h-9 rounded-lg border border-input bg-background px-3"
                value={productId}
                onChange={(event) => setProductId(event.target.value)}
              >
                {productOptions.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} - {money.format(Number(product.price))}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Funcionario
              <select
                className="h-9 rounded-lg border border-input bg-background px-3"
                value={employeeId}
                onChange={(event) => setEmployeeId(event.target.value)}
              >
                {board.employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Quantidade
              <input
                className="h-9 rounded-lg border border-input bg-background px-3"
                min={1}
                type="number"
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
              />
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={addOrder} disabled={isMutating}>
              {isMutating ? "Salvando..." : "Adicionar pedido"}
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
              {getActionDescription(pendingAction, selected, removableOrder)}
            </DialogDescription>
          </DialogHeader>
          {selected ? (
            <Card className="shadow-none">
              <CardContent className="space-y-2 p-4 text-sm">
                <div className="flex justify-between">
                  <span>Comanda</span>
                  <strong>{selected.tableName}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Status</span>
                  <strong>{statusLabel[selected.status]}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Pedidos</span>
                  <strong>{selected.orders.length}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Total</span>
                  <strong>{money.format(selectedTotal)}</strong>
                </div>
              </CardContent>
            </Card>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingAction(null)}>
              Voltar
            </Button>
            <Button
              onClick={confirmPendingAction}
              disabled={isMutating}
              className={
                pendingAction === "cancelar" || pendingAction === "remover"
                  ? "bg-red-900 text-white hover:bg-red-950"
                  : ""
              }
            >
              {isMutating ? "Processando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}

function CashPanel({
  totalRevenue,
  totalOrders,
  totalSongs,
}: {
  totalRevenue: number
  totalOrders: number
  totalSongs: number
}) {
  return (
    <Card className="border-0 bg-transparent py-0 shadow-none ring-0">
      <CardHeader className="px-0">
        <CardTitle className="text-[22px] font-bold tracking-normal">
          Caixa
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-0 text-sm">
        <Metric
          icon={Clock3}
          label="Tempo Aberto"
          value="3 horas e 24 minutos"
        />
        <Metric icon={Calendar} label="Ultima Vez Aberto" value="20:24, Hoje" />
        <Metric
          icon={Calendar}
          label="Ultima Vez Fechado"
          value="01:33, 25 de Abril, 2026"
        />
        <Metric
          icon={CircleDollarSign}
          label="Balanca"
          value={money.format(totalRevenue)}
        />
        <Metric
          icon={ReceiptText}
          label="Pedidos"
          value={String(totalOrders).padStart(2, "0")}
        />
        <Metric
          icon={ListMusic}
          label="Musicas na fila"
          value={String(totalSongs).padStart(2, "0")}
        />
      </CardContent>
    </Card>
  )
}

function Metric({
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

function ActionButton({
  children,
  tone = "default",
  ...props
}: React.ComponentProps<typeof Button> & {
  tone?: "default" | "primary" | "success" | "danger"
}) {
  return (
    <Button
      {...props}
      className={cn(
        "h-11 rounded-xl text-sm font-bold shadow-none",
        tone === "default" &&
          "border-border bg-card text-card-foreground hover:bg-muted",
        tone === "primary" &&
          "bg-purple-300 text-purple-950 ring-4 ring-purple-100 hover:bg-purple-400",
        tone === "success" && "bg-emerald-600 text-white hover:bg-emerald-700",
        tone === "danger" && "bg-red-900 text-white hover:bg-red-950"
      )}
    >
      {children}
    </Button>
  )
}

function ComandaCard({
  comanda,
  selected,
  onClick,
}: {
  comanda: Comanda
  selected: boolean
  onClick: () => void
}) {
  const queue = getQueue(comanda.id)

  return (
    <button type="button" className="text-left" onClick={onClick}>
      <Card
        className={cn(
          "min-h-[320px] rounded-[18px] bg-card p-2 text-card-foreground transition hover:ring-purple-300",
          selected && "ring-2 ring-purple-200",
          comanda.status === "cancelada" && "opacity-55"
        )}
      >
        <div className="h-[108px] rounded-[14px] bg-muted" />
        <CardContent className="px-2 pt-3 pb-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-[15px] leading-none font-bold">
                {comanda.tableName}
              </h2>
              <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                <Clock3 className="size-3.5" /> {formatDate(comanda.openedAt)}
              </p>
            </div>
            <Badge
              className={cn(
                "rounded-md px-2 py-1 text-[11px] font-bold",
                statusClass[comanda.status]
              )}
            >
              {statusLabel[comanda.status]}
            </Badge>
          </div>
          <p className="mt-3 text-xs font-semibold text-muted-foreground">
            Membros
          </p>
          <AvatarGroup className="mt-1 -space-x-1.5">
            {comanda.members.map((member, index) => (
              <MemberAvatar
                key={`${member.name}-${index}`}
                label={member.avatar}
                tone={index}
              />
            ))}
          </AvatarGroup>
          <Separator className="my-3" />
          <div className="space-y-1.5">
            <p className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
              <ListMusic className="size-3.5" /> Fila de musicas
            </p>
            {queue.slice(0, 2).map((song, index) => (
              <p
                key={song}
                className="truncate text-xs font-semibold text-foreground"
              >
                {index + 1}. {song}
              </p>
            ))}
            {queue.length > 2 ? (
              <p className="text-xs font-semibold text-muted-foreground">
                +{queue.length - 2} na fila
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </button>
  )
}

function OrdersTable({ orders }: { orders: Order[] }) {
  return (
    <div className="mt-4 overflow-hidden">
      <Table>
        <TableHeader className="max-lg:hidden">
          <TableRow className="border-border hover:bg-transparent">
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
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length ? (
            orders.map((order) => (
              <TableRow
                key={order.id}
                className="border-border hover:bg-muted/60 max-lg:grid max-lg:grid-cols-1"
              >
                <TableCell className="px-4 font-semibold underline underline-offset-4">
                  {order.product}
                </TableCell>
                <TableCell className="font-semibold">
                  <span className="flex items-center gap-2">
                    <MemberAvatar label={order.employeeAvatar} tone={1} />{" "}
                    {order.employee}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    className={cn(
                      "rounded-md px-2 py-1 text-xs font-bold",
                      statusClass[order.status]
                    )}
                  >
                    {statusLabel[order.status]}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">
                  {formatDate(order.orderedAt)}
                </TableCell>
                <TableCell className="px-4 text-right font-semibold max-lg:text-left">
                  {String(order.quantity).padStart(2, "0")}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={5}
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

function HistoryTable() {
  return (
    <Card className="rounded-xl py-0 shadow-none">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Dia</TableHead>
            <TableHead>Comandas</TableHead>
            <TableHead>Musicas</TableHead>
            <TableHead className="text-right">Receita</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {historyRows.map((row) => (
            <TableRow key={row.date}>
              <TableCell className="font-semibold">{row.date}</TableCell>
              <TableCell>{row.comandas}</TableCell>
              <TableCell>{row.songs}</TableCell>
              <TableCell className="text-right font-semibold">
                {money.format(row.revenue)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}

function MemberAvatar({ label, tone }: { label: string; tone: number }) {
  return (
    <Avatar
      size="sm"
      className={avatarTones[tone % avatarTones.length]}
      title={label}
    >
      <AvatarFallback
        className={cn(
          "text-xs font-bold",
          avatarTones[tone % avatarTones.length]
        )}
      >
        {label}
      </AvatarFallback>
    </Avatar>
  )
}

function calculateClientTotal(
  comanda: Comanda,
  products: BoardData["products"]
) {
  return comanda.orders.reduce((sum, order) => {
    const product = products.find((item) => item.name === order.product)
    return order.status === "cancelada"
      ? sum
      : sum + Number(product?.price ?? 0) * order.quantity
  }, 0)
}

function getActionTitle(action: PendingAction) {
  if (action === "finalizar") return "Finalizar comanda"
  if (action === "cancelar") return "Cancelar comanda"
  if (action === "remover") return "Remover pedido"
  return "Confirmar acao"
}

function getActionDescription(
  action: PendingAction,
  comanda?: Comanda,
  order?: Order
) {
  if (action === "finalizar")
    return "Confira o resumo antes de finalizar. Depois disso, a comanda deixa de aceitar alteracoes."
  if (action === "cancelar")
    return "Esta acao cancela a comanda aberta e marca os pedidos como cancelados."
  if (action === "remover")
    return order
      ? `Remover o pedido ${order.product} de ${comanda?.tableName}?`
      : "Nenhum pedido disponivel para remover."
  return "Confirme para continuar."
}

function getQueue(comandaId: number) {
  return queueByTable[comandaId] ?? ["Aguardando primeira musica"]
}

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  }).format(new Date(date))
}
