import { ComandaBoard } from "@/src/features/comandas/ComandaBoard"
import { mockComandaBoard } from "@/src/data/comanda-board"

export function ComandasPage() {
  return <ComandaBoard initialData={mockComandaBoard} />
}
