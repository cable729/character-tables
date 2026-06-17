import type { CharacterTable, HeaderSpec } from './characterTable'
import type { GroupTableFields } from '../groups/groupSpec'
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
      op: 'setHeader'
      axis: 'rows' | 'columns'
      index: number
      before: HeaderSpec
      after: HeaderSpec
    }
  | {
      op: 'combineHeaders'
      transformStep: Extract<TransformStep, { op: 'combineHeaders' }>
      before: CharacterTable
      after: CharacterTable
      lineageBefore: Record<string, HeaderLineage>
      lineageAfter: Record<string, HeaderLineage>
    }
  | {
      op: 'setGroupSpec'
      before: GroupTableFields
      after: GroupTableFields
    }

export const MAX_HISTORY_OPS = 200

export function emptyHistory(): EditHistory {
  return { past: [], future: [] }
}
