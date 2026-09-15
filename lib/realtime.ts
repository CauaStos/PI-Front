import { io } from "socket.io-client"

const socket = io({
  path: "/socket.io",
  withCredentials: true,
})

export function onBoardChanged(callback: () => void): () => void {
  socket.on("board:changed", callback)
  return () => {
    socket.off("board:changed", callback)
  }
}
