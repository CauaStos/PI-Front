import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { ActionSummary } from "./ActionSummary"
import {
  getActionDescription,
  getActionTitle,
  isPendingActionEmpty,
  type PendingAction,
} from "../shared"

export function ConfirmActionDialog({
  action,
  isMutating,
  onConfirm,
  onClose,
}: {
  action: PendingAction
  isMutating: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Dialog open={action !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{getActionTitle(action)}</DialogTitle>
          <DialogDescription>{getActionDescription(action)}</DialogDescription>
        </DialogHeader>
        <ActionSummary action={action} />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Voltar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isMutating || isPendingActionEmpty(action)}
            className={cn(
              (action?.type === "cancelar-comanda" ||
                action?.type === "remover-pedidos") &&
                "bg-red-900 text-white hover:bg-red-950"
            )}
          >
            {isMutating ? "Processando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
