import type { CharacterTable, HeaderSpec } from '../types/characterTable'

export type HeaderAxis = 'columns' | 'rows'

function assignMissingIds(
  headers: HeaderSpec[],
  prefix: 'col' | 'row',
): HeaderSpec[] {
  const used = new Set(headers.map((h) => h.id).filter(Boolean) as string[])
  let counter = 0

  return headers.map((header) => {
    if (header.id) {
      return header
    }
    while (used.has(`${prefix}-${counter}`)) {
      counter++
    }
    const id = `${prefix}-${counter}`
    used.add(id)
    counter++
    return { ...header, id }
  })
}

/** Assign col-{n} / row-{n} ids to headers missing them. Mutates and returns table. */
export function ensureHeaderIds(table: CharacterTable): CharacterTable {
  return {
    ...table,
    columns: assignMissingIds(table.columns, 'col'),
    rows: assignMissingIds(table.rows, 'row'),
  }
}

export function validateUniqueIds(table: CharacterTable): void {
  for (const axis of ['columns', 'rows'] as const) {
    const headers = table[axis]
    const seen = new Set<string>()
    for (const header of headers) {
      const id = header.id
      if (!id) {
        continue
      }
      if (seen.has(id)) {
        throw new Error(`duplicate header id "${id}" in ${axis}`)
      }
      seen.add(id)
    }
  }
}

export function headerById(
  table: CharacterTable,
  axis: HeaderAxis,
  id: string,
): { index: number; header: HeaderSpec } | null {
  const headers = table[axis]
  const index = headers.findIndex((h) => h.id === id)
  if (index < 0) {
    return null
  }
  return { index, header: headers[index]! }
}
