import { asc, eq } from "drizzle-orm"

import { db } from "@/db"
import {
  comandaMembers,
  comandas,
  employees,
  orders,
  products,
} from "@/db/schema"

export async function loadComandaBoard() {
  try {
    const [comandaRows, memberRows, orderRows, productRows, employeeRows] =
      await Promise.all([
        db.select().from(comandas).orderBy(asc(comandas.id)),
        db
          .select({
            comandaId: comandaMembers.comandaId,
            name: employees.name,
            avatar: employees.avatar,
          })
          .from(comandaMembers)
          .innerJoin(employees, eq(comandaMembers.employeeId, employees.id))
          .orderBy(asc(comandaMembers.id)),
        db
          .select({
            id: orders.id,
            comandaId: orders.comandaId,
            product: products.name,
            employee: employees.name,
            employeeAvatar: employees.avatar,
            quantity: orders.quantity,
            status: orders.status,
            orderedAt: orders.orderedAt,
            deliveredAt: orders.deliveredAt,
          })
          .from(orders)
          .innerJoin(products, eq(orders.productId, products.id))
          .innerJoin(employees, eq(orders.employeeId, employees.id))
          .orderBy(asc(orders.id)),
        db.select().from(products).orderBy(asc(products.id)),
        db.select().from(employees).orderBy(asc(employees.id)),
      ])

    if (
      comandaRows.length === 0 ||
      productRows.length === 0 ||
      employeeRows.length === 0
    ) {
      return mockComandaBoard
    }

    return {
      comandas: comandaRows.map((comanda) => ({
        ...comanda,
        members: memberRows.filter((member) => member.comandaId === comanda.id),
        orders: orderRows.filter((order) => order.comandaId === comanda.id),
      })),
      products: productRows,
      employees: employeeRows,
    }
  } catch {
    return mockComandaBoard
  }
}

const mockEmployees = [
  {
    id: 1,
    name: "Joao Pires",
    email: "joaopires@emaildash.com",
    role: "admin" as const,
    avatar: "J",
    createdAt: new Date("2026-04-20T20:24:00-03:00"),
  },
  {
    id: 2,
    name: "Mariana Cardoso",
    email: "mariana@emaildash.com",
    role: "garcom" as const,
    avatar: "M",
    createdAt: new Date("2026-04-20T20:24:00-03:00"),
  },
  {
    id: 3,
    name: "Mateus Silva",
    email: "mateus@emaildash.com",
    role: "garcom" as const,
    avatar: "M",
    createdAt: new Date("2026-04-20T20:24:00-03:00"),
  },
  {
    id: 4,
    name: "Ana Julia",
    email: "ana@emaildash.com",
    role: "cozinha" as const,
    avatar: "A",
    createdAt: new Date("2026-04-20T20:24:00-03:00"),
  },
]

const mockProducts = [
  {
    id: 1,
    name: "X-Bacon",
    price: "24.90",
    stock: 12,
    createdAt: new Date("2026-04-24T20:24:00-03:00"),
  },
  {
    id: 2,
    name: "X-Salada",
    price: "21.90",
    stock: 8,
    createdAt: new Date("2026-04-24T20:24:00-03:00"),
  },
  {
    id: 3,
    name: "Refrigerante",
    price: "7.50",
    stock: 32,
    createdAt: new Date("2026-04-24T20:24:00-03:00"),
  },
]

const mockComandaBoard = {
  employees: mockEmployees,
  products: mockProducts,
  comandas: [
    {
      id: 1,
      tableName: "Mesa 01",
      status: "aberta" as const,
      openedAt: new Date("2026-04-24T20:24:00-03:00"),
      closedAt: null,
      members: [
        { comandaId: 1, name: "Mariana Cardoso", avatar: "M" },
        { comandaId: 1, name: "Mateus Silva", avatar: "M" },
        { comandaId: 1, name: "Ana Julia", avatar: "A" },
      ],
      orders: [
        {
          id: 1,
          comandaId: 1,
          product: "X-Bacon",
          employee: "Mariana Cardoso",
          employeeAvatar: "M",
          quantity: 1,
          status: "finalizada" as const,
          orderedAt: new Date("2026-04-24T21:30:00-03:00"),
          deliveredAt: new Date("2026-04-24T21:47:00-03:00"),
        },
        {
          id: 2,
          comandaId: 1,
          product: "X-Salada",
          employee: "Mateus Silva",
          employeeAvatar: "M",
          quantity: 1,
          status: "em_andamento" as const,
          orderedAt: new Date("2026-04-24T22:59:00-03:00"),
          deliveredAt: null,
        },
      ],
    },
    {
      id: 2,
      tableName: "Mesa 02",
      status: "aberta" as const,
      openedAt: new Date("2026-04-24T20:40:00-03:00"),
      closedAt: null,
      members: [
        { comandaId: 2, name: "Joao Pires", avatar: "J" },
        { comandaId: 2, name: "Ana Julia", avatar: "A" },
      ],
      orders: [],
    },
    {
      id: 3,
      tableName: "Mesa 03",
      status: "em_andamento" as const,
      openedAt: new Date("2026-04-24T21:10:00-03:00"),
      closedAt: null,
      members: [
        { comandaId: 3, name: "Mateus Silva", avatar: "M" },
        { comandaId: 3, name: "Mariana Cardoso", avatar: "M" },
      ],
      orders: [
        {
          id: 3,
          comandaId: 3,
          product: "Refrigerante",
          employee: "Ana Julia",
          employeeAvatar: "A",
          quantity: 2,
          status: "em_andamento" as const,
          orderedAt: new Date("2026-04-24T22:20:00-03:00"),
          deliveredAt: null,
        },
      ],
    },
  ],
}
