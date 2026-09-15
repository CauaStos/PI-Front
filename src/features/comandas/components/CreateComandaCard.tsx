import { Loader2, Plus } from "lucide-react"

export function CreateComandaCard({
  onClick,
  disabled,
}: {
  onClick: () => void
  disabled: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Criar comanda"
      title="Criar comanda"
      className="min-h-[236px] animate-in rounded-[18px] border-2 border-dashed border-zinc-300 bg-muted/30 text-muted-foreground transition duration-200 fade-in-0 zoom-in-95 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-950 disabled:pointer-events-none disabled:opacity-60 dark:hover:bg-purple-950/20 dark:hover:text-purple-100"
    >
      <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-background shadow-sm">
        {disabled ? (
          <Loader2 className="size-8 animate-spin" />
        ) : (
          <Plus className="size-9" />
        )}
      </span>
    </button>
  )
}
