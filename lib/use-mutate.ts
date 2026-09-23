import { useEffect, useRef, useState } from "react"

export type MutateMessage = {
  type: "success" | "error"
  text: string
}

/**
 * Estado compartilhado de mutacao (isMutating + feedback) com reload
 * integrado. `reload` roda apos toda acao bem-sucedida; `afterReload`
 * (opcional) roda com o resultado do reload e sempre ve a versao mais
 * recente via ref, entao pode fechar sobre estado do componente.
 */
export function useMutate(
  reload: () => Promise<unknown>,
  afterReload?: (reloaded: unknown) => void
) {
  const [isMutating, setIsMutating] = useState(false)
  const [message, setMessage] = useState<MutateMessage | null>(null)
  const afterReloadRef = useRef(afterReload)
  useEffect(() => {
    afterReloadRef.current = afterReload
  })

  async function mutate(action: () => Promise<string>): Promise<boolean> {
    setIsMutating(true)
    setMessage(null)
    try {
      const text = await action()
      const reloaded = await reload()
      afterReloadRef.current?.(reloaded)
      setMessage({ type: "success", text })
      return true
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Operacao falhou.",
      })
      return false
    } finally {
      setIsMutating(false)
    }
  }

  return { isMutating, message, setMessage, mutate }
}
