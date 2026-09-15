import { FormEvent, useEffect, useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function LoginPage() {
  const navigate = useNavigate()
  const { data: session, isPending } = authClient.useSession()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (session) navigate("/comandas", { replace: true })
  }, [navigate, session])

  if (isPending)
    return (
      <main className="grid min-h-screen place-items-center">
        Carregando...
      </main>
    )
  if (session) return <Navigate to="/comandas" replace />

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setSubmitting(true)
    const result = await authClient.signIn.email({ email, password })
    setSubmitting(false)
    if (result.error)
      setError(result.error.message ?? "Nao foi possivel entrar.")
    else navigate("/comandas", { replace: true })
  }

  return (
    <main className="grid min-h-screen place-items-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-5 rounded-2xl border bg-white p-8 shadow-sm dark:bg-zinc-900"
      >
        <div>
          <h1 className="text-2xl font-bold">Entrar no OnStage</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Acesso exclusivo para funcionarios.
          </p>
        </div>
        <label className="block space-y-2 text-sm font-medium">
          Email
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block space-y-2 text-sm font-medium">
          Senha
          <Input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        <Button className="w-full" disabled={submitting}>
          {submitting ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </main>
  )
}
