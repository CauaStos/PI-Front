import { Loader2, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"

type RetryStateProps = {
  message: string
  onRetry: () => void
  loading?: boolean
}

export function RetryState({
  message,
  onRetry,
  loading = false,
}: RetryStateProps) {
  return (
    <div
      className="flex min-h-48 flex-col items-center justify-center gap-4 text-center"
      role="alert"
    >
      <p className="text-sm font-medium text-red-600 dark:text-red-400">
        {message}
      </p>
      <Button variant="outline" onClick={onRetry} disabled={loading}>
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <RotateCcw className="size-4" />
        )}
        {loading ? "Tentando..." : "Tentar novamente"}
      </Button>
    </div>
  )
}
