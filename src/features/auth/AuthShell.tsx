import type { ReactNode } from "react"

type AuthShellProps = {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}

/** Moldura compartilhada das telas publicas de autenticacao. */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <main className="grid min-h-screen place-items-center bg-zinc-50 px-4 py-8 dark:bg-zinc-950">
      <div className="w-full max-w-sm space-y-5 rounded-2xl border bg-white p-8 shadow-sm dark:bg-zinc-900">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
          ) : null}
        </div>
        {children}
        {footer}
      </div>
    </main>
  )
}

export function AuthAlert({
  tone,
  children,
}: {
  tone: "error" | "success" | "info"
  children: ReactNode
}) {
  const toneClass =
    tone === "error"
      ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
      : tone === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
        : "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"

  return (
    <p role="alert" className={`rounded-lg border px-3 py-2 text-sm ${toneClass}`}>
      {children}
    </p>
  )
}
