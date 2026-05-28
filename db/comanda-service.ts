import { and, eq, sql } from "drizzle-orm"

import { db } from "@/db"
import {
  comandaMembers,
  comandas,
  employees,
  orders,
  products,
} from "@/db/schema"

export class ComandaError extends Error {
  constructor(
    message: string,
    public status = 400
  ) {
    super(message)
  }
}

export type ComandaMutationResult = {
  message: string
  total?: number
}

function assertPositiveInteger(value: unknown, field: string) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ComandaError(`${field} invalido.`)
  }
  return parsed
}

function isOpenStatus(status: string) {
  return status === "aberta" || status === "em_andamento"
}

async function getComandaOrThrow(comandaId: number) {
  const [comanda] = await db
    .select()
    .from(comandas)
    .where(eq(comandas.id, comandaId))
    .limit(1)

  if (!comanda) {
    throw new ComandaError("Comanda nao encontrada.", 404)
  }

  return comanda
}

async function assertComandaOpen(comandaId: number) {
  const comanda = await getComandaOrThrow(comandaId)

  if (!isOpenStatus(comanda.status)) {
    throw new ComandaError("Comanda nao esta aberta.", 409)
  }

  return comanda
}

export async function calculateComandaTotal(comandaId: number) {
  const [row] = await db
    .select({
      total: sql<string>`coalesce(sum(${orders.quantity} * ${products.price}), 0)`,
    })
    .from(orders)
    .innerJoin(products, eq(orders.productId, products.id))
    .where(
      and(eq(orders.comandaId, comandaId), sql`${orders.status} <> 'cancelada'`)
    )

  return Number(row?.total ?? 0)
}

export async function criarComanda(input: {
  tableName: string
  memberIds?: number[]
}) {
  const tableName = input.tableName.trim()
  if (!tableName) {
    throw new ComandaError("Nome da mesa e obrigatorio.")
  }

  const [created] = await db
    .insert(comandas)
    .values({ tableName, status: "aberta" })
    .returning()

  const memberIds = input.memberIds?.filter(Number.isInteger) ?? []
  if (memberIds.length > 0) {
    await db.insert(comandaMembers).values(
      memberIds.map((employeeId) => ({
        comandaId: created.id,
        employeeId,
      }))
    )
  } else {
    const employeeRows = await db
      .select({ id: employees.id })
      .from(employees)
      .limit(3)
    if (employeeRows.length > 0) {
      await db.insert(comandaMembers).values(
        employeeRows.map((employee) => ({
          comandaId: created.id,
          employeeId: employee.id,
        }))
      )
    }
  }

  return { message: "Comanda criada." } satisfies ComandaMutationResult
}

export async function adicionarPedidoComanda(input: {
  comandaId: number
  productId: number
  employeeId: number
  quantity: number
}) {
  await assertComandaOpen(input.comandaId)

  const productId = assertPositiveInteger(input.productId, "Produto")
  const employeeId = assertPositiveInteger(input.employeeId, "Funcionario")
  const quantity = assertPositiveInteger(input.quantity, "Quantidade")

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1)
  if (!product) {
    throw new ComandaError("Produto nao encontrado.", 404)
  }
  if (product.stock < quantity) {
    throw new ComandaError("Quantidade maior que o estoque disponivel.", 409)
  }

  const [employee] = await db
    .select()
    .from(employees)
    .where(eq(employees.id, employeeId))
    .limit(1)
  if (!employee) {
    throw new ComandaError("Funcionario nao encontrado.", 404)
  }

  await db.insert(orders).values({
    comandaId: input.comandaId,
    productId,
    employeeId,
    quantity,
    status: "em_andamento",
  })

  await db
    .update(comandas)
    .set({ status: "em_andamento" })
    .where(eq(comandas.id, input.comandaId))

  return {
    message: "Pedido adicionado.",
    total: await calculateComandaTotal(input.comandaId),
  } satisfies ComandaMutationResult
}

export async function removerPedidoComanda(input: {
  comandaId: number
  orderId: number
}) {
  await assertComandaOpen(input.comandaId)
  const orderId = assertPositiveInteger(input.orderId, "Pedido")

  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.comandaId, input.comandaId)))
    .limit(1)

  if (!order) {
    throw new ComandaError("Pedido nao encontrado.", 404)
  }

  await db.delete(orders).where(eq(orders.id, orderId))

  return {
    message: "Pedido removido.",
    total: await calculateComandaTotal(input.comandaId),
  } satisfies ComandaMutationResult
}

export async function finalizarComanda(comandaId: number) {
  await assertComandaOpen(comandaId)
  const total = await calculateComandaTotal(comandaId)

  await db
    .update(orders)
    .set({ status: "entregue", deliveredAt: new Date() })
    .where(eq(orders.comandaId, comandaId))
  await db
    .update(comandas)
    .set({ status: "finalizada", closedAt: new Date() })
    .where(eq(comandas.id, comandaId))

  return {
    message: "Comanda finalizada.",
    total,
  } satisfies ComandaMutationResult
}

export async function cancelarComanda(comandaId: number) {
  await assertComandaOpen(comandaId)

  await db
    .update(orders)
    .set({ status: "cancelada" })
    .where(eq(orders.comandaId, comandaId))
  await db
    .update(comandas)
    .set({ status: "cancelada", closedAt: new Date() })
    .where(eq(comandas.id, comandaId))

  return { message: "Comanda cancelada." } satisfies ComandaMutationResult
}
