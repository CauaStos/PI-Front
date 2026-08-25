import { useEffect, useState } from "react"
import { ComandaBoard } from "@/src/features/comandas/ComandaBoard"
import type { ComandaBoardData } from "@/src/data/comanda-board"
import { api } from "@/lib/api"

export function ComandasPage() {
    const [data, setData] = useState<ComandaBoardData | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function load() {
            try {
                const [tabs, products, employees, songs] = await Promise.all([
                    api.get<ComandaBoardData["comandas"]>("/tabs"),
                    api.get<ComandaBoardData["products"]>("/products"),
                    api.get<ComandaBoardData["employees"]>("/employees"),
                    api.get<ComandaBoardData["songs"]>("/songs"),
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
                <p className="text-sm font-semibold text-muted-foreground">Carregando…</p>
            </main>
        )
    }

    return <ComandaBoard initialData={data} />
}
