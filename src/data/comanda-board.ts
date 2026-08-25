export type OrderStatus =
    | "open"
    | "in_progress"
    | "delivered"
    | "finished"
    | "cancelled"

export type EmployeeRole = "admin" | "garcom" | "cozinha"

export type Employee = {
    id: string
    name: string
    email: string
    role: EmployeeRole
    avatar: string
    createdAt: string
}

export type Product = {
    id: string
    name: string
    /** Preco em unidades menores (inteiro, escala 10^4). */
    price: number
    stock: number
    description?: string
    createdAt: string
}

export type TabMember = {
    employee: string
    name: string
    avatar: string
}

export type ComandaOrder = {
    id: string
    tab: string
    product: string
    productName: string
    unitPrice: number
    employee: string
    employeeName: string
    employeeAvatar: string
    quantity: number
    status: OrderStatus
    orderedAt: string
    deliveredAt: string | null
}

export type Comanda = {
    id: string
    tableName: string
    status: OrderStatus
    members: TabMember[]
    orders: ComandaOrder[]
    openedAt: string
    closedAt: string | null
}

export type SongStatus = "queued" | "playing" | "finished" | "cancelled"

export type Song = {
    id: string
    title: string
    tab: string
    tabName: string
    status: SongStatus
    position: number | null
    requestedAt: string
    startedAt: string | null
    finishedAt: string | null
    cancelledAt: string | null
}

export type ComandaBoardData = {
    employees: Employee[]
    products: Product[]
    comandas: Comanda[]
    songs: Song[]
}
