import type { Employee, Product } from "@pi/contracts"
import type { ReactNode } from "react"
import { format as formatMoney } from "@/lib/money"

export function ProductField({
  products,
  value,
  onChange,
}: {
  products: Product[]
  value: string
  onChange: (id: string) => void
}) {
  return (
    <label className="grid gap-1 text-sm font-semibold">
      Produto
      <select
        className="h-9 rounded-lg border border-input bg-background px-3"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} - {formatMoney(p.price)}
          </option>
        ))}
      </select>
    </label>
  )
}

export function EmployeeField({
  employees,
  value,
  onChange,
}: {
  employees: Employee[]
  value: string
  onChange: (id: string) => void
}) {
  return (
    <label className="grid gap-1 text-sm font-semibold">
      Funcionario
      <select
        className="h-9 rounded-lg border border-input bg-background px-3"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {employees.map((emp) => (
          <option key={emp.id} value={emp.id}>
            {emp.name}
          </option>
        ))}
      </select>
    </label>
  )
}

export function QuantityField({
  value,
  onChange,
  max,
  hint,
}: {
  value: number
  onChange: (quantity: number) => void
  max?: number
  hint?: ReactNode
}) {
  return (
    <label className="grid gap-1 text-sm font-semibold">
      Quantidade
      <input
        className="h-9 rounded-lg border border-input bg-background px-3"
        min={1}
        max={max}
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint}
    </label>
  )
}

export function StockHint({
  stock,
  quantity,
}: {
  stock: number
  quantity: number
}) {
  return (
    <span className="text-xs font-medium text-muted-foreground">
      {stock} em estoque
      {quantity > stock ? " - quantidade acima do disponivel" : ""}
    </span>
  )
}
