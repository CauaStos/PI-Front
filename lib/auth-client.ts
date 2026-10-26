import { createAuthClient } from "better-auth/react"
import { jwtClient } from "better-auth/client/plugins"

const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? "/api/v1"
const authUrl = apiUrl.replace(/\/api\/v1\/?$/, "") + "/api/auth"

// better-auth exige URL absoluta; no modo proxy do vite cai no origin atual.
const baseURL = authUrl.startsWith("http")
  ? authUrl
  : `${typeof window !== "undefined" ? window.location.origin : ""}${authUrl}`

export const authClient = createAuthClient({
  baseURL,
  fetchOptions: { credentials: "include" },
  plugins: [jwtClient()],
})
