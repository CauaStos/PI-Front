import {
  comandaMembers,
  comandas,
  employees,
  orders,
  products,
} from "@/db/schema"
import { db, queryClient } from "@/db"

await db.delete(orders)
await db.delete(comandaMembers)
await db.delete(comandas)
await db.delete(products)
await db.delete(employees)

const insertedEmployees = await db
  .insert(employees)
  .values([
    {
      name: "Joao Pires",
      email: "joaopires@emaildash.com",
      role: "admin",
      avatar: "J",
    },
    {
      name: "Mariana Cardoso",
      email: "mariana@emaildash.com",
      role: "garcom",
      avatar: "M",
    },
    {
      name: "Mateus Silva",
      email: "mateus@emaildash.com",
      role: "garcom",
      avatar: "M",
    },
    {
      name: "Ana Julia",
      email: "ana@emaildash.com",
      role: "cozinha",
      avatar: "A",
    },
  ])
  .returning()

const insertedProducts = await db
  .insert(products)
  .values([
    { name: "X-Bacon", price: "24.90", stock: 12 },
    { name: "X-Salada", price: "21.90", stock: 8 },
    { name: "Refrigerante", price: "7.50", stock: 32 },
    { name: "Batata Frita", price: "18.00", stock: 15 },
  ])
  .returning()

const insertedComandas = await db
  .insert(comandas)
  .values([
    { tableName: "Mesa 01", status: "aberta" },
    { tableName: "Mesa 02", status: "aberta" },
    { tableName: "Mesa 03", status: "em_andamento" },
  ])
  .returning()

await db.insert(comandaMembers).values([
  { comandaId: insertedComandas[0].id, employeeId: insertedEmployees[1].id },
  { comandaId: insertedComandas[0].id, employeeId: insertedEmployees[2].id },
  { comandaId: insertedComandas[0].id, employeeId: insertedEmployees[3].id },
  { comandaId: insertedComandas[1].id, employeeId: insertedEmployees[0].id },
  { comandaId: insertedComandas[1].id, employeeId: insertedEmployees[1].id },
  { comandaId: insertedComandas[2].id, employeeId: insertedEmployees[2].id },
  { comandaId: insertedComandas[2].id, employeeId: insertedEmployees[3].id },
])

await db.insert(orders).values([
  {
    comandaId: insertedComandas[0].id,
    productId: insertedProducts[0].id,
    employeeId: insertedEmployees[1].id,
    quantity: 1,
    status: "entregue",
    deliveredAt: new Date("2026-04-24T21:47:00-03:00"),
  },
  {
    comandaId: insertedComandas[0].id,
    productId: insertedProducts[1].id,
    employeeId: insertedEmployees[2].id,
    quantity: 1,
    status: "em_andamento",
  },
  {
    comandaId: insertedComandas[2].id,
    productId: insertedProducts[3].id,
    employeeId: insertedEmployees[3].id,
    quantity: 2,
    status: "em_andamento",
  },
])

await queryClient.end()

console.log("Seeded comanda mock data.")
