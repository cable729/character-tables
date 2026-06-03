import { z } from 'zod'
import type { CharacterTable } from '../types/characterTable'
import { ensureHeaderIds, validateUniqueIds } from '../diagram/headerIds'
import { inferN, validateMatrixDimensions } from '../diagram/utils'
import { validateExpansionCounts } from './expansionCountValidation'

/** Matrix cells may be bare numbers in YAML (1, 0) or LaTeX strings. */
const latexCellSchema = z
  .union([z.string(), z.number(), z.boolean()])
  .transform((value) => String(value))

const latexScalarSchema = z
  .union([z.string(), z.number()])
  .transform((value) => String(value))

const arcPairSchema = z.tuple([z.number().int().min(1), z.number().int().min(1)])
const arcPairsSchema = z.union([arcPairSchema, z.array(arcPairSchema)])

const arcDictSchema = z.object({
  above: z.record(z.string(), arcPairsSchema).optional(),
  below: z.record(z.string(), arcPairsSchema).optional(),
})

export const headerSpecSchema = z.object({
  id: z.string().min(1).optional(),
  arcs: arcDictSchema.optional(),
  restriction: z.string().optional(),
  classSize: latexScalarSchema.optional(),
  expansionCount: latexScalarSchema.optional(),
})

export const tableTypeSchema = z.enum(['character', 'supercharacter'])

export const characterTableSchema = z.object({
  title: z.string().optional(),
  group: z.string().optional(),
  tableType: tableTypeSchema.optional(),
  groupOrder: latexScalarSchema.optional(),
  n: z.number().int().min(1).optional(),
  columns: z.array(headerSpecSchema).min(1),
  rows: z.array(headerSpecSchema).min(1),
  matrix: z.array(z.array(latexCellSchema)),
})

export function parseCharacterTable(json: unknown): CharacterTable {
  let table = characterTableSchema.parse(json)
  validateMatrixDimensions(table)
  validateExpansionCounts(table)
  if (!table.title && !table.group) {
    throw new Error('table must have a title or group')
  }
  inferN(table)
  table = ensureHeaderIds(table)
  validateUniqueIds(table)
  return table
}

export function isSupercharacterTable(
  table: Pick<CharacterTable, 'tableType'>,
): boolean {
  return table.tableType === 'supercharacter'
}

export function validateCharacterTable(json: unknown): {
  success: boolean
  data?: CharacterTable
  error?: string
} {
  try {
    const data = parseCharacterTable(json)
    return { success: true, data }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}
