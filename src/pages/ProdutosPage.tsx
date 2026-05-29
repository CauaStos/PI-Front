import { Calendar, Loader2, PackageSearch, Pencil, Plus, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { api } from "@/lib/api"
import { format as formatMoney, parseInput } from "@/lib/money"
import type { Product } from "@/src/data/comanda-board"

export default function ProdutosPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [selected, setSelected] = useState<Product | null>(null)
    const [loading, setLoading] = useState(true)
    const [isMutating, setIsMutating] = useState(false)
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

    // Create dialog
    const [createOpen, setCreateOpen] = useState(false)
    const [newName, setNewName] = useState("")
    const [newPrice, setNewPrice] = useState("")
    const [newStock, setNewStock] = useState("0")
    const [newDesc, setNewDesc] = useState("")

    // Edit dialog
    const [editOpen, setEditOpen] = useState(false)
    const [editName, setEditName] = useState("")
    const [editPrice, setEditPrice] = useState("")
    const [editStock, setEditStock] = useState("0")
    const [editDesc, setEditDesc] = useState("")

    async function reload() {
        const data = await api.get<Product[]>("/products")
        setProducts(data)
        return data
    }

    useEffect(() => {
        reload()
            .then((data) => {
                if (data.length > 0) setSelected(data[0]!)
            })
            .catch(() => setMessage({ type: "error", text: "Erro ao carregar produtos." }))
            .finally(() => setLoading(false))
    }, [])

    async function mutate(action: () => Promise<string>) {
        setIsMutating(true)
        setMessage(null)
        try {
            const text = await action()
            const data = await reload()
            setMessage({ type: "success", text })
            return data
        } catch (err) {
            setMessage({
                type: "error",
                text: err instanceof Error ? err.message : "Operacao falhou.",
            })
            return null
        } finally {
            setIsMutating(false)
        }
    }

    async function handleCreate() {
        const price = parseInput(newPrice)
        if (isNaN(price)) {
            setMessage({ type: "error", text: "Preco invalido. Use formato: 24,90" })
            return
        }
        const data = await mutate(async () => {
            await api.post("/products", {
                name: newName.trim(),
                price,
                stock: Number(newStock),
                description: newDesc.trim(),
            })
            return "Produto cadastrado."
        })
        if (data) {
            setCreateOpen(false)
            setNewName("")
            setNewPrice("")
            setNewStock("0")
            setNewDesc("")
            setSelected(data.find((p) => p.name === newName.trim()) ?? data[0]!)
        }
    }

    function openEdit(product: Product) {
        setEditName(product.name)
        setEditPrice(String(product.price / 10_000))
        setEditStock(String(product.stock))
        setEditDesc(product.description ?? "")
        setEditOpen(true)
    }

    async function handleEdit() {
        if (!selected) return
        const price = parseInput(editPrice)
        if (isNaN(price)) {
            setMessage({ type: "error", text: "Preco invalido. Use formato: 24,90" })
            return
        }
        const data = await mutate(async () => {
            await api.patch(`/products/${selected.id}`, {
                name: editName.trim(),
                price,
                stock: Number(editStock),
                description: editDesc.trim(),
            })
            return "Produto atualizado."
        })
        if (data) {
            setEditOpen(false)
            setSelected(data.find((p) => p.id === selected.id) ?? data[0]!)
        }
    }

    async function handleDelete(product: Product) {
        if (!confirm(`Remover o produto "${product.name}"?`)) return
        const data = await mutate(async () => {
            await api.delete(`/products/${product.id}`)
            return "Produto removido."
        })
        if (data) setSelected(data[0] ?? null)
    }

    function formatDate(date: string) {
        return new Intl.DateTimeFormat("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "short",
            year: "numeric",
        }).format(new Date(date))
    }

    if (loading) {
        return (
            <main className="flex min-h-svh items-center justify-center">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </main>
        )
    }

    return (
        <main className="min-h-svh bg-white px-10 py-8 text-zinc-950 max-sm:px-5 dark:bg-zinc-950 dark:text-zinc-50">
            <div className="mx-auto max-w-[1160px]">
                <div className="mb-6 flex items-center justify-between gap-4">
                    <h1 className="text-[22px] font-bold tracking-normal">Produtos</h1>
                    <Button
                        className="bg-purple-300 text-purple-950 ring-4 ring-purple-100 hover:bg-purple-400"
                        onClick={() => setCreateOpen(true)}
                    >
                        <Plus className="size-4" /> Cadastrar Produto
                    </Button>
                </div>

                {message ? (
                    <div
                        className={`mb-4 rounded-lg px-4 py-3 text-sm font-semibold ${
                            message.type === "error"
                                ? "bg-red-100 text-red-800"
                                : "bg-emerald-100 text-emerald-800"
                        }`}
                    >
                        {message.text}
                    </div>
                ) : null}

                {/* Product list */}
                <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {products.map((product) => (
                        <button
                            key={product.id}
                            type="button"
                            onClick={() => setSelected(product)}
                            className={`rounded-[14px] border p-4 text-left transition hover:border-purple-300 ${
                                selected?.id === product.id
                                    ? "border-purple-300 ring-2 ring-purple-200"
                                    : "border-zinc-200 dark:border-zinc-800"
                            }`}
                        >
                            <p className="text-sm font-bold truncate">{product.name}</p>
                            <p className="mt-1 text-xs font-semibold text-zinc-500">
                                {formatMoney(product.price)}
                            </p>
                            <Badge className="mt-2 bg-zinc-100 text-zinc-700 text-xs">
                                {product.stock} em estoque
                            </Badge>
                        </button>
                    ))}
                </div>

                {/* Selected product detail */}
                {selected ? (
                    <Card className="rounded-[18px] shadow-none">
                        <CardContent className="grid grid-cols-[1fr_300px] gap-8 p-5 max-lg:grid-cols-1">
                            <div>
                                <h2 className="text-[22px] font-bold tracking-normal">
                                    {selected.name}
                                </h2>
                                {selected.description ? (
                                    <p className="mt-2 text-sm text-zinc-500">{selected.description}</p>
                                ) : null}
                                <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-zinc-500">
                                    <Calendar className="size-4" /> Cadastrado Em
                                </p>
                                <p className="mt-1 text-sm font-semibold">
                                    {formatDate(selected.createdAt)}
                                </p>
                                <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-zinc-500">
                                    <PackageSearch className="size-4" /> Preco Atual
                                </p>
                                <p className="mt-1 text-sm font-semibold">
                                    {formatMoney(selected.price)}
                                </p>
                                <p className="mt-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                    {selected.stock} itens no estoque
                                </p>
                                <div className="mt-8 grid max-w-52 gap-3">
                                    <Button
                                        className="bg-purple-300 text-purple-950 ring-4 ring-purple-100 hover:bg-purple-400"
                                        onClick={() => openEdit(selected)}
                                    >
                                        <Pencil className="size-4" /> Editar Produto
                                    </Button>
                                    <Button
                                        className="bg-red-900 text-white hover:bg-red-950"
                                        onClick={() => handleDelete(selected)}
                                        disabled={isMutating}
                                    >
                                        <Trash2 className="size-4" /> Remover Produto
                                    </Button>
                                </div>
                            </div>
                            <div className="h-72 rounded-[14px] bg-zinc-200 dark:bg-zinc-800" />
                        </CardContent>
                    </Card>
                ) : (
                    <p className="text-sm text-muted-foreground">Nenhum produto cadastrado.</p>
                )}
            </div>

            {/* Create product dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cadastrar produto</DialogTitle>
                        <DialogDescription>
                            Preencha os dados do novo produto.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4">
                        <label className="grid gap-1 text-sm font-semibold">
                            Nome
                            <input
                                className="h-9 rounded-lg border border-input bg-background px-3"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="X-Bacon"
                            />
                        </label>
                        <label className="grid gap-1 text-sm font-semibold">
                            Preco (R$)
                            <input
                                className="h-9 rounded-lg border border-input bg-background px-3"
                                value={newPrice}
                                onChange={(e) => setNewPrice(e.target.value)}
                                placeholder="24,90"
                            />
                        </label>
                        <label className="grid gap-1 text-sm font-semibold">
                            Estoque
                            <input
                                className="h-9 rounded-lg border border-input bg-background px-3"
                                type="number"
                                min={0}
                                value={newStock}
                                onChange={(e) => setNewStock(e.target.value)}
                            />
                        </label>
                        <label className="grid gap-1 text-sm font-semibold">
                            Descricao (opcional)
                            <input
                                className="h-9 rounded-lg border border-input bg-background px-3"
                                value={newDesc}
                                onChange={(e) => setNewDesc(e.target.value)}
                                placeholder="Descricao do produto"
                            />
                        </label>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleCreate} disabled={isMutating}>
                            {isMutating ? "Salvando..." : "Cadastrar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit product dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar produto</DialogTitle>
                        <DialogDescription>Altere os dados do produto.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4">
                        <label className="grid gap-1 text-sm font-semibold">
                            Nome
                            <input
                                className="h-9 rounded-lg border border-input bg-background px-3"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                            />
                        </label>
                        <label className="grid gap-1 text-sm font-semibold">
                            Preco (R$)
                            <input
                                className="h-9 rounded-lg border border-input bg-background px-3"
                                value={editPrice}
                                onChange={(e) => setEditPrice(e.target.value)}
                                placeholder="24,90"
                            />
                        </label>
                        <label className="grid gap-1 text-sm font-semibold">
                            Estoque
                            <input
                                className="h-9 rounded-lg border border-input bg-background px-3"
                                type="number"
                                min={0}
                                value={editStock}
                                onChange={(e) => setEditStock(e.target.value)}
                            />
                        </label>
                        <label className="grid gap-1 text-sm font-semibold">
                            Descricao
                            <input
                                className="h-9 rounded-lg border border-input bg-background px-3"
                                value={editDesc}
                                onChange={(e) => setEditDesc(e.target.value)}
                            />
                        </label>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleEdit} disabled={isMutating}>
                            {isMutating ? "Salvando..." : "Salvar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    )
}
