import { FormEvent, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { authClient } from "@/lib/auth-client"
import { mapAuthError, useAuth } from "@/lib/auth"
import { safeRedirect } from "@/lib/redirect"
import { validateEmail } from "@/lib/validation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AuthAlert, AuthShell } from "@/features/auth/AuthShell"

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { refetch } = useAuth()
  const from = safeRedirect(
    (location.state as { from?: unknown } | null)?.from
  )
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    const emailError = validateEmail(email)
    if (emailError) return setError(emailError)
    if (!password) return setError("Informe a senha.")

    setSubmitting(true)
    const result = await authClient.signIn.email({
      email: email.trim(),
      password,
    })
    setSubmitting(false)

    if (result.error) {
      setError(mapAuthError(result.error, "Não foi possível entrar."))
      return
    }

    await refetch()
    toast.success("Bem-vindo de volta!")
    navigate(from, { replace: true })
  }

  return (
    <AuthShell
      title="Entrar no OnStage"
      subtitle="Acesso para a equipe do OnStage."
      footer={
        <div className="flex items-center justify-between text-sm font-medium">
          <Link
            to="/cadastro"
            state={{ from }}
            className="text-zinc-900 hover:underline dark:text-zinc-100"
          >
            Criar conta
          </Link>
          <Link
            to="/esqueci-senha"
            className="text-zinc-500 hover:underline dark:text-zinc-400"
          >
            Esqueci minha senha
          </Link>
        </div>
      }
    >
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
        <label className="block space-y-2 text-sm font-medium">
          Senha
          <Input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error ? <AuthAlert tone="error">{error}</AuthAlert> : null}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </AuthShell>
  )
}
