import { api } from "@/lib/api"
import type { BoardData } from "@/data/comanda-board"

export async function fetchBoard(): Promise<BoardData> {
  const [comandas, products, employees, songs] = await Promise.all([
    api.get<BoardData["comandas"]>("/tabs"),
    api.get<BoardData["products"]>("/products"),
    api.get<BoardData["employees"]>("/employees"),
    api.get<BoardData["songs"]>("/songs"),
  ])
  return { comandas, products, employees, songs }
}
