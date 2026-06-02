import { z } from 'zod'
import type { CharacterTable } from '../types/characterTable'
import { inferN, validateMatrixDimensions } from '../diagram/utils'

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

const headerSpecSchema = z.object({
  arcs: arcDictSchema.optional(),
  restriction: z.string().optional(),
  classSize: latexScalarSchema.optional(),
})

export const characterTableSchema = z.object({
  title: z.string().optional(),
  group: z.string().optional(),
  n: z.number().int().min(1).optional(),
  columns: z.array(headerSpecSchema).min(1),
  rows: z.array(headerSpecSchema).min(1),
  matrix: z.array(z.array(latexCellSchema)),
})

export function parseCharacterTable(json: unknown): CharacterTable {
  const table = characterTableSchema.parse(json)
  validateMatrixDimensions(table)
  if (!table.title && !table.group) {
    throw new Error('table must have a title or group')
  }
  inferN(table)
  return table
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
