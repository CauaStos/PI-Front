import {
    Calendar,
    Check,
    ChevronDown,
    CircleDollarSign,
    Clock3,
    History,
    ListMusic,
    Loader2,
    MoreHorizontal,
    Pencil,
    Plus,
    QrCode,
    ReceiptText,
    Trash2,
    X,
} from "lucide-react"
import { Fragment, useEffect, useState } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/lib/api"
import { format as formatMoney, multiply, sum } from "@/lib/money"
import { cn } from "@/lib/utils"
import type {
    ComandaBoardData,
    ComandaOrder,
    OrderStatus,
    Song,
} from "@/src/data/comanda-board"

type BoardData = ComandaBoardData
type Comanda = BoardData["comandas"][number]
type HistoryComanda = {
    id: string
    number: string
    status: OrderStatus
    openedAt: Date
    closedAt: Date
    orders: number
    revenue: number
}
type HistoryRow = {
    dayKey: string
    label: string
    closed: number
    finished: number
    cancelled: number
    orders: number
    revenue: number
    averageTicket: number
    firstClosedAt: Date
    lastClosedAt: Date
    comandas: HistoryComanda[]
}
type PendingAction =
    | { type: "finalizar-comanda"; comanda: Comanda }
    | { type: "cancelar-comanda"; comanda: Comanda }
    | { type: "remover-pedidos"; orders: ComandaOrder[] }
    | null

const comandaStatusLabel: Record<OrderStatus, string> = {
    open: "Aberta",
    in_progress: "Em Andamento",
    delivered: "Entregue",
    finished: "Finalizada",
    cancelled: "Cancelada",
}

const orderStatusLabel: Record<OrderStatus, string> = {
    open: "Aberto",
    in_progress: "Em Andamento",
    delivered: "Entregue",
    finished: "Concluido",
    cancelled: "Cancelado",
}

const orderStatusOptions: OrderStatus[] = [
    "open",
    "in_progress",
    "delivered",
    "finished",
    "cancelled",
]

const completedOrderStatuses = new Set<OrderStatus>(["delivered", "finished"])
const cashTimeZone = "America/Sao_Paulo"

const statusClass: Record<OrderStatus, string> = {
    open: "bg-zinc-100 text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-200",
    in_progress: "bg-pink-200 text-pink-900 hover:bg-pink-200",
    delivered: "bg-cyan-200 text-cyan-950 hover:bg-cyan-200",
    finished: "bg-emerald-200 text-emerald-950 hover:bg-emerald-200",
    cancelled: "bg-red-200 text-red-950 hover:bg-red-200",
}

const comandaHeaderClass: Record<OrderStatus, string> = {
    open: "bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-50",
    in_progress: "bg-pink-200 text-pink-950",
    delivered: "bg-cyan-200 text-cyan-950",
    finished: "bg-emerald-200 text-emerald-950",
    cancelled: "bg-red-200 text-red-950",
}

const avatarTones = [
    "bg-violet-200 text-violet-950",
    "bg-pink-200 text-pink-950",
    "bg-cyan-200 text-cyan-950",
]

const qrCells = new Set([
    0, 1, 2, 4, 5, 6,
    7, 9, 11, 13,
    14, 15, 16, 18, 20,
    22, 24, 25, 27,
    28, 30, 32, 34,
    35, 37, 39, 40,
    42, 43, 44, 46, 47, 48,
])

export function ComandaBoard({ initialData }: { initialData: BoardData }) {
    const [board, setBoard] = useState(initialData)
    const [now, setNow] = useState(() => new Date())
    const [selectedId, setSelectedId] = useState(initialData.comandas[0]?.id)
    const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([])
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
    const [pendingAction, setPendingAction] = useState<PendingAction>(null)
    const [addOpen, setAddOpen] = useState(false)
    const [editOrder, setEditOrder] = useState<ComandaOrder | null>(null)
    const [isMutating, setIsMutating] = useState(false)

    const [productId, setProductId] = useState(initialData.products[0]?.id ?? "")
    const [employeeId, setEmployeeId] = useState(initialData.employees[0]?.id ?? "")
    const [quantity, setQuantity] = useState(1)

    const [editProductId, setEditProductId] = useState("")
    const [editEmployeeId, setEditEmployeeId] = useState("")
    const [editQuantity, setEditQuantity] = useState(1)

    const comandas = board.comandas
    const todayKey = getDayKey(now)
    const todayComandas = comandas.filter((comanda) => isVisibleInToday(comanda, todayKey))
    const selected = todayComandas.find((c) => c.id === selectedId) ?? todayComandas[0]
    const productOptions = board.products.filter((p) => p.stock > 0)
    const activeComandas = comandas.filter((c) => c.status !== "finished" && c.status !== "cancelled")
    const finishedToday = comandas.filter((c) => c.status === "finished" && isClosedOnDay(c, todayKey))
    const cashOrders = finishedToday.reduce((s, c) => s + c.orders.length, 0)
    const cashRevenue = finishedToday.reduce((s, c) => s + calcTotal(c), 0)
    const historyRows = buildHistoryRows(comandas)
    const selectedOrders = selected?.orders.filter((order) => selectedOrderIds.includes(order.id)) ?? []

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
            await api.post("/tabs", { tableName: nextComandaName(comandas.length + 1) })
            return "Comanda criada."
        })
    }

    async function addOrder() {
        if (!selected) return
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
        const ok = await mutate(async () => {
            await api.patch(`/orders/${editOrder.id}`, {
                product: editProductId !== editOrder.product ? editProductId : undefined,
                employee: editEmployeeId !== editOrder.employee ? editEmployeeId : undefined,
                quantity: editQuantity !== editOrder.quantity ? editQuantity : undefined,
            })
            return "Pedido editado."
        })
        if (ok) setEditOrder(null)
    }

    async function updateOrderStatus(order: ComandaOrder, status: OrderStatus) {
        if (order.status === status) return
        await mutate(async () => {
            await api.patch(`/orders/${order.id}`, { status })
            return "Status do pedido atualizado."
        })
    }

    async function cancelOrder(order: ComandaOrder) {
        await updateOrderStatus(order, "cancelled")
    }

    async function confirmPendingAction() {
        if (!pendingAction) return
        let ok = false

        if (pendingAction.type === "finalizar-comanda") {
            ok = await mutate(async () => {
                await api.patch(`/tabs/${pendingAction.comanda.id}`, { status: "finished" })
                return "Comanda finalizada."
            })
        }

        if (pendingAction.type === "cancelar-comanda") {
            ok = await mutate(async () => {
                await api.patch(`/tabs/${pendingAction.comanda.id}`, { status: "cancelled" })
                return "Comanda cancelada."
            })
        }

        if (pendingAction.type === "remover-pedidos") {
            ok = await mutate(async () => {
                await Promise.all(pendingAction.orders.map((order) => api.delete(`/orders/${order.id}`)))
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
                        <Alert variant={message.type === "error" ? "destructive" : "default"}>
                            <AlertTitle>{message.type === "error" ? "Erro" : "Sucesso"}</AlertTitle>
                            <AlertDescription>{message.text}</AlertDescription>
                        </Alert>
                    ) : null}
                </section>

                <section className="min-w-0">
                    <Tabs defaultValue="today" className="gap-6">
                        <div className="flex items-center justify-between gap-4">
                            <h1 className="text-[22px] font-bold tracking-normal">Comandas</h1>
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
                                        <CreateComandaCard onClick={createComanda} disabled={isMutating} />
                                        {todayComandas.map((comanda) => (
                                            <ComandaCard
                                                key={comanda.id}
                                                comanda={comanda}
                                                selected={selected?.id === comanda.id}
                                                onClick={() => selectComanda(comanda.id)}
                                                onFinish={() =>
                                                    setPendingAction({ type: "finalizar-comanda", comanda })
                                                }
                                                onCancel={() =>
                                                    setPendingAction({ type: "cancelar-comanda", comanda })
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
                                    <h2 className="text-[22px] font-bold tracking-normal">Pedidos</h2>
                                    <span className="text-sm font-semibold text-muted-foreground">
                                        {selected
                                            ? `${displayComandaName(selected.tableName)} - ${formatDate(selected.openedAt)}`
                                            : "Nenhuma comanda"}
                                    </span>
                                </div>
                                <OrdersTable
                                    orders={selected?.orders ?? []}
                                    selectedIds={selectedOrderIds}
                                    isMutating={isMutating}
                                    onSelectedIdsChange={setSelectedOrderIds}
                                    onAdd={() => setAddOpen(true)}
                                    onEdit={openEditDialog}
                                    onCancel={cancelOrder}
                                    onStatusChange={updateOrderStatus}
                                    onRemoveSelected={() =>
                                        setPendingAction({
                                            type: "remover-pedidos",
                                            orders: selectedOrders.filter((order) => canDeleteOrder(order)),
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
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(Number(e.target.value))}
                            />
                        </label>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={addOrder} disabled={isMutating || !selected}>
                            {isMutating ? "Salvando..." : "Adicionar pedido"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={editOrder !== null} onOpenChange={(open) => !open && setEditOrder(null)}>
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
                                type="number"
                                value={editQuantity}
                                onChange={(e) => setEditQuantity(Number(e.target.value))}
                            />
                        </label>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditOrder(null)}>
                            Cancelar
                        </Button>
                        <Button onClick={saveEditOrder} disabled={isMutating}>
                            {isMutating ? "Salvando..." : "Salvar alteracoes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={pendingAction !== null} onOpenChange={(open) => !open && setPendingAction(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{getActionTitle(pendingAction)}</DialogTitle>
                        <DialogDescription>{getActionDescription(pendingAction)}</DialogDescription>
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

function CashPanel({
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
                <CardTitle className="text-[22px] font-bold tracking-normal">Caixa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-0 text-sm">
                <Metric icon={Calendar} label="Caixa de hoje" value={cashDate} />
                <Metric icon={Clock3} label="Virada" value="00:00" />
                <Metric icon={Clock3} label="Proxima virada" value="Amanha, 00:00" />
                <Metric icon={CircleDollarSign} label="Balanca" value={formatMoney(totalRevenue)} />
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
            <p className="mt-1 text-[13px] leading-snug font-semibold text-foreground">{value}</p>
        </div>
    )
}

function CreateComandaCard({
    onClick,
    disabled,
}: {
    onClick: () => void
    disabled: boolean
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label="Criar comanda"
            title="Criar comanda"
            className="min-h-[236px] animate-in fade-in-0 zoom-in-95 rounded-[18px] border-2 border-dashed border-zinc-300 bg-muted/30 text-muted-foreground transition duration-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-950 disabled:pointer-events-none disabled:opacity-60 dark:hover:bg-purple-950/20 dark:hover:text-purple-100"
        >
            <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-background shadow-sm">
                {disabled ? <Loader2 className="size-8 animate-spin" /> : <Plus className="size-9" />}
            </span>
        </button>
    )
}

function ComandaCard({
    comanda,
    selected,
    onClick,
    onFinish,
    onCancel,
    songs,
}: {
    comanda: Comanda
    selected: boolean
    onClick: () => void
    onFinish: () => void
    onCancel: () => void
    songs: Song[]
}) {
    const queue = songs.filter(
        (song) => song.tab === comanda.id && (song.status === "playing" || song.status === "queued")
    )
    const terminal = comanda.status === "finished" || comanda.status === "cancelled"

    return (
        <Card
            className={cn(
                "min-h-[236px] animate-in fade-in-0 zoom-in-95 rounded-[18px] bg-card p-2 text-card-foreground transition duration-200 hover:ring-purple-300",
                selected && "ring-2 ring-purple-200",
                comanda.status === "cancelled" && "opacity-55"
            )}
        >
            <CardContent className="px-2 pt-2 pb-2">
                <button type="button" className="w-full min-w-0 text-left" onClick={onClick}>
                    <h2
                        className={cn(
                            "inline-flex max-w-full items-center gap-2 rounded-[10px] px-3 py-2 text-[24px] leading-none font-bold",
                            comandaHeaderClass[comanda.status]
                        )}
                    >
                        <span>{displayComandaNumber(comanda.tableName)}</span>
                        <span className="min-w-0 truncate text-[11px] leading-none font-black uppercase">
                            {comandaStatusLabel[comanda.status]}
                        </span>
                    </h2>
                    <p className="mt-2 text-[11px] font-bold text-muted-foreground">Aberta em</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                        <Clock3 className="size-3.5" /> {formatDate(comanda.openedAt)}
                    </p>
                </button>

                <button type="button" className="mt-3 w-full text-left" onClick={onClick}>
                    <div className="space-y-1.5">
                        <p className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                            <ListMusic className="size-3.5" /> Fila de musicas
                        </p>
                        {queue.slice(0, 2).map((song) => (
                            <p key={song.id} className="truncate text-xs font-semibold text-foreground">
                                {song.status === "playing" ? "Tocando: " : `${song.position}. `}
                                {song.title}
                            </p>
                        ))}
                        {queue.length > 2 ? (
                            <p className="text-xs font-semibold text-muted-foreground">
                                +{queue.length - 2} na fila
                            </p>
                        ) : null}
                        {queue.length === 0 ? (
                            <p className="text-xs font-semibold text-muted-foreground">
                                Aguardando primeira musica
                            </p>
                        ) : null}
                    </div>
                </button>

                <div className="mt-3 flex justify-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            aria-label={`Acoes de ${displayComandaName(comanda.tableName)}`}
                            className={cn(
                                "rounded-md px-2 py-1 text-muted-foreground hover:text-foreground",
                                "hover:bg-muted"
                            )}
                        >
                            <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                            {terminal ? (
                                <DropdownMenuItem disabled>Sem ações disponíveis</DropdownMenuItem>
                            ) : (
                                <>
                                    <DropdownMenuItem onClick={onFinish}>
                                        <Check className="size-4" /> Finalizar Comanda
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem variant="destructive" onClick={onCancel}>
                                        <X className="size-4" /> Cancelar Comanda
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardContent>
        </Card>
    )
}

function QrCodeSlot({ comanda }: { comanda?: Comanda }) {
    return (
        <aside className="h-fit rounded-[18px] border border-border bg-card p-3 text-card-foreground shadow-none">
            <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-muted-foreground">QR Code</p>
                <QrCode className="size-4 text-muted-foreground" />
            </div>
            <div className="mt-3 rounded-[14px] bg-white p-3 text-zinc-950 ring-1 ring-border">
                <div className="grid aspect-square grid-cols-7 gap-1">
                    {Array.from({ length: 49 }).map((_, index) => (
                        <span
                            key={index}
                            className={cn(
                                "rounded-[2px]",
                                qrCells.has(index) ? "bg-zinc-950" : "bg-white"
                            )}
                        />
                    ))}
                </div>
            </div>
            <p className="mt-3 truncate text-center text-sm font-bold">
                {comanda ? displayComandaName(comanda.tableName) : "Nenhuma comanda"}
            </p>
        </aside>
    )
}

function OrdersTable({
    orders,
    selectedIds,
    isMutating,
    onSelectedIdsChange,
    onAdd,
    onEdit,
    onCancel,
    onStatusChange,
    onRemoveSelected,
}: {
    orders: ComandaOrder[]
    selectedIds: string[]
    isMutating: boolean
    onSelectedIdsChange: (ids: string[]) => void
    onAdd: () => void
    onEdit: (order: ComandaOrder) => void
    onCancel: (order: ComandaOrder) => void
    onStatusChange: (order: ComandaOrder, status: OrderStatus) => void
    onRemoveSelected: () => void
}) {
    const deletableOrders = orders.filter(canDeleteOrder)
    const allSelected = deletableOrders.length > 0 && deletableOrders.every((o) => selectedIds.includes(o.id))
    const selectedCount = selectedIds.length

    function toggleAll() {
        onSelectedIdsChange(allSelected ? [] : deletableOrders.map((order) => order.id))
    }

    function toggleOrder(order: ComandaOrder) {
        if (!canDeleteOrder(order)) return
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
                    title="Adicionar pedido"
                    onClick={onAdd}
                    className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
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
                        disabled={isMutating}
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
                                disabled={deletableOrders.length === 0}
                                onChange={toggleAll}
                                aria-label="Selecionar pedidos"
                                className="size-4 rounded border-border accent-zinc-950"
                            />
                        </TableHead>
                        <TableHead className="px-4 text-xs font-bold text-muted-foreground">
                            Pedido
                        </TableHead>
                        <TableHead className="text-xs font-bold text-muted-foreground">Nome</TableHead>
                        <TableHead className="text-xs font-bold text-muted-foreground">Status</TableHead>
                        <TableHead className="text-xs font-bold text-muted-foreground">
                            Pedido Em
                        </TableHead>
                        <TableHead className="px-4 text-right text-xs font-bold text-muted-foreground">
                            Qtd
                        </TableHead>
                        <TableHead className="w-20 px-2 text-right">
                            <button
                                type="button"
                                title="Adicionar pedido"
                                onClick={onAdd}
                                className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
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
                            const locked = !canDeleteOrder(order)
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
                                                <DropdownMenuItem onClick={() => onEdit(order)}>
                                                    <Pencil className="size-4" /> Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    variant="destructive"
                                                    onClick={() => onCancel(order)}
                                                    disabled={order.status === "cancelled"}
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

function StatusSelector({
    order,
    onStatusChange,
}: {
    order: ComandaOrder
    onStatusChange: (order: ComandaOrder, status: OrderStatus) => void
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="rounded-md focus:outline-none focus:ring-2 focus:ring-ring">
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
                {orderStatusOptions.map((status) => (
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

function HistoryTable({
    rows,
}: {
    rows: HistoryRow[]
}) {
    const [expandedDays, setExpandedDays] = useState<string[]>(rows[0] ? [rows[0].dayKey] : [])

    function toggleDay(dayKey: string) {
        setExpandedDays((current) =>
            current.includes(dayKey)
                ? current.filter((key) => key !== dayKey)
                : [...current, dayKey]
        )
    }

    return (
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
                                        <TableCell className="text-right">{row.finished}</TableCell>
                                        <TableCell className="text-right">{row.cancelled}</TableCell>
                                        <TableCell>{row.orders}</TableCell>
                                        <TableCell className="font-medium text-muted-foreground">
                                            {formatTime(row.firstClosedAt)} - {formatTime(row.lastClosedAt)}
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
                                            <TableCell colSpan={8} className="bg-muted/25 px-4 py-3">
                                                <div className="grid gap-2">
                                                    {row.comandas.map((comanda) => (
                                                        <div
                                                            key={comanda.id}
                                                            className="grid grid-cols-[minmax(120px,1.2fr)_minmax(110px,0.9fr)_minmax(135px,1fr)_80px_100px] items-center gap-3 rounded-lg bg-background px-3 py-2 text-sm max-lg:grid-cols-2 max-sm:grid-cols-1"
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
    )
}

function ActionSummary({
    action,
}: {
    action: PendingAction
}) {
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

function MemberAvatar({ label, tone }: { label: string; tone: number }) {
    return (
        <Avatar size="sm" className={avatarTones[tone % avatarTones.length]} title={label}>
            <AvatarFallback
                className={cn("text-xs font-bold", avatarTones[tone % avatarTones.length])}
            >
                {label}
            </AvatarFallback>
        </Avatar>
    )
}

function canDeleteOrder(order: ComandaOrder) {
    return !completedOrderStatuses.has(order.status)
}

function isTabActive(comanda: Comanda) {
    return comanda.status !== "finished" && comanda.status !== "cancelled"
}

function isClosedOnDay(comanda: Comanda, dayKey: string) {
    if (!comanda.closedAt) return false
    return getDayKey(new Date(comanda.closedAt)) === dayKey
}

function isVisibleInToday(comanda: Comanda, todayKey: string) {
    return isTabActive(comanda) || isClosedOnDay(comanda, todayKey)
}

function buildHistoryRows(comandas: Comanda[]) {
    const rows = new Map<string, HistoryRow>()

    for (const comanda of comandas) {
        if (!comanda.closedAt || (comanda.status !== "finished" && comanda.status !== "cancelled")) {
            continue
        }

        const closedAt = new Date(comanda.closedAt)
        const dayKey = getDayKey(closedAt)
        const current = rows.get(dayKey) ?? {
            dayKey,
            label: formatDayLabel(closedAt),
            closed: 0,
            finished: 0,
            cancelled: 0,
            orders: 0,
            revenue: 0,
            averageTicket: 0,
            firstClosedAt: closedAt,
            lastClosedAt: closedAt,
            comandas: [],
        }

        const revenue = comanda.status === "finished" ? calcComandaTotal(comanda) : 0

        current.closed += 1
        current.comandas.push({
            id: comanda.id,
            number: displayComandaNumber(comanda.tableName),
            status: comanda.status,
            openedAt: new Date(comanda.openedAt),
            closedAt,
            orders: comanda.orders.length,
            revenue,
        })
        if (closedAt < current.firstClosedAt) current.firstClosedAt = closedAt
        if (closedAt > current.lastClosedAt) current.lastClosedAt = closedAt
        if (comanda.status === "finished") {
            current.finished += 1
            current.orders += comanda.orders.length
            current.revenue += revenue
        } else {
            current.cancelled += 1
        }
        current.averageTicket = current.finished > 0 ? Math.round(current.revenue / current.finished) : 0
        rows.set(dayKey, current)
    }

    return Array.from(rows.values())
        .map((row) => ({
            ...row,
            comandas: row.comandas.sort((a, b) => b.closedAt.getTime() - a.closedAt.getTime()),
        }))
        .sort((a, b) => b.dayKey.localeCompare(a.dayKey))
}

function getActionTitle(action: PendingAction) {
    if (action?.type === "finalizar-comanda") return "Finalizar comanda"
    if (action?.type === "cancelar-comanda") return "Cancelar comanda"
    if (action?.type === "remover-pedidos") return "Remover pedidos"
    return "Confirmar acao"
}

function getActionDescription(action: PendingAction) {
    if (action?.type === "finalizar-comanda")
        return "Confira a comanda antes de finalizar. Depois disso, ela deixa de aceitar alteracoes."
    if (action?.type === "cancelar-comanda")
        return "Esta acao cancela a comanda selecionada e marca seus pedidos como cancelados."
    if (action?.type === "remover-pedidos")
        return "Esta acao remove os pedidos selecionados. Pedidos entregues ou concluidos nao podem ser removidos."
    return "Confirme para continuar."
}

function isPendingActionEmpty(action: PendingAction) {
    return action?.type === "remover-pedidos" && action.orders.length === 0
}

function calcComandaTotal(comanda: Comanda): number {
    return sum(
        comanda.orders
            .filter((o) => o.status !== "cancelled")
            .map((o) => multiply(o.unitPrice, o.quantity))
    )
}

function nextComandaName(index: number) {
    return `Comanda ${String(index).padStart(2, "0")}`
}

function displayComandaName(name: string) {
    return name.replace(/^Mesa\s*/i, "Comanda ")
}

function displayComandaNumber(name: string) {
    return name.replace(/^(Mesa|Comanda)\s*/i, "")
}

function getDayKey(date: Date) {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: cashTimeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(date)
    const year = parts.find((part) => part.type === "year")?.value ?? "0000"
    const month = parts.find((part) => part.type === "month")?.value ?? "00"
    const day = parts.find((part) => part.type === "day")?.value ?? "00"
    return `${year}-${month}-${day}`
}

function formatCashDate(date: Date) {
    return new Intl.DateTimeFormat("pt-BR", {
        timeZone: cashTimeZone,
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date)
}

function formatDayLabel(date: Date) {
    return new Intl.DateTimeFormat("pt-BR", {
        timeZone: cashTimeZone,
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format(date)
}

function formatTime(date: Date) {
    return new Intl.DateTimeFormat("pt-BR", {
        timeZone: cashTimeZone,
        hour: "2-digit",
        minute: "2-digit",
    }).format(date)
}

function formatDate(date: string | Date) {
    return new Intl.DateTimeFormat("pt-BR", {
        timeZone: cashTimeZone,
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "short",
    }).format(new Date(date))
}
