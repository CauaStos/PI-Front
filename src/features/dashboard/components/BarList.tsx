export interface BarRow {
  key: string
  label: string
  value: number
}

/**
 * Barras horizontais de uma serie com rotulo e valor diretos (o proprio
 * grafico funciona como tabela, entao a cor nunca carrega a informacao sozinha).
 */
export function BarList({
  rows,
  ariaLabel,
  formatValue = (v) => v.toLocaleString("pt-BR"),
  wideValue = false,
  emptyText = "Sem dados no periodo",
}: {
  rows: BarRow[]
  ariaLabel: string
  formatValue?: (value: number) => string
  /** Coluna de valor mais larga, para moeda. */
  wideValue?: boolean
  emptyText?: string
}) {
  if (rows.length === 0) {
    return <p className="py-6 text-center text-xs text-muted-foreground">{emptyText}</p>
  }
  const max = Math.max(1, ...rows.map((r) => r.value))

  return (
    <ul aria-label={ariaLabel} className="m-0 grid list-none gap-2.5 p-0">
      {rows.map((row) => (
        <li
          key={row.key}
          className={`grid items-center gap-3 text-[13px] ${
            wideValue
              ? "grid-cols-[minmax(96px,1.4fr)_minmax(48px,1fr)_88px]"
              : "grid-cols-[minmax(96px,1.4fr)_minmax(48px,1fr)_36px]"
          }`}
        >
          <span className="truncate font-medium text-muted-foreground" title={row.label}>
            {row.label}
          </span>
          <span className="h-3 rounded-r-[4px] bg-muted">
            <span
              className="block h-full rounded-r-[4px] bg-viz-1"
              style={{
                width: row.value > 0 ? `max(${(row.value / max) * 100}%, 3px)` : 0,
              }}
            />
          </span>
          <span className="text-right font-bold tabular-nums whitespace-nowrap">
            {formatValue(row.value)}
          </span>
        </li>
      ))}
    </ul>
  )
}
