import { useState } from "react"
import type { ComandaOrder, Employee, Product } from "@pi/contracts"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { EmployeeField, ProductField, QuantityField, StockHint } from "./fields"

export type EditOrderPayload = {
  product: string
  employee: string
  quantity: number
}

export function EditOrderDialog({
  order,
  products,
  employees,
  isMutating,
  onSubmit,
  onClose,
}: {
  order: ComandaOrder | null
  products: Product[]
  employees: Employee[]
  isMutating: boolean
  onSubmit: (order: ComandaOrder, payload: EditOrderPayload) => Promise<boolean>
  onClose: () => void
}) {
  const [productId, setProductId] = useState("")
  const [employeeId, setEmployeeId] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [seededOrder, setSeededOrder] = useState(order)

  if (order !== seededOrder) {
    setSeededOrder(order)
    setError(null)
    if (order) {
      setProductId(order.product)
      setEmployeeId(order.employee)
      setQuantity(order.quantity)
    }
  }

  const product = products.find((p) => p.id === productId)
  const productChanged = !!order && productId !== order.product
  const quantityValid =
    Number.isInteger(quantity) &&
    quantity >= 1 &&
    !!product &&
    (!productChanged || quantity <= product.stock)

  async function saveEditOrder() {
    if (!order) return
    setError(null)
    const product = products.find((p) => p.id === productId)
    if (!product) return setError("Selecione um produto valido.")
    if (!Number.isInteger(quantity) || quantity < 1) {
      return setError("Informe uma quantidade valida (minimo 1).")
    }
    if (productChanged && quantity > product.stock) {
      return setError(
        `Estoque insuficiente para ${product.name}. Disponivel: ${product.stock}.`
      )
    }
    await onSubmit(order, {
      product: productId,
      employee: employeeId,
      quantity,
    })
  }

  return (
    <Dialog open={order !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar pedido</DialogTitle>
          <DialogDescription>
            Altere produto, funcionario ou quantidade do pedido.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <ProductField
            products={products}
            value={productId}
            onChange={setProductId}
          />
          <EmployeeField
            employees={employees}
            value={employeeId}
            onChange={setEmployeeId}
          />
          <QuantityField
            value={quantity}
            onChange={setQuantity}
            max={productChanged ? product?.stock : undefined}
            hint={
              productChanged && product ? (
                <StockHint stock={product.stock} quantity={quantity} />
              ) : null
            }
          />
          {error ? (
            <p role="alert" className="text-sm font-semibold text-red-600">
              {error}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={saveEditOrder} disabled={isMutating || !quantityValid}>
            {isMutating ? "Salvando..." : "Salvar alteracoes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
