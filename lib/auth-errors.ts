/**
 * Traduz mensagens comuns do Better Auth/back para algo amigavel ao usuario,
 * preservando mensagens ja localizadas (ex.: email duplicado responde 409).
 */
export function mapAuthError(
  error: { message?: string; status?: number; code?: string } | null | undefined,
  fallback: string
): string {
  const message = error?.message?.trim()
  const code = error?.code ?? ""

  if (
    error?.status === 409 ||
    code === "EMAIL_ALREADY_REGISTERED" ||
    code === "USER_ALREADY_EXISTS" ||
    /already (exists|registered)/i.test(message ?? "")
  )
    return "Este email já está cadastrado."

  if (message === "Invalid email or password")
    return "Email ou senha incorretos."

  if (/invalid token|token (is )?(invalid|expired)/i.test(message ?? ""))
    return "Link inválido ou expirado. Solicite um novo."

  return message || fallback
}
