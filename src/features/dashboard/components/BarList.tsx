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
}: {
  rows: BarRow[]
  ariaLabel: string
}) {
  const max = Math.max(1, ...rows.map((r) => r.value))

  return (
    <ul aria-label={ariaLabel} className="m-0 grid list-none gap-2.5 p-0">
      {rows.map((row) => (
        <li
          key={row.key}
          className="grid grid-cols-[88px_minmax(0,1fr)_36px] items-center gap-3 text-[13px]"
        >
          <span className="truncate font-medium text-muted-foreground">
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
          <span className="text-right font-bold tabular-nums">{row.value}</span>
        </li>
      ))}
    </ul>
  )
}
