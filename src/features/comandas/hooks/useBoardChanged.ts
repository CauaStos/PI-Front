import { useEffect, useRef } from "react"

import { onBoardChanged } from "@/lib/realtime"

/**
 * Assina o evento "board:changed" do backend e dispara o callback
 * (com debounce leve) sempre que qualquer cliente altera o board.
 */
export function useBoardChanged(onChange: () => void) {
  const cbRef = useRef(onChange)

useEffect(() => {
  cbRef.current = onChange
}, [onChange])

  useEffect(() => {
    let timer: number | undefined
    const unsubscribe = onBoardChanged(() => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => cbRef.current(), 250)
    })
    return () => {
      window.clearTimeout(timer)
      unsubscribe()
    }
  }, [])
}
