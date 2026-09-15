import { createAuthClient } from "better-auth/react"

const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? "/api/v1"
const authUrl = apiUrl.replace(/\/api\/v1\/?$/, "") + "/api/auth"

export const authClient = createAuthClient({
  baseURL: authUrl,
  fetchOptions: { credentials: "include" },
})
