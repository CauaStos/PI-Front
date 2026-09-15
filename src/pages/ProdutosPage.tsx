import {
  Calendar,
  Loader2,
  PackageSearch,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react"
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
import { toast } from "sonner"
import { api } from "@/lib/api"
import { authClient } from "@/lib/auth-client"
import { format as formatMoney, parseInput } from "@/lib/money"
import type { Product } from "@/data/comanda-board"

export default function ProdutosPage() {
  const { data: session } = authClient.useSession()
  const currentUser = session?.user as
    { role?: string; employeeRole?: string } | undefined
  const isAdmin =
    currentUser?.employeeRole === "admin" || currentUser?.role === "admin"
  const [products, setProducts] = useState<Product[]>([])
  const [selected, setSelected] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [isMutating, setIsMutating] = useState(false)

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newPrice, setNewPrice] = useState("")
  const [newStock, setNewStock] = useState("0")
  const [newDesc, setNewDesc] = useState("")
  const [newImage, setNewImage] = useState("")

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
    let cancelled = false

    api
      .get<Product[]>("/products")
      .then((data) => {
        if (cancelled) return

        setProducts(data)
        if (data.length > 0) setSelected(data[0]!)
      })
      .catch(() => {
        if (!cancelled) toast.error("Erro ao carregar produtos.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  async function mutate(action: () => Promise<string>) {
    setIsMutating(true)
    try {
      const text = await action()
      const data = await reload()
      toast.success(text)
      return data
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operacao falhou.")
      return null
    } finally {
      setIsMutating(false)
    }
  }

  async function handleCreate() {
    const price = parseInput(newPrice)
    if (isNaN(price)) {
      toast.error("Preco invalido. Use formato: 24,90")
      return
    }
    const data = await mutate(async () => {
      await api.post("/products", {
        name: newName.trim(),
        price,
        stock: Number(newStock),
        description: newDesc.trim(),
        image: newImage || undefined,
      })
      return "Produto cadastrado."
    })
    if (data) {
      setCreateOpen(false)
      setNewName("")
      setNewPrice("")
      setNewStock("0")
      setNewDesc("")
      setNewImage("")
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
      toast.error("Preco invalido. Use formato: 24,90")
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
          {isAdmin ? (
            <Button
              className="bg-purple-300 text-purple-950 ring-4 ring-purple-100 hover:bg-purple-400"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="size-4" /> Cadastrar Produto
            </Button>
          ) : null}
        </div>

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
              {product.image ? (
                <img
                  src={product.image}
                  alt=""
                  className="mb-3 h-28 w-full rounded-lg object-cover"
                />
              ) : null}
              <p className="truncate text-sm font-bold">{product.name}</p>
              <p className="mt-1 text-xs font-semibold text-zinc-500">
                {formatMoney(product.price)}
              </p>
              <Badge className="mt-2 bg-zinc-100 text-xs text-zinc-700">
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
                  <p className="mt-2 text-sm text-zinc-500">
                    {selected.description}
                  </p>
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
                  {isAdmin ? (
                    <div className="grid gap-3">
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
                  ) : null}
                </div>
              </div>
              {selected.image ? (
                <img
                  src={selected.image}
                  alt={`Foto de ${selected.name}`}
                  className="h-72 w-full rounded-[14px] object-cover"
                />
              ) : (
                <div className="h-72 rounded-[14px] bg-zinc-200 dark:bg-zinc-800" />
              )}
            </CardContent>
          </Card>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhum produto cadastrado.
          </p>
        )}
      </div>

      {/* Create product dialog */}
      <Dialog
        open={isAdmin && createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open)
        }}
      >
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
            <label className="grid gap-1 text-sm font-semibold">
              Foto do produto (opcional)
              <input
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (!file) return
                  if (file.size > 5 * 1024 * 1024) {
                    toast.error("A foto deve ter no maximo 5 MB.")
                    event.target.value = ""
                    return
                  }
                  const reader = new FileReader()
                  reader.onload = () => setNewImage(String(reader.result))
                  reader.readAsDataURL(file)
                }}
              />
              {newImage ? (
                <img
                  src={newImage}
                  alt="Prévia da foto"
                  className="h-32 rounded-lg object-cover"
                />
              ) : null}
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
      <Dialog
        open={isAdmin && editOpen}
        onOpenChange={(open) => {
          setEditOpen(open)
        }}
      >
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
