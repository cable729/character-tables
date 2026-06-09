import type { CharacterTable } from './characterTable'

export const BASELINE_CHECKPOINT_ID = 'cp-baseline'

export type Checkpoint = {
  id: string
  name: string
  parentId: string | null
  table: CharacterTable
  createdAt: string
  isBaseline?: boolean
}

export function createCheckpoint(
  name: string,
  table: CharacterTable,
  options?: {
    id?: string
    parentId?: string | null
    isBaseline?: boolean
  },
): Checkpoint {
  const trimmed = name.trim()
  if (!trimmed) {
    throw new Error('checkpoint name cannot be empty')
  }
  return {
    id: options?.id ?? `cp-${crypto.randomUUID()}`,
    name: trimmed,
    parentId: options?.parentId ?? null,
    table: structuredClone(table),
    createdAt: new Date().toISOString(),
    isBaseline: options?.isBaseline,
  }
}
