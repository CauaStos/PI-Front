import {
  ArrowDown,
  ArrowUp,
  ArrowUpToLine,
  Clock3,
  GripVertical,
  ListMusic,
  Loader2,
  Music2,
  Plus,
  SkipForward,
  Trash2,
} from "lucide-react"
import { useCallback, useEffect, useState, type DragEvent } from "react"

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
import { toast } from "sonner"
import { api } from "@/lib/api"
import { authClient } from "@/lib/auth-client"
import { canManageSongQueue, type Employee } from "@/lib/employee-roles"
import { cn } from "@/lib/utils"
import { displayComandaName, formatDate } from "@/features/comandas/shared"
import { useBoardChanged } from "@/features/comandas/hooks/useBoardChanged"
import {
  reorderQueuedSongs,
  resolveEmployeeRoleFromSession,
} from "@/features/musicas/queue"
import type { Comanda, Song } from "@pi/contracts"

type PendingAction = { type: "advance" } | { type: "cancel"; song: Song } | null

export default function MusicasPage() {
  const { data: session } = authClient.useSession()
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null)
  const [songs, setSongs] = useState<Song[]>([])
  const [tabs, setTabs] = useState<Comanda[]>([])
  const [loading, setLoading] = useState(true)
  const [isMutating, setIsMutating] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [title, setTitle] = useState("")
  const [tabId, setTabId] = useState("")
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const sessionRole = resolveEmployeeRoleFromSession(
    session?.user as { role?: string; employeeRole?: string } | undefined
  )
  const effectiveRole = currentEmployee?.role ?? sessionRole
  const canManageQueue = effectiveRole
    ? canManageSongQueue(effectiveRole)
    : false

  const activeTabs = tabs.filter(
    (tab) => tab.status === "open" || tab.status === "in_progress"
  )
  const currentSong = songs.find((song) => song.status === "playing")
  const queuedSongs = songs.filter((song) => song.status === "queued")

  const reload = useCallback(async () => {
    const [nextSongs, nextTabs] = await Promise.all([
      api.get<Song[]>("/songs"),
      api.get<Comanda[]>("/tabs"),
    ])
    setSongs(nextSongs)
    setTabs(nextTabs)
    return nextSongs
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [nextSongs, nextTabs, profile] = await Promise.all([
          api.get<Song[]>("/songs"),
          api.get<Comanda[]>("/tabs"),
          api.get<Employee>("/employees/me").catch(() => null),
        ])
        if (cancelled) return
        setSongs(nextSongs)
        setTabs(nextTabs)
        if (profile) setCurrentEmployee(profile)
      } catch (err) {
        if (!cancelled) {
          toast.error(
            err instanceof Error
              ? err.message
              : "Erro ao carregar a fila de musicas."
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  useBoardChanged(() => {
    if (!isMutating && !draggingId) {
      void reload().catch(() => undefined)
    }
  })

  function openAddDialog() {
    const firstTab = activeTabs[0]
    if (!firstTab) {
      toast.error("Abra uma comanda antes de adicionar uma musica.")
      return
    }

    setTitle("")
    setTabId(firstTab.id)
    setAddOpen(true)
  }

  async function addSong() {
    if (!title.trim() || !tabId) return

    setIsMutating(true)
    try {
      const song = await api.post<Song>("/songs", {
        title: title.trim(),
        tab: tabId,
      })
      await reload()
      setAddOpen(false)
      toast.success(`"${song.title}" adicionada na posicao ${song.position}.`)
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Nao foi possivel adicionar a musica."
      )
    } finally {
      setIsMutating(false)
    }
  }

  async function moveSong(songId: string, targetPosition: number) {
    if (!canManageQueue || isMutating) return
    const currentIndex = queuedSongs.findIndex((item) => item.id === songId)
    const targetSong = queuedSongs[currentIndex]
    if (
      !targetSong ||
      currentIndex + 1 === targetPosition ||
      targetPosition < 1 ||
      targetPosition > queuedSongs.length
    ) {
      return
    }

    const previousSongs = songs
    setSongs(reorderQueuedSongs(songs, songId, targetPosition))
    setIsMutating(true)
    try {
      const updatedQueue = await api.patch<Song[]>(
        `/songs/${songId}/position`,
        { position: targetPosition }
      )
      setSongs(updatedQueue)
      toast.success(
        `"${targetSong.title}" movida para a posicao ${targetPosition}.`
      )
    } catch (err) {
      setSongs(previousSongs)
      toast.error(
        err instanceof Error
          ? err.message
          : "Nao foi possivel alterar a posicao da musica."
      )
    } finally {
      setIsMutating(false)
    }
  }

  function handleDragStart(event: DragEvent<HTMLDivElement>, song: Song) {
    if (!canManageQueue || isMutating || queuedSongs.length <= 1) {
      event.preventDefault()
      return
    }
    setDraggingId(song.id)
    event.dataTransfer.effectAllowed = "move"
    event.dataTransfer.setData("text/plain", song.id)
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>, song: Song) {
    if (!canManageQueue || !draggingId || draggingId === song.id) return
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
    if (dragOverId !== song.id) {
      setDragOverId(song.id)
    }
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>, song: Song) {
    if (
      dragOverId === song.id &&
      !event.currentTarget.contains(event.relatedTarget as Node | null)
    ) {
      setDragOverId(null)
    }
  }

  function handleDrop(
    event: DragEvent<HTMLDivElement>,
    targetIndex: number
  ) {
    event.preventDefault()
    const sourceId = draggingId || event.dataTransfer.getData("text/plain")
    setDraggingId(null)
    setDragOverId(null)
    if (!sourceId) return
    void moveSong(sourceId, targetIndex + 1)
  }

  function handleDragEnd() {
    setDraggingId(null)
    setDragOverId(null)
  }

  async function confirmAction() {
    if (!pendingAction) return

    setIsMutating(true)
    try {
      if (pendingAction.type === "advance") {
        const result = await api.post<{ current: Song | null }>(
          "/songs/advance",
          {}
        )
        await reload()
        toast.success(
          result.current
            ? `Agora tocando: "${result.current.title}".`
            : "A musica atual foi finalizada. A fila esta vazia."
        )
      } else {
        await api.delete(`/songs/${pendingAction.song.id}`)
        await reload()
        toast.success(`"${pendingAction.song.title}" foi cancelada.`)
      }
      setPendingAction(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operacao falhou.")
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

  const canReorder = canManageQueue && queuedSongs.length > 1

  return (
    <main className="min-h-svh bg-background px-10 py-8 text-foreground max-sm:px-5 max-sm:py-5">
      <div className="mx-auto max-w-[960px]">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-bold tracking-normal">
              Fila de musicas
            </h1>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              Gerencie os pedidos das comandas e organize a ordem das musicas.
            </p>
          </div>
          {canManageQueue ? (
            <Button onClick={openAddDialog} disabled={isMutating}>
              <Plus className="size-4" /> Adicionar musica
            </Button>
          ) : (
            <Badge variant="outline">Somente visualizacao</Badge>
          )}
        </div>

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
            {canManageQueue ? (
              <Button
                variant="outline"
                onClick={() => setPendingAction({ type: "advance" })}
                disabled={isMutating || songs.length === 0}
              >
                <SkipForward className="size-4" />
                {currentSong ? "Proxima musica" : "Iniciar proxima"}
              </Button>
            ) : null}
          </CardHeader>
        </Card>

        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <ListMusic className="size-5" /> Proximas musicas
              </h2>
              {canReorder ? (
                <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                  Arraste um card ou use as setas para alterar a ordem da fila.
                </p>
              ) : null}
            </div>
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
              {queuedSongs.map((song, index) => {
                const displayPosition = song.position ?? index + 1
                const isFirst = index === 0
                const isLast = index === queuedSongs.length - 1
                const isDragging = draggingId === song.id
                const isDragOver = dragOverId === song.id && !isDragging

                return (
                  <Card
                    key={song.id}
                    draggable={canReorder && !isMutating}
                    onDragStart={(event) => handleDragStart(event, song)}
                    onDragOver={(event) => handleDragOver(event, song)}
                    onDragLeave={(event) => handleDragLeave(event, song)}
                    onDrop={(event) => handleDrop(event, index)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "rounded-[18px] shadow-none transition-all duration-150",
                      canReorder && !isMutating && "cursor-grab active:cursor-grabbing",
                      isDragging && "opacity-50 ring-2 ring-purple-300",
                      isDragOver &&
                        "border-purple-400 bg-purple-50/60 ring-2 ring-purple-200 dark:border-purple-500 dark:bg-purple-950/20 dark:ring-purple-900"
                    )}
                  >
                    <CardContent className="flex items-center gap-3 py-4 max-sm:flex-wrap">
                      {canManageQueue ? (
                        <span
                          aria-hidden="true"
                          title={
                            canReorder
                              ? "Arraste para reordenar"
                              : "Adicione mais musicas para reordenar"
                          }
                          className={cn(
                            "flex shrink-0 items-center text-muted-foreground",
                            !canReorder && "opacity-35"
                          )}
                        >
                          <GripVertical className="size-4" />
                        </span>
                      ) : null}

                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-black text-purple-950 dark:bg-purple-950/60 dark:text-purple-200">
                        {displayPosition}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold">{song.title}</p>
                        <p className="mt-1 text-sm font-medium text-muted-foreground">
                          {displayComandaName(song.tabName)}
                        </p>
                      </div>

                      <p className="flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground">
                        <Clock3 className="size-3.5" />{" "}
                        {formatDate(song.requestedAt)}
                      </p>

                      {canManageQueue ? (
                        <div className="flex shrink-0 items-center gap-1 max-sm:ml-auto">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Mover ${song.title} para o topo`}
                            title="Mover para o topo (1º da fila)"
                            onClick={() => void moveSong(song.id, 1)}
                            disabled={isMutating || isFirst}
                          >
                            <ArrowUpToLine className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Subir ${song.title} na fila`}
                            title="Subir uma posicao"
                            onClick={() => void moveSong(song.id, index)}
                            disabled={isMutating || isFirst}
                          >
                            <ArrowUp className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Descer ${song.title} na fila`}
                            title="Descer uma posicao"
                            onClick={() => void moveSong(song.id, index + 2)}
                            disabled={isMutating || isLast}
                          >
                            <ArrowDown className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Cancelar ${song.title}`}
                            title="Cancelar musica"
                            onClick={() =>
                              setPendingAction({ type: "cancel", song })
                            }
                            disabled={isMutating}
                          >
                            <Trash2 className="size-4 text-red-700 dark:text-red-400" />
                          </Button>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </section>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar musica a fila</DialogTitle>
            <DialogDescription>
              A musica entra no fim da fila e fica vinculada a comanda
              solicitante.
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
            <Button
              onClick={addSong}
              disabled={isMutating || !title.trim() || !tabId}
            >
              {isMutating ? "Adicionando..." : "Adicionar musica"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={pendingAction !== null}
        onOpenChange={(open) => !open && setPendingAction(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingAction?.type === "advance"
                ? "Avancar fila"
                : "Cancelar musica"}
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
              variant={
                pendingAction?.type === "cancel" ? "destructive" : "default"
              }
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
