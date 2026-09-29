const AUTH_PATHS = [
  "/login",
  "/cadastro",
  "/esqueci-senha",
  "/redefinir-senha",
]

/**
 * Normaliza o destino salvo pelo guard. So aceita caminhos internos e nunca
 * devolve o usuario para uma tela publica de auth (evita loop de redirect).
 */
export function safeRedirect(
  value: unknown,
  fallback = "/comandas"
): string {
  if (typeof value !== "string") return fallback
  if (!value.startsWith("/") || value.startsWith("//")) return fallback
  if (AUTH_PATHS.some((path) => value === path || value.startsWith(`${path}?`)))
    return fallback
  return value
}
