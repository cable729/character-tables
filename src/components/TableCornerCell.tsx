import type { TableCornerLabels } from './tableLayout'

export function TableCornerCell({
  cornerLabels,
  compact = false,
}: {
  cornerLabels: TableCornerLabels
  compact?: boolean
}) {
  const labelClass = compact
    ? 'text-[7px] font-medium uppercase tracking-normal text-slate-500'
    : 'text-[10px] font-medium uppercase tracking-wide text-slate-500'

  return (
    <div className={`relative w-full ${compact ? 'h-10' : 'h-12'}`}>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 64">
        <line x1="0" y1="0" x2="100" y2="64" stroke="#cbd5e1" strokeWidth="1" />
      </svg>
      <span
        className={`absolute ${compact ? 'right-0.5 top-0.5' : 'right-2 top-1'} ${labelClass}`}
      >
        {cornerLabels.col}
      </span>
      <span
        className={`absolute ${compact ? 'bottom-0.5 left-0.5' : 'bottom-1 left-2'} ${labelClass}`}
      >
        {cornerLabels.row}
      </span>
    </div>
  )
}
