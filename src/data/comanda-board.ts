export type OrderStatus =
  | "aberta"
  | "em_andamento"
  | "entregue"
  | "finalizada"
  | "cancelada"

export type Employee = {
  id: number
  name: string
  email: string
  role: "admin" | "garcom" | "cozinha"
  avatar: string
  createdAt: Date
}

export type Product = {
  id: number
  name: string
  price: string
  stock: number
  createdAt: Date
}

export type ComandaOrder = {
  id: number
  comandaId: number
  product: string
  employee: string
  employeeAvatar: string
  quantity: number
  status: OrderStatus
  orderedAt: Date
  deliveredAt: Date | null
}

export type Comanda = {
  id: number
  tableName: string
  status: OrderStatus
  openedAt: Date
  closedAt: Date | null
  members: Array<{ comandaId: number; name: string; avatar: string }>
  orders: ComandaOrder[]
}

export type ComandaBoardData = {
  employees: Employee[]
  products: Product[]
  comandas: Comanda[]
}

const mockEmployees: Employee[] = [
  {
    id: 1,
    name: "Joao Pires",
    email: "joaopires@emaildash.com",
    role: "admin",
    avatar: "J",
    createdAt: new Date("2026-04-20T20:24:00-03:00"),
  },
  {
    id: 2,
    name: "Mariana Cardoso",
    email: "mariana@emaildash.com",
    role: "garcom",
    avatar: "M",
    createdAt: new Date("2026-04-20T20:24:00-03:00"),
  },
  {
    id: 3,
    name: "Mateus Silva",
    email: "mateus@emaildash.com",
    role: "garcom",
    avatar: "M",
    createdAt: new Date("2026-04-20T20:24:00-03:00"),
  },
  {
    id: 4,
    name: "Ana Julia",
    email: "ana@emaildash.com",
    role: "cozinha",
    avatar: "A",
    createdAt: new Date("2026-04-20T20:24:00-03:00"),
  },
]

const mockProducts: Product[] = [
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

export const mockComandaBoard: ComandaBoardData = {
  employees: mockEmployees,
  products: mockProducts,
  comandas: [
    {
      id: 1,
      tableName: "Mesa 01",
      status: "aberta",
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
          status: "finalizada",
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
          status: "em_andamento",
          orderedAt: new Date("2026-04-24T22:59:00-03:00"),
          deliveredAt: null,
        },
      ],
    },
    {
      id: 2,
      tableName: "Mesa 02",
      status: "aberta",
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
      status: "em_andamento",
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
          status: "em_andamento",
          orderedAt: new Date("2026-04-24T22:20:00-03:00"),
          deliveredAt: null,
        },
      ],
    },
  ],
}
