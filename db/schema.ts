import {
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

export const employeeRole = pgEnum("employee_role", [
  "admin",
  "garcom",
  "cozinha",
])

export const orderStatus = pgEnum("order_status", [
  "aberta",
  "em_andamento",
  "entregue",
  "finalizada",
  "cancelada",
])

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: employeeRole("role").notNull().default("garcom"),
  avatar: text("avatar").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const comandas = pgTable("comandas", {
  id: serial("id").primaryKey(),
  tableName: text("table_name").notNull(),
  status: orderStatus("status").notNull().default("aberta"),
  openedAt: timestamp("opened_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
})

export const comandaMembers = pgTable("comanda_members", {
  id: serial("id").primaryKey(),
  comandaId: integer("comanda_id")
    .notNull()
    .references(() => comandas.id, { onDelete: "cascade" }),
  employeeId: integer("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
})

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  comandaId: integer("comanda_id")
    .notNull()
    .references(() => comandas.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "restrict" }),
  employeeId: integer("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "restrict" }),
  quantity: integer("quantity").notNull().default(1),
  status: orderStatus("status").notNull().default("em_andamento"),
  orderedAt: timestamp("ordered_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
})
