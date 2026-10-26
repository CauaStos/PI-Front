import { FormEvent, useState } from "react"
import { Link } from "react-router-dom"

import { authClient } from "@/lib/auth-client"
import { mapAuthError } from "@/lib/auth"
import { validateEmail } from "@/lib/validation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AuthAlert, AuthShell } from "@/features/auth/AuthShell"

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    const emailError = validateEmail(email)
    if (emailError) return setError(emailError)

    setSubmitting(true)
    const result = await authClient.requestPasswordReset({
      email: email.trim(),
      redirectTo: `${window.location.origin}/redefinir-senha`,
    })
    setSubmitting(false)

    if (result.error) {
      setError(mapAuthError(result.error, "Não foi possível enviar o link."))
      return
    }
    setSent(true)
  }

  return (
    <AuthShell
      title="Recuperar senha"
      subtitle="Informe seu email para receber o link de redefinição."
      footer={
        <p className="text-sm text-zinc-500">
          Lembrou a senha?{" "}
          <Link
            to="/login"
            className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
          >
            Voltar para o login
          </Link>
        </p>
      }
    >
      {sent ? (
        <AuthAlert tone="success">
          Se este email estiver cadastrado, enviamos um link de redefinição.
          {import.meta.env.DEV
            ? " Em desenvolvimento, o link aparece no console do backend."
            : ""}
        </AuthAlert>
      ) : (
        <form onSubmit={submit} className="space-y-5" noValidate>
          <label className="block space-y-2 text-sm font-medium">
            Email
            <Input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          {error ? <AuthAlert tone="error">{error}</AuthAlert> : null}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Enviando..." : "Enviar link"}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
