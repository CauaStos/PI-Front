import { useState } from "react"
import type { Employee, Product } from "@pi/contracts"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { MutateMessage } from "@/lib/use-mutate"
import { displayComandaName } from "../shared"
import { EmployeeField, ProductField, QuantityField, StockHint } from "./fields"

export type AddOrderPayload = {
  product: string
  employee: string
  quantity: number
}

export function AddOrderDialog({
  open,
  onOpenChange,
  products,
  employees,
  comandaName,
  selectedActive,
  isMutating,
  setMessage,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: Product[]
  employees: Employee[]
  comandaName: string | undefined
  selectedActive: boolean
  isMutating: boolean
  setMessage: (message: MutateMessage | null) => void
  onSubmit: (payload: AddOrderPayload) => Promise<boolean>
}) {
  const [productId, setProductId] = useState(products[0]?.id ?? "")
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? "")
  const [quantity, setQuantity] = useState(1)

  const selectedProduct = products.find((p) => p.id === productId)
  const quantityValid =
    Number.isInteger(quantity) &&
    quantity >= 1 &&
    !!selectedProduct &&
    quantity <= selectedProduct.stock

  async function addOrder() {
    const product = products.find((p) => p.id === productId)
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
    const ok = await onSubmit({
      product: productId,
      employee: employeeId,
      quantity,
    })
    if (ok) setQuantity(1)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar pedido</DialogTitle>
          <DialogDescription>
            Selecione produto, funcionario responsavel e quantidade para{" "}
            {comandaName ? displayComandaName(comandaName) : "a comanda"}.
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
            max={selectedProduct?.stock}
            hint={
              selectedProduct ? (
                <StockHint stock={selectedProduct.stock} quantity={quantity} />
              ) : null
            }
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={addOrder}
            disabled={isMutating || !selectedActive || !quantityValid}
          >
            {isMutating ? "Salvando..." : "Adicionar pedido"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
