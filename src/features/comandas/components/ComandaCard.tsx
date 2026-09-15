import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import {
  Check,
  Clock3,
  ListMusic,
  MoreHorizontal,
  QrCode,
  X,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Song } from "@/data/comanda-board"
import { cn } from "@/lib/utils"
import {
  Comanda,
  avatarTones,
  billableOrderCount,
  comandaHeaderClass,
  comandaStatusLabel,
  displayComandaName,
  displayComandaNumber,
  formatDate,
  qrCells,
} from "../shared"

export function ComandaCard({
  comanda,
  selected,
  onClick,
  onFinish,
  onCancel,
  songs,
}: {
  comanda: Comanda
  selected: boolean
  onClick: () => void
  onFinish: () => void
  onCancel: () => void
  songs: Song[]
}) {
  const queue = songs.filter(
    (song) =>
      song.tab === comanda.id &&
      (song.status === "playing" || song.status === "queued")
  )
  const terminal =
    comanda.status === "finished" || comanda.status === "cancelled"
  const hasBillableOrders = billableOrderCount(comanda) > 0

  return (
    <Card
      className={cn(
        "min-h-[236px] animate-in rounded-[18px] bg-card p-2 text-card-foreground transition duration-200 fade-in-0 zoom-in-95 hover:ring-purple-300",
        selected && "ring-2 ring-purple-200",
        comanda.status === "cancelled" && "opacity-55"
      )}
    >
      <CardContent className="px-2 pt-2 pb-2">
        <button
          type="button"
          className="w-full min-w-0 text-left"
          onClick={onClick}
        >
          <h2
            className={cn(
              "inline-flex max-w-full items-center gap-2 rounded-[10px] px-3 py-2 text-[24px] leading-none font-bold",
              comandaHeaderClass[comanda.status]
            )}
          >
            <span>{displayComandaNumber(comanda.tableName)}</span>
            <span className="min-w-0 truncate text-[11px] leading-none font-black uppercase">
              {comandaStatusLabel[comanda.status]}
            </span>
          </h2>
          <p className="mt-2 text-[11px] font-bold text-muted-foreground">
            Aberta em
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
            <Clock3 className="size-3.5" /> {formatDate(comanda.openedAt)}
          </p>
        </button>

        <button
          type="button"
          className="mt-3 w-full text-left"
          onClick={onClick}
        >
          <div className="space-y-1.5">
            <p className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
              <ListMusic className="size-3.5" /> Fila de musicas
            </p>
            {queue.slice(0, 2).map((song) => (
              <p
                key={song.id}
                className="truncate text-xs font-semibold text-foreground"
              >
                {song.status === "playing" ? "Tocando: " : `${song.position}. `}
                {song.title}
              </p>
            ))}
            {queue.length > 2 ? (
              <p className="text-xs font-semibold text-muted-foreground">
                +{queue.length - 2} na fila
              </p>
            ) : null}
            {queue.length === 0 ? (
              <p className="text-xs font-semibold text-muted-foreground">
                Aguardando primeira musica
              </p>
            ) : null}
          </div>
        </button>

        <div className="mt-3 flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={`Acoes de ${displayComandaName(comanda.tableName)}`}
              className={cn(
                "rounded-md px-2 py-1 text-muted-foreground hover:text-foreground",
                "hover:bg-muted"
              )}
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {terminal ? (
                <DropdownMenuItem disabled>
                  Sem ações disponíveis
                </DropdownMenuItem>
              ) : (
                <>
                  <DropdownMenuItem
                    onClick={onFinish}
                    disabled={!hasBillableOrders}
                  >
                    <Check className="size-4" /> Finalizar Comanda
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={onCancel}>
                    <X className="size-4" /> Cancelar Comanda
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}

export function QrCodeSlot({ comanda }: { comanda?: Comanda }) {
  return (
    <aside className="h-fit rounded-[18px] border border-border bg-card p-3 text-card-foreground shadow-none">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-muted-foreground">QR Code</p>
        <QrCode className="size-4 text-muted-foreground" />
      </div>
      <div className="mt-3 rounded-[14px] bg-white p-3 text-zinc-950 ring-1 ring-border">
        <div className="grid aspect-square grid-cols-7 gap-1">
          {Array.from({ length: 49 }).map((_, index) => (
            <span
              key={index}
              className={cn(
                "rounded-[2px]",
                qrCells.has(index) ? "bg-zinc-950" : "bg-white"
              )}
            />
          ))}
        </div>
      </div>
      <p className="mt-3 truncate text-center text-sm font-bold">
        {comanda ? displayComandaName(comanda.tableName) : "Nenhuma comanda"}
      </p>
    </aside>
  )
}

export function MemberAvatar({ label, tone }: { label: string; tone: number }) {
  return (
    <Avatar
      size="sm"
      className={avatarTones[tone % avatarTones.length]}
      title={label}
    >
      <AvatarFallback
        className={cn(
          "text-xs font-bold",
          avatarTones[tone % avatarTones.length]
        )}
      >
        {label}
      </AvatarFallback>
    </Avatar>
  )
}
