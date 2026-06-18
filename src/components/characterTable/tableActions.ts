import type { CharacterTable } from '../../types/characterTable'
import type { HeaderMenuItem } from '../grid/SheetHeaders'

export type RowTableActions = {
  insertAbove: (index: number) => void
  insertBelow: (index: number) => void
  deleteRows: (indices: number[]) => void
  combineRows: () => void
  splitRows: () => void
}

export type ColumnTableActions = {
  insertBefore: (index: number) => void
  insertAfter: (index: number) => void
  deleteColumns: (indices: number[]) => void
  combineColumns: () => void
  splitColumns: () => void
}

export function rowMenuItems(
  rowIndex: number,
  table: CharacterTable,
  actions: RowTableActions,
  canCombineRows: boolean,
): HeaderMenuItem[] {
  return [
    {
      id: 'insert-above',
      label: 'Insert row above',
      onSelect: () => actions.insertAbove(rowIndex),
    },
    {
      id: 'insert-below',
      label: 'Insert row below',
      onSelect: () => actions.insertBelow(rowIndex),
    },
    {
      id: 'delete',
      label: 'Delete row',
      disabled: table.rows.length <= 1,
      variant: 'danger',
      onSelect: () => actions.deleteRows([rowIndex]),
    },
    {
      id: 'combine',
      label: 'Combine selected rows',
      disabled: !canCombineRows,
      onSelect: actions.combineRows,
    },
  ]
}

export function columnMenuItems(
  colIndex: number,
  table: CharacterTable,
  actions: ColumnTableActions,
  canCombineColumns: boolean,
): HeaderMenuItem[] {
  return [
    {
      id: 'insert-before',
      label: 'Insert column before',
      onSelect: () => actions.insertBefore(colIndex),
    },
    {
      id: 'insert-after',
      label: 'Insert column after',
      onSelect: () => actions.insertAfter(colIndex),
    },
    {
      id: 'delete',
      label: 'Delete column',
      disabled: table.columns.length <= 1,
      variant: 'danger',
      onSelect: () => actions.deleteColumns([colIndex]),
    },
    {
      id: 'combine',
      label: 'Combine selected columns',
      disabled: !canCombineColumns,
      onSelect: actions.combineColumns,
    },
  ]
}
