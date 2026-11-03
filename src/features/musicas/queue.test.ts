import { describe, expect, it } from "vitest"
import type { Song } from "@pi/contracts"
import {
  reorderQueuedSongs,
  resolveEmployeeRoleFromSession,
} from "./queue"

function mkSong(overrides: Partial<Song> & { id: string }): Song {
  return {
    title: `Musica ${overrides.id}`,
    tab: "t1",
    tabName: "Mesa 01",
    status: "queued",
    position: 1,
    requestedAt: "2026-10-26T00:00:00.000Z",
    startedAt: null,
    finishedAt: null,
    cancelledAt: null,
    ...overrides,
  }
}

describe("reorderQueuedSongs", () => {
  it("move musica para o topo preservando a musica em execucao e renumerando", () => {
    const initial: Song[] = [
      mkSong({ id: "playing-1", status: "playing", position: 0 }),
      mkSong({ id: "q1", position: 1 }),
      mkSong({ id: "q2", position: 2 }),
      mkSong({ id: "q3", position: 3 }),
    ]

    const result = reorderQueuedSongs(initial, "q3", 1)

    expect(result.map((s) => ({ id: s.id, position: s.position }))).toEqual([
      { id: "playing-1", position: 0 },
      { id: "q3", position: 1 },
      { id: "q1", position: 2 },
      { id: "q2", position: 3 },
    ])
  })

  it("move musica para baixo na fila", () => {
    const initial: Song[] = [
      mkSong({ id: "q1", position: 1 }),
      mkSong({ id: "q2", position: 2 }),
      mkSong({ id: "q3", position: 3 }),
    ]

    const result = reorderQueuedSongs(initial, "q1", 3)

    expect(result.map((s) => ({ id: s.id, position: s.position }))).toEqual([
      { id: "q2", position: 1 },
      { id: "q3", position: 2 },
      { id: "q1", position: 3 },
    ])
  })

  it("ignora posicao fora do limite ou id inexistente", () => {
    const initial: Song[] = [
      mkSong({ id: "q1", position: 1 }),
      mkSong({ id: "q2", position: 2 }),
    ]

    expect(reorderQueuedSongs(initial, "q1", 0)).toEqual(initial)
    expect(reorderQueuedSongs(initial, "q1", 5)).toEqual(initial)
    expect(reorderQueuedSongs(initial, "inexistente", 1)).toEqual(initial)
  })
})

describe("resolveEmployeeRoleFromSession", () => {
  it("prioriza employeeRole e faz fallback para role admin", () => {
    expect(
      resolveEmployeeRoleFromSession({ employeeRole: "OPERADOR", role: "user" })
    ).toBe("OPERADOR")
    expect(resolveEmployeeRoleFromSession({ role: "admin" })).toBe("ADMIN")
    expect(resolveEmployeeRoleFromSession({ role: "user" })).toBeUndefined()
    expect(resolveEmployeeRoleFromSession(null)).toBeUndefined()
  })
})
