import type { CharacterTable, HeaderSpec } from './characterTable'
import type { HeaderLineage, TransformStep } from './tableProject'

export type EditHistory = {
  past: TableEditOp[]
  future: TableEditOp[]
}

export type TableEditOp =
  | { op: 'setCell'; row: number; col: number; before: string; after: string }
  | {
      op: 'insertRow'
      index: number
      header: HeaderSpec
      cells: string[]
    }
  | {
      op: 'removeRow'
      index: number
      header: HeaderSpec
      cells: string[]
    }
  | {
      op: 'insertColumn'
      index: number
      header: HeaderSpec
      cells: string[]
    }
  | {
      op: 'removeColumn'
      index: number
      header: HeaderSpec
      cells: string[]
    }
  | {
      op: 'splitHeader'
      transformStep: Extract<TransformStep, { op: 'splitHeader' }>
      before: CharacterTable
      after: CharacterTable
      lineageBefore: Record<string, HeaderLineage>
      lineageAfter: Record<string, HeaderLineage>
    }
  | {
      op: 'combineHeaders'
      axis: 'rows' | 'columns'
      sourceIds: string[]
      resultId: string
      method: 'sum' | 'identical'
      before: CharacterTable
      after: CharacterTable
      lineageBefore: Record<string, HeaderLineage>
      lineageAfter: Record<string, HeaderLineage>
    }

export const MAX_HISTORY_OPS = 200

export function emptyHistory(): EditHistory {
  return { past: [], future: [] }
}
