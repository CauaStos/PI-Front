import {
    Calendar,
    Check,
    CircleDollarSign,
    Clock3,
    History,
    ListMusic,
    Loader2,
    Package,
    Pencil,
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
import { api } from "@/lib/api"
import { format as formatMoney, multiply, sum } from "@/lib/money"
import { cn } from "@/lib/utils"
import type {
    ComandaBoardData,
    ComandaOrder,
    OrderStatus,
} from "@/src/data/comanda-board"

type BoardData = ComandaBoardData
type Comanda = BoardData["comandas"][number]
type PendingAction = "finalizar" | "cancelar" | "remover" | null

const statusLabel: Record<OrderStatus, string> = {
    open: "Aberta",
    in_progress: "Em Andamento",
    delivered: "Entregue",
    finished: "Finalizada",
    cancelled: "Cancelada",
}

const statusClass: Record<OrderStatus, string> = {
    open: "bg-zinc-100 text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-200",
    in_progress: "bg-pink-200 text-pink-900 hover:bg-pink-200",
    delivered: "bg-cyan-200 text-cyan-950 hover:bg-cyan-200",
    finished: "bg-emerald-200 text-emerald-950 hover:bg-emerald-200",
    cancelled: "bg-red-200 text-red-950 hover:bg-red-200",
}

const avatarTones = [
    "bg-violet-200 text-violet-950",
    "bg-pink-200 text-pink-950",
    "bg-cyan-200 text-cyan-950",
]

const queueByTable: Record<string, string[]> = {}

const historyRows = [
    { date: "24 de Abril, 2026", comandas: 18, songs: 64, revenue: 13200000 },
    { date: "23 de Abril, 2026", comandas: 14, songs: 51, revenue: 9800000 },
    { date: "22 de Abril, 2026", comandas: 21, songs: 77, revenue: 16450000 },
]

export function ComandaBoard({ initialData }: { initialData: BoardData }) {
    const [board, setBoard] = useState(initialData)
    const [selectedId, setSelectedId] = useState(initialData.comandas[0]?.id)
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
    const [pendingAction, setPendingAction] = useState<PendingAction>(null)
    const [addOpen, setAddOpen] = useState(false)
    const [editOrder, setEditOrder] = useState<ComandaOrder | null>(null)
    const [isMutating, setIsMutating] = useState(false)

    // Add-order form state
    const [tableName, setTableName] = useState(
        `Mesa ${String(initialData.comandas.length + 1).padStart(2, "0")}`
    )
    const [productId, setProductId] = useState(initialData.products[0]?.id ?? "")
    const [employeeId, setEmployeeId] = useState(initialData.employees[0]?.id ?? "")
    const [quantity, setQuantity] = useState(1)

    // Edit-order form state
    const [editProductId, setEditProductId] = useState("")
    const [editEmployeeId, setEditEmployeeId] = useState("")
    const [editQuantity, setEditQuantity] = useState(1)
    const [editStatus, setEditStatus] = useState<OrderStatus>("in_progress")

    const comandas = board.comandas
    const selected = comandas.find((c) => c.id === selectedId) ?? comandas[0]
    const productOptions = board.products.filter((p) => p.stock > 0)
    const removableOrder = selected?.orders.at(-1)
    const totalOrders = comandas.reduce((s, c) => s + c.orders.length, 0)
    const totalSongs = comandas.reduce((s, c) => s + getQueue(c.id).length, 0)
    const selectedTotal = selected ? calcTotal(selected) : 0
    const totalRevenue = comandas.reduce((s, c) => s + calcTotal(c), 0)

    function calcTotal(comanda: Comanda): number {
        return sum(
            comanda.orders
                .filter((o) => o.status !== "cancelled")
                .map((o) => multiply(o.unitPrice, o.quantity))
        )
    }

    async function reload() {
        const [tabs, products, employees] = await Promise.all([
            api.get<BoardData["comandas"]>("/tabs"),
            api.get<BoardData["products"]>("/products"),
            api.get<BoardData["employees"]>("/employees"),
        ])
        const next = { comandas: tabs, products, employees }
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
        const ok = await mutate(async () => {
            await api.post("/tabs", { tableName: tableName.trim() })
            return "Comanda criada."
        })
        if (ok) setTableName(`Mesa ${String(board.comandas.length + 2).padStart(2, "0")}`)
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
        setEditStatus(order.status)
    }

    async function saveEditOrder() {
        if (!editOrder) return
        const ok = await mutate(async () => {
            await api.patch(`/orders/${editOrder.id}`, {
                product: editProductId !== editOrder.product ? editProductId : undefined,
                employee: editEmployeeId !== editOrder.employee ? editEmployeeId : undefined,
                quantity: editQuantity !== editOrder.quantity ? editQuantity : undefined,
                status: editStatus !== editOrder.status ? editStatus : undefined,
            })
            return "Pedido editado."
        })
        if (ok) setEditOrder(null)
    }

    async function confirmPendingAction() {
        if (!selected || !pendingAction) return
        let ok = false

        if (pendingAction === "finalizar") {
            ok = await mutate(async () => {
                await api.patch(`/tabs/${selected.id}`, { status: "finished" })
                return "Comanda finalizada."
            })
        }
        if (pendingAction === "cancelar") {
            ok = await mutate(async () => {
                await api.patch(`/tabs/${selected.id}`, { status: "cancelled" })
                return "Comanda cancelada."
            })
        }
        if (pendingAction === "remover" && removableOrder) {
            ok = await mutate(async () => {
                await api.delete(`/orders/${removableOrder.id}`)
                return "Pedido removido."
            })
        }

        if (ok) setPendingAction(null)
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
                            <AlertTitle>{message.type === "error" ? "Erro" : "Sucesso"}</AlertTitle>
                            <AlertDescription>{message.text}</AlertDescription>
                        </Alert>
                    ) : null}

                    <div className="mt-auto grid gap-3 max-xl:mt-8 max-xl:grid-cols-5 max-lg:grid-cols-2 max-sm:grid-cols-1">
                        <ActionButton onClick={createComanda} disabled={isMutating} tone="primary">
                            {isMutating ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <Plus className="size-5" />
                            )}{" "}
                            Criar Comanda
                        </ActionButton>
                        <ActionButton onClick={() => setAddOpen(true)} disabled={!selected || isMutating}>
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
                                    <h2 className="text-[22px] font-bold tracking-normal">Pedidos</h2>
                                    <span className="text-sm font-semibold text-muted-foreground">
                                        {selected
                                            ? `${selected.tableName} - ${formatDate(selected.openedAt)}`
                                            : "Nenhuma comanda"}
                                    </span>
                                </div>
                                <OrdersTable
                                    orders={selected?.orders ?? []}
                                    onEdit={openEditDialog}
                                />
                            </section>
                        </TabsContent>

                        <TabsContent value="history" className="mt-0 max-w-[860px]">
                            <HistoryTable />
                        </TabsContent>
                    </Tabs>
                </section>
            </div>

            {/* Add order dialog */}
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
                        <Button onClick={addOrder} disabled={isMutating}>
                            {isMutating ? "Salvando..." : "Adicionar pedido"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit order dialog */}
            <Dialog open={editOrder !== null} onOpenChange={(open) => !open && setEditOrder(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar pedido</DialogTitle>
                        <DialogDescription>
                            Altere produto, funcionario, quantidade ou status do pedido.
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
                        <label className="grid gap-1 text-sm font-semibold">
                            Status
                            <select
                                className="h-9 rounded-lg border border-input bg-background px-3"
                                value={editStatus}
                                onChange={(e) => setEditStatus(e.target.value as OrderStatus)}
                            >
                                <option value="in_progress">Em Andamento</option>
                                <option value="delivered">Entregue</option>
                                <option value="finished">Finalizado</option>
                                <option value="cancelled">Cancelado</option>
                            </select>
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

            {/* Confirm action dialog */}
            <Dialog open={pendingAction !== null} onOpenChange={(open) => !open && setPendingAction(null)}>
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
                                    <strong>{formatMoney(selectedTotal)}</strong>
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
                <CardTitle className="text-[22px] font-bold tracking-normal">Caixa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-0 text-sm">
                <Metric icon={Clock3} label="Tempo Aberto" value="3 horas e 24 minutos" />
                <Metric icon={Calendar} label="Ultima Vez Aberto" value="20:24, Hoje" />
                <Metric
                    icon={Calendar}
                    label="Ultima Vez Fechado"
                    value="01:33, 25 de Abril, 2026"
                />
                <Metric icon={CircleDollarSign} label="Balanca" value={formatMoney(totalRevenue)} />
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
            <p className="mt-1 text-[13px] leading-snug font-semibold text-foreground">{value}</p>
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
                tone === "default" && "border-border bg-card text-card-foreground hover:bg-muted",
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
                    comanda.status === "cancelled" && "opacity-55"
                )}
            >
                <div className="h-[108px] rounded-[14px] bg-muted" />
                <CardContent className="px-2 pt-3 pb-2">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <h2 className="text-[15px] leading-none font-bold">{comanda.tableName}</h2>
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
                    <p className="mt-3 text-xs font-semibold text-muted-foreground">Membros</p>
                    <AvatarGroup className="mt-1 -space-x-1.5">
                        {comanda.members.map((member, index) => (
                            <MemberAvatar
                                key={`${member.employee}-${index}`}
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
                            <p key={song} className="truncate text-xs font-semibold text-foreground">
                                {index + 1}. {song}
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
                </CardContent>
            </Card>
        </button>
    )
}

function OrdersTable({
    orders,
    onEdit,
}: {
    orders: ComandaOrder[]
    onEdit: (order: ComandaOrder) => void
}) {
    return (
        <div className="mt-4 overflow-hidden">
            <Table>
                <TableHeader className="max-lg:hidden">
                    <TableRow className="border-border hover:bg-transparent">
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
                        <TableHead className="w-10" />
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
                                    {order.productName}
                                </TableCell>
                                <TableCell className="font-semibold">
                                    <span className="flex items-center gap-2">
                                        <MemberAvatar label={order.employeeAvatar} tone={1} />{" "}
                                        {order.employeeName}
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
                                <TableCell className="px-2">
                                    <button
                                        type="button"
                                        title="Editar pedido"
                                        onClick={() => onEdit(order)}
                                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                    >
                                        <Pencil className="size-3.5" />
                                    </button>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell
                                colSpan={6}
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
                                {formatMoney(row.revenue)}
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
        <Avatar size="sm" className={avatarTones[tone % avatarTones.length]} title={label}>
            <AvatarFallback
                className={cn("text-xs font-bold", avatarTones[tone % avatarTones.length])}
            >
                {label}
            </AvatarFallback>
        </Avatar>
    )
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
    order?: ComandaOrder
) {
    if (action === "finalizar")
        return "Confira o resumo antes de finalizar. Depois disso, a comanda deixa de aceitar alteracoes."
    if (action === "cancelar")
        return "Esta acao cancela a comanda aberta e marca os pedidos como cancelados."
    if (action === "remover")
        return order
            ? `Remover o pedido ${order.productName} de ${comanda?.tableName}?`
            : "Nenhum pedido disponivel para remover."
    return "Confirme para continuar."
}

function getQueue(comandaId: string): string[] {
    return queueByTable[comandaId] ?? []
}

function formatDate(date: string | Date) {
    return new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "short",
    }).format(new Date(date))
}
