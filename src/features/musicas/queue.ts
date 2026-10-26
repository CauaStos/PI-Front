import type { Song } from "@pi/contracts"

export function resolveEmployeeRoleFromSession(
  user: { role?: string; employeeRole?: string } | null | undefined
): string | undefined {
  if (user?.employeeRole) return user.employeeRole
  if (user?.role === "admin") return "ADMIN"
  return undefined
}

/**
 * Reordena otimisticamente as musicas com status "queued" mantendo a musica
 * em execucao ("playing") intacta e renumerando as posicoes de 1 ate N.
 */
export function reorderQueuedSongs(
  songs: readonly Song[],
  songId: string,
  targetPosition: number
): Song[] {
  const nonQueued = songs.filter((song) => song.status !== "queued")
  const queued = songs.filter((song) => song.status === "queued")

  const fromIndex = queued.findIndex((song) => song.id === songId)
  const toIndex = targetPosition - 1

  if (
    fromIndex === -1 ||
    !Number.isInteger(targetPosition) ||
    toIndex < 0 ||
    toIndex >= queued.length ||
    fromIndex === toIndex
  ) {
    return [...songs]
  }

  const nextQueued = [...queued]
  const [moved] = nextQueued.splice(fromIndex, 1)
  if (!moved) return [...songs]
  nextQueued.splice(toIndex, 0, moved)

  const renumbered = nextQueued.map((song, index) => ({
    ...song,
    position: index + 1,
  }))

  return [...nonQueued, ...renumbered]
}
