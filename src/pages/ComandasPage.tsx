import { useEffect, useState } from "react"
import { ComandaBoard } from "@/features/comandas/components/ComandaBoard"
import type { BoardData } from "@pi/contracts"
import { api } from "@/lib/api"

export function ComandasPage() {
  const [data, setData] = useState<BoardData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [tabs, products, employees, songs] = await Promise.all([
          api.get<BoardData["comandas"]>("/tabs"),
          api.get<BoardData["products"]>("/products"),
          api.get<BoardData["employees"]>("/employees"),
          api.get<BoardData["songs"]>("/songs"),
        ])
        setData({ comandas: tabs, products, employees, songs })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar dados.")
      }
    }
    void load()
  }, [])

  if (error) {
    return (
      <main className="flex min-h-svh items-center justify-center px-10 py-8">
        <p className="text-sm font-semibold text-red-600">{error}</p>
      </main>
    )
  }

  if (!data) {
    return (
      <main className="flex min-h-svh items-center justify-center px-10 py-8">
        <p className="text-sm font-semibold text-muted-foreground">
          Carregando…
        </p>
      </main>
    )
  }

  return <ComandaBoard initialData={data} />
}
