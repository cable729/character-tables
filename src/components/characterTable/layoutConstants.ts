import type { CSSProperties } from 'react'
import type { StickyColumnWidths } from '../tableColumnWidths'

export const OUTER_ROW_H = 28

export const thBase =
  'border border-slate-200 bg-slate-50 text-center text-slate-600'

export const stickyExpansion =
  'sticky-expansion-col sticky left-0 z-[var(--z-sticky-header)] bg-slate-50'

export const stickyDiagram =
  'sticky-diagram-col sticky z-[var(--z-sticky-header)] bg-slate-50'

export function headerPad(compact: boolean): string {
  return compact ? 'px-1.5 py-1' : 'px-2 py-1'
}

export function diagramStickyStyle(
  left: string | number,
  top?: number,
): CSSProperties {
  return {
    left,
    ...(top != null ? { top } : {}),
  }
}

export function stickyTableStyle(sticky: StickyColumnWidths): CSSProperties {
  return {
    '--expansion-col-w': `${sticky.expansion}px`,
    '--diagram-col-w': `${sticky.diagram}px`,
  } as CSSProperties
}

export const appendControlButtonClass =
  'flex h-full min-h-[1.75rem] w-full items-center justify-center rounded text-lg leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700'
