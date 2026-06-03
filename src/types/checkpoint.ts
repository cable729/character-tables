import type { CharacterTable } from './characterTable'

export type Checkpoint = {
  id: string
  name: string
  parentId: string | null
  table: CharacterTable
  createdAt: string
}

export function createCheckpoint(
  name: string,
  table: CharacterTable,
  options?: { id?: string; parentId?: string | null },
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
  }
}
