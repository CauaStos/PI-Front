import { useEffect, useState } from "react"
import { RetryState } from "@/components/retry-state"
import { ComandaBoard } from "@/features/comandas/components/ComandaBoard"
import type { BoardData } from "@pi/contracts"
import { api } from "@/lib/api"

export function ComandasPage() {
  const [data, setData] = useState<BoardData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retrying, setRetrying] = useState(false)

  async function load() {
    setRetrying(true)
    try {
      const [tabs, products, employees, songs] = await Promise.all([
        api.get<BoardData["comandas"]>("/tabs"),
        api.get<BoardData["products"]>("/products"),
        api.get<BoardData["employees"]>("/employees"),
        api.get<BoardData["songs"]>("/songs"),
      ])
      setData({ comandas: tabs, products, employees, songs })
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados.")
    } finally {
      setRetrying(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [])

  if (error) {
    return (
      <main className="flex min-h-svh items-center justify-center px-10 py-8">
        <RetryState
          message={error}
          onRetry={() => void load()}
          loading={retrying}
        />
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
