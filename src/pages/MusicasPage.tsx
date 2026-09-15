import { Clock3, ListMusic, Loader2, Music2, Plus, SkipForward, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { api } from "@/lib/api"
import type { Comanda, Song } from "@/data/comanda-board"

type PendingAction = { type: "advance" } | { type: "cancel"; song: Song } | null

export default function MusicasPage() {
    const [songs, setSongs] = useState<Song[]>([])
    const [tabs, setTabs] = useState<Comanda[]>([])
    const [loading, setLoading] = useState(true)
    const [isMutating, setIsMutating] = useState(false)
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
    const [addOpen, setAddOpen] = useState(false)
    const [pendingAction, setPendingAction] = useState<PendingAction>(null)
    const [title, setTitle] = useState("")
    const [tabId, setTabId] = useState("")

    const activeTabs = tabs.filter((tab) => tab.status === "open" || tab.status === "in_progress")
    const currentSong = songs.find((song) => song.status === "playing")
    const queuedSongs = songs.filter((song) => song.status === "queued")

    useEffect(() => {
        async function load() {
            try {
                await reload()
            } catch (err) {
                setMessage({
                    type: "error",
                    text: err instanceof Error ? err.message : "Erro ao carregar a fila de musicas.",
                })
            } finally {
                setLoading(false)
            }
        }

        void load()
    }, [])

    async function reload() {
        const [nextSongs, nextTabs] = await Promise.all([
            api.get<Song[]>("/songs"),
            api.get<Comanda[]>("/tabs"),
        ])
        setSongs(nextSongs)
        setTabs(nextTabs)
        return nextSongs
    }

    function openAddDialog() {
        const firstTab = activeTabs[0]
        if (!firstTab) {
            setMessage({ type: "error", text: "Abra uma comanda antes de adicionar uma musica." })
            return
        }

        setTitle("")
        setTabId(firstTab.id)
        setAddOpen(true)
    }

    async function addSong() {
        if (!title.trim() || !tabId) return

        setIsMutating(true)
        setMessage(null)
        try {
            const song = await api.post<Song>("/songs", { title: title.trim(), tab: tabId })
            await reload()
            setAddOpen(false)
            setMessage({
                type: "success",
                text: `"${song.title}" adicionada na posicao ${song.position}.`,
            })
        } catch (err) {
            setMessage({
                type: "error",
                text: err instanceof Error ? err.message : "Nao foi possivel adicionar a musica.",
            })
        } finally {
            setIsMutating(false)
        }
    }

    async function confirmAction() {
        if (!pendingAction) return

        setIsMutating(true)
        setMessage(null)
        try {
            if (pendingAction.type === "advance") {
                const result = await api.post<{ current: Song | null }>("/songs/advance", {})
                await reload()
                setMessage({
                    type: "success",
                    text: result.current
                        ? `Agora tocando: "${result.current.title}".`
                        : "A musica atual foi finalizada. A fila esta vazia.",
                })
            } else {
                await api.delete(`/songs/${pendingAction.song.id}`)
                await reload()
                setMessage({ type: "success", text: `"${pendingAction.song.title}" foi cancelada.` })
            }
            setPendingAction(null)
        } catch (err) {
            setMessage({
                type: "error",
                text: err instanceof Error ? err.message : "Operacao falhou.",
            })
        } finally {
            setIsMutating(false)
        }
    }

    if (loading) {
        return (
            <main className="flex min-h-svh items-center justify-center">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </main>
        )
    }

    return (
        <main className="min-h-svh bg-background px-10 py-8 text-foreground max-sm:px-5 max-sm:py-5">
            <div className="mx-auto max-w-[960px]">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-[22px] font-bold tracking-normal">Fila de musicas</h1>
                        <p className="mt-1 text-sm font-medium text-muted-foreground">
                            Gerencie os pedidos das comandas e a musica em execucao.
                        </p>
                    </div>
                    <Button onClick={openAddDialog} disabled={isMutating}>
                        <Plus className="size-4" /> Adicionar musica
                    </Button>
                </div>

                {message ? (
                    <Alert className="mb-5" variant={message.type === "error" ? "destructive" : "default"}>
                        <AlertTitle>{message.type === "error" ? "Erro" : "Sucesso"}</AlertTitle>
                        <AlertDescription>{message.text}</AlertDescription>
                    </Alert>
                ) : null}

                <Card className="mb-5 rounded-[18px] shadow-none">
                    <CardHeader className="flex-row items-center justify-between gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Music2 className="size-4 text-purple-600" /> Tocando agora
                            </CardTitle>
                            <p className="mt-1 text-sm font-medium text-muted-foreground">
                                {currentSong
                                    ? `${currentSong.title} - ${displayComandaName(currentSong.tabName)}`
                                    : "Nenhuma musica em execucao."}
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => setPendingAction({ type: "advance" })}
                            disabled={isMutating || songs.length === 0}
                        >
                            <SkipForward className="size-4" />
                            {currentSong ? "Proxima musica" : "Iniciar proxima"}
                        </Button>
                    </CardHeader>
                </Card>

                <section>
                    <div className="mb-3 flex items-center justify-between gap-4">
                        <h2 className="flex items-center gap-2 text-lg font-bold">
                            <ListMusic className="size-5" /> Proximas musicas
                        </h2>
                        <Badge variant="secondary">{queuedSongs.length} na fila</Badge>
                    </div>

                    {queuedSongs.length === 0 ? (
                        <Card className="rounded-[18px] border-dashed shadow-none">
                            <CardContent className="py-12 text-center text-sm font-medium text-muted-foreground">
                                A fila esta vazia. Adicione a primeira musica para comecar.
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-3">
                            {queuedSongs.map((song) => (
                                <Card key={song.id} className="rounded-[18px] shadow-none">
                                    <CardContent className="flex items-center gap-4 py-4 max-sm:flex-wrap">
                                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-black text-purple-950">
                                            {song.position}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-bold">{song.title}</p>
                                            <p className="mt-1 text-sm font-medium text-muted-foreground">
                                                {displayComandaName(song.tabName)}
                                            </p>
                                        </div>
                                        <p className="flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground">
                                            <Clock3 className="size-3.5" /> {formatDate(song.requestedAt)}
                                        </p>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            aria-label={`Cancelar ${song.title}`}
                                            title="Cancelar musica"
                                            onClick={() => setPendingAction({ type: "cancel", song })}
                                            disabled={isMutating}
                                        >
                                            <Trash2 className="size-4 text-red-700" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Adicionar musica a fila</DialogTitle>
                        <DialogDescription>
                            A musica entra no fim da fila e fica vinculada a comanda solicitante.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4">
                        <label className="grid gap-1 text-sm font-semibold">
                            Musica
                            <input
                                className="h-9 rounded-lg border border-input bg-background px-3"
                                value={title}
                                onChange={(event) => setTitle(event.target.value)}
                                placeholder="Ex.: Evidencias - Chitaozinho & Xororo"
                                autoFocus
                            />
                        </label>
                        <label className="grid gap-1 text-sm font-semibold">
                            Comanda solicitante
                            <select
                                className="h-9 rounded-lg border border-input bg-background px-3"
                                value={tabId}
                                onChange={(event) => setTabId(event.target.value)}
                            >
                                {activeTabs.map((tab) => (
                                    <option key={tab.id} value={tab.id}>
                                        {displayComandaName(tab.tableName)}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={addSong} disabled={isMutating || !title.trim() || !tabId}>
                            {isMutating ? "Adicionando..." : "Adicionar musica"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={pendingAction !== null} onOpenChange={(open) => !open && setPendingAction(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {pendingAction?.type === "advance" ? "Avancar fila" : "Cancelar musica"}
                        </DialogTitle>
                        <DialogDescription>
                            {pendingAction?.type === "advance"
                                ? currentSong
                                    ? `Finalizar "${currentSong.title}" e iniciar a proxima musica da fila?`
                                    : "Iniciar a proxima musica da fila?"
                                : `Cancelar "${pendingAction?.song.title}"? As posicoes restantes serao reorganizadas.`}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPendingAction(null)}>
                            Voltar
                        </Button>
                        <Button
                            variant={pendingAction?.type === "cancel" ? "destructive" : "default"}
                            onClick={confirmAction}
                            disabled={isMutating}
                        >
                            {isMutating ? "Salvando..." : "Confirmar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    )
}

function displayComandaName(name: string) {
    return name.replace(/^Mesa\s*/i, "Comanda ")
}

function formatDate(date: string) {
    return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(date))
}
