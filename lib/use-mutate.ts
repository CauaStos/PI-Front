import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

/**
 * Estado compartilhado de mutacao (isMutating) com reload integrado e
 * feedback via toast. `reload` roda apos toda acao bem-sucedida; `afterReload`
 * (opcional) roda com o resultado do reload e sempre ve a versao mais
 * recente via ref, entao pode fechar sobre estado do componente.
 */
export function useMutate(
  reload: () => Promise<unknown>,
  afterReload?: (reloaded: unknown) => void
) {
  const [isMutating, setIsMutating] = useState(false)
  const afterReloadRef = useRef(afterReload)
  useEffect(() => {
    afterReloadRef.current = afterReload
  })

  async function mutate(action: () => Promise<string>): Promise<boolean> {
    setIsMutating(true)
    try {
      const text = await action()
      const reloaded = await reload()
      afterReloadRef.current?.(reloaded)
      toast.success(text)
      return true
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operacao falhou.")
      return false
    } finally {
      setIsMutating(false)
    }
  }

  return { isMutating, mutate }
}
