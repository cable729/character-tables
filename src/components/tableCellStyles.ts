import type { DiagramEditorTarget } from './DiagramEditorDialog'

/** Gray hover — matches diagram row/column header cells. */
export const INTERACTIVE_CELL_HOVER = 'hover:bg-slate-50'

/** Finger cursor on editable targets. */
export const INTERACTIVE_CELL_CURSOR = 'cursor-pointer'

/** Active edit: amber border drawn inside the cell (not clipped). */
export const ACTIVE_EDIT_BORDER = 'ring-2 ring-inset ring-amber-400'

export function activeEditBorder(active: boolean): string {
  return active ? ACTIVE_EDIT_BORDER : ''
}

/** Diagram header `<th>` when modal targets that row/column. */
export function diagramHeaderCellClasses(active: boolean): string {
  return activeEditBorder(active)
}

/** Host classes for clickable LaTeX cells (matrix, |C|, Choices). */
export function editableLatexCellHost(
  compact: boolean,
  editing: boolean,
): string {
  const baseMin = compact ? 'min-h-[2.5rem]' : 'min-h-[3rem]'
  const editMin = compact ? 'min-h-[3.75rem]' : 'min-h-[4rem]'
  return [
    'relative p-0',
    editing ? editMin : baseMin,
    activeEditBorder(editing),
    !editing ? INTERACTIVE_CELL_CURSOR : '',
    !editing ? INTERACTIVE_CELL_HOVER : '',
  ]
    .filter(Boolean)
    .join(' ')
}

export type TableEditFocus =
  | { kind: 'diagram'; axis: 'row' | 'column'; index: number }
  | { kind: 'matrix'; row: number; col: number }
  | { kind: 'classSize'; col: number }
  | { kind: 'expansion'; axis: 'row' | 'column'; index: number }

export function resolveTableEditFocus(input: {
  diagramEditor: DiagramEditorTarget | null
  editingCell: { row: number; col: number } | null
  editingClassSize: number | null
  editingExpansionCount: { axis: 'row' | 'column'; index: number } | null
}): TableEditFocus | null {
  if (input.diagramEditor) {
    return {
      kind: 'diagram',
      axis: input.diagramEditor.kind,
      index: input.diagramEditor.index,
    }
  }
  if (input.editingCell) {
    return {
      kind: 'matrix',
      row: input.editingCell.row,
      col: input.editingCell.col,
    }
  }
  if (input.editingClassSize != null) {
    return { kind: 'classSize', col: input.editingClassSize }
  }
  if (input.editingExpansionCount) {
    return {
      kind: 'expansion',
      axis: input.editingExpansionCount.axis,
      index: input.editingExpansionCount.index,
    }
  }
  return null
}

export function isDiagramRowActive(
  row: number,
  focus: TableEditFocus | null,
): boolean {
  return (
    focus?.kind === 'diagram' && focus.axis === 'row' && focus.index === row
  )
}

export function isDiagramColActive(
  col: number,
  focus: TableEditFocus | null,
): boolean {
  return (
    focus?.kind === 'diagram' &&
    focus.axis === 'column' &&
    focus.index === col
  )
}

export function isMatrixCellActive(
  row: number,
  col: number,
  focus: TableEditFocus | null,
): boolean {
  return (
    focus?.kind === 'matrix' && focus.row === row && focus.col === col
  )
}

export function isClassSizeCellActive(
  col: number,
  focus: TableEditFocus | null,
): boolean {
  return focus?.kind === 'classSize' && focus.col === col
}

export function isExpansionCellActive(
  axis: 'row' | 'column',
  index: number,
  focus: TableEditFocus | null,
): boolean {
  return (
    focus?.kind === 'expansion' &&
    focus.axis === axis &&
    focus.index === index
  )
}
