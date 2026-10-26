import { FormEvent, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { authClient } from "@/lib/auth-client"
import { mapAuthError, useAuth } from "@/lib/auth"
import { safeRedirect } from "@/lib/redirect"
import { validateRegistration } from "@/lib/validation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AuthAlert, AuthShell } from "@/features/auth/AuthShell"

export function RegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { refetch } = useAuth()
  const from = safeRedirect(
    (location.state as { from?: unknown } | null)?.from
  )
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    const validationError = validateRegistration({
      name,
      email,
      password,
      confirmation,
    })
    if (validationError) return setError(validationError)

    setSubmitting(true)
    const result = await authClient.signUp.email({
      name: name.trim(),
      email: email.trim(),
      password,
    })
    setSubmitting(false)

    if (result.error) {
      setError(
        mapAuthError(result.error, "Não foi possível criar a conta."),
      )
      return
    }

    // signUp.email ja cria a sessao; renovamos o token e entramos direto.
    await refetch()
    toast.success("Conta criada com sucesso!")
    navigate(from, { replace: true })
  }

  return (
    <AuthShell
      title="Criar conta"
      subtitle="O cadastro cria um funcionário com perfil de garçom."
      footer={
        <p className="text-sm text-zinc-500">
          Já tem conta?{" "}
          <Link
            to="/login"
            state={{ from }}
            className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
          >
            Entrar
          </Link>
        </p>
      }
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        <label className="block space-y-2 text-sm font-medium">
          Nome
          <Input
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
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
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <label className="block space-y-2 text-sm font-medium">
          Confirmar senha
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
          {submitting ? "Criando conta..." : "Criar conta"}
        </Button>
        <p className="text-xs text-zinc-500">Mínimo de 8 caracteres na senha.</p>
      </form>
    </AuthShell>
  )
}
