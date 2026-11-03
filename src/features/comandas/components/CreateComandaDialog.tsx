import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { QrCodeSlot } from "./ComandaCard"

export function CreateComandaDialog({
  open,
  onOpenChange,
  comandaName,
  isMutating,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  comandaName: string
  isMutating: boolean
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmar abertura da comanda</DialogTitle>
          <DialogDescription>
            Confira as informações antes de abrir a comanda. A abertura só
            acontecerá após sua confirmação.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-[1fr_150px] sm:items-start">
          <dl className="space-y-3 rounded-lg border border-border bg-muted/30 p-4 text-sm">
            <div>
              <dt className="font-semibold text-muted-foreground">Comanda</dt>
              <dd className="mt-1 text-lg font-bold">{comandaName}</dd>
            </div>
            <div>
              <dt className="font-semibold text-muted-foreground">Status</dt>
              <dd className="mt-1 font-medium">Nova comanda</dd>
            </div>
          </dl>

          <div>
            <QrCodeSlot />
            <p className="mt-2 text-center text-xs text-muted-foreground">
              QR Code placeholder. A vinculação do cliente será integrada em
              uma etapa futura.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isMutating}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={onConfirm} disabled={isMutating}>
            {isMutating ? "Abrindo..." : "Abrir comanda"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
