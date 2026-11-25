export interface Column {
  key: string
  /** Rotulo curto do eixo X (pode ser vazio para pular). */
  axisLabel: string
  /** Texto do tooltip, ex.: "22 nov". */
  tooltipLabel: string
  value: number
}

/**
 * Grafico de colunas de uma serie, sem dependencias. Coluna com cantos de 4px
 * no topo, grade recessiva e tooltip por coluna (alvo de hover maior que a
 * marca: a faixa inteira da coluna).
 */
export function ColumnChart({
  columns,
  unit,
  ariaLabel,
  formatValue,
  formatAxis,
}: {
  columns: Column[]
  /** Unidade contada (ex.: pedidos). Ignorada quando `formatValue` e passado. */
  unit?: [singular: string, plural: string]
  ariaLabel: string
  /** Formata o valor no tooltip (ex.: moeda). */
  formatValue?: (value: number) => string
  /** Formata os rotulos da grade; usa uma coluna de eixo mais larga. */
  formatAxis?: (value: number) => string
}) {
  const axis = formatAxis ? "w-14" : "w-6"
  const offset = formatAxis ? "left-16" : "left-8"
  const labelOffset = formatAxis ? "ml-16" : "ml-8"
  const describe = (value: number) =>
    formatValue
      ? formatValue(value)
      : `${value} ${unit ? (value === 1 ? unit[0] : unit[1]) : ""}`.trim()
  const max = Math.max(1, ...columns.map((c) => c.value))
  const top = niceCeil(max)

  return (
    <figure aria-label={ariaLabel} className="m-0 pt-3">
      <div className="relative h-44">
        {/* grade: topo, meio e base */}
        {[1, 0.5].map((f) => (
          <div
            key={f}
            className="absolute inset-x-0 flex items-center gap-2"
            style={{ bottom: `${f * 100}%` }}
          >
            <span className={`${axis} shrink-0 text-right text-[10px] tabular-nums text-muted-foreground`}>
              {formatAxis ? formatAxis(top * f) : Math.round(top * f)}
            </span>
            <span className="h-px flex-1 bg-viz-grid" />
          </div>
        ))}
        <div className={`absolute inset-y-0 right-0 ${offset} flex items-end gap-0.5 border-b border-border`}>
          {columns.map((column) => {
            const height = (column.value / top) * 100
            return (
              <div
                key={column.key}
                tabIndex={0}
                aria-label={`${column.tooltipLabel}: ${describe(column.value)}`}
                className="group relative flex h-full min-w-0 flex-1 items-end justify-center outline-none"
              >
                <div
                  className="w-full max-w-7 rounded-t-[4px] bg-viz-1 transition-opacity group-hover:opacity-80 group-focus-visible:opacity-80"
                  style={{ height: column.value > 0 ? `max(${height}%, 2px)` : 0 }}
                />
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded-md border border-border bg-popover px-2 py-1 text-xs whitespace-nowrap text-popover-foreground shadow-md group-hover:block group-focus-visible:block">
                  <span className="font-medium text-muted-foreground">
                    {column.tooltipLabel}
                  </span>{" "}
                  <span className="font-bold tabular-nums">
                    {describe(column.value)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <div className={`mt-1 ${labelOffset} flex gap-0.5`}>
        {columns.map((column) => (
          <span
            key={column.key}
            className="min-w-0 flex-1 overflow-visible text-center text-[10px] whitespace-nowrap text-muted-foreground"
          >
            {column.axisLabel}
          </span>
        ))}
      </div>
    </figure>
  )
}

/**
 * Arredonda para cima em passos pares (4, 6, 8, 10, 20, 40...), para que a
 * linha do meio da grade caia sempre num inteiro.
 */
function niceCeil(value: number): number {
  if (value <= 4) return 4
  const magnitude = 10 ** Math.floor(Math.log10(value))
  for (const step of [1, 2, 4, 6, 8, 10]) {
    if (value <= step * magnitude) return step * magnitude
  }
  return 10 * magnitude
}
