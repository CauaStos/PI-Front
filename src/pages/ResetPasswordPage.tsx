import { FormEvent, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"

import { authClient } from "@/lib/auth-client"
import { mapAuthError, signOutAndClear } from "@/lib/auth"
import { validateReset } from "@/lib/validation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AuthAlert, AuthShell } from "@/features/auth/AuthShell"

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    const validationError = validateReset({ password, confirmation, token })
    if (validationError) return setError(validationError)
    if (!token) return

    setSubmitting(true)
    const result = await authClient.resetPassword({
      newPassword: password,
      token,
    })
    setSubmitting(false)

    if (result.error) {
      setError(
        mapAuthError(
          result.error,
          "Link inválido ou expirado. Solicite um novo."
        )
      )
      return
    }

    // O reset revoga as sessoes no back. Descarta a sessao em cache e o JWT em
    // memoria; se o link era de outra conta, isso apenas desloga a sessao atual.
    await signOutAndClear()
    setDone(true)
  }

  return (
    <AuthShell
      title="Definir nova senha"
      subtitle="Escolha uma senha nova com pelo menos 8 caracteres."
      footer={
        <p className="text-sm text-zinc-500">
          <Link
            to="/login"
            className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
          >
            Ir para o login
          </Link>
        </p>
      }
    >
      {!token ? (
        <AuthAlert tone="error">
          Link de redefinição inválido ou incompleto.{" "}
          <Link to="/esqueci-senha" className="font-medium underline">
            Solicitar novo link
          </Link>
        </AuthAlert>
      ) : done ? (
        <AuthAlert tone="success">
          Senha redefinida com sucesso. Use a nova senha para entrar.
        </AuthAlert>
      ) : (
        <form onSubmit={submit} className="space-y-5" noValidate>
          <label className="block space-y-2 text-sm font-medium">
            Nova senha
            <Input
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <label className="block space-y-2 text-sm font-medium">
            Confirmar nova senha
            <Input
              type="password"
              autoComplete="new-password"
              required
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
            />
          </label>
          {error ? <AuthAlert tone="error">{error}</AuthAlert> : null}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Salvando..." : "Salvar nova senha"}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
