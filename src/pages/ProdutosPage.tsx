import { Calendar, PackageSearch, Pencil, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const orders = [
  {
    name: "Mariana Cardoso",
    status: "Entregue",
    orderedAt: "21:30, 24 de Abril, 2026",
    deliveredAt: "21:47, 24 de Abril, 2026",
    quantity: "01",
  },
  {
    name: "Mateus Silva",
    status: "Em Andamento",
    orderedAt: "22:59, 24 de Abril, 2026",
    deliveredAt: "-",
    quantity: "01",
  },
]

export default function ProdutosPage() {
  return (
    <main className="min-h-svh bg-white px-10 py-8 text-zinc-950 max-sm:px-5">
      <div className="mx-auto max-w-[1160px]">
        <Card className="rounded-[18px] shadow-none">
          <CardContent className="grid grid-cols-[1fr_300px] gap-8 p-5 max-lg:grid-cols-1">
            <div>
              <h1 className="text-[22px] font-bold tracking-normal">
                Produto 1
              </h1>
              <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-zinc-500">
                <Calendar className="size-4" /> Criada Em
              </p>
              <p className="mt-1 text-sm font-semibold">
                20:24, 24 de Abril, 2026
              </p>
              <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-zinc-500">
                <PackageSearch className="size-4" /> Preco Atual
              </p>
              <p className="mt-1 text-sm font-semibold">R$ 00,00</p>
              <p className="mt-3 text-sm font-semibold text-zinc-700">
                03 itens no estoque
              </p>
              <div className="mt-8 grid max-w-52 gap-3">
                <Button className="bg-purple-300 text-purple-950 ring-4 ring-purple-100 hover:bg-purple-400">
                  <Pencil className="size-4" /> Editar Produto
                </Button>
                <Button className="bg-red-900 text-white hover:bg-red-950">
                  <Trash2 className="size-4" /> Remover Produto
                </Button>
              </div>
            </div>
            <div className="h-72 rounded-[14px] bg-zinc-200" />
          </CardContent>
        </Card>

        <section className="mt-6">
          <h2 className="text-[22px] font-bold tracking-normal">Pedidos</h2>
          <Table className="mt-4">
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pedido Em</TableHead>
                <TableHead>Entregue Em</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.name}>
                  <TableCell className="font-semibold">{order.name}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        order.status === "Entregue"
                          ? "bg-cyan-200 text-cyan-950"
                          : "bg-pink-200 text-pink-900"
                      }
                    >
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{order.orderedAt}</TableCell>
                  <TableCell>{order.deliveredAt}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {order.quantity}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      </div>
    </main>
  )
}
