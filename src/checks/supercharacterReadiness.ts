import type { CharacterTable, HeaderSpec } from '../types/characterTable'
import type { CheckBlockInfo } from './types'

export function tableHasThetaCells(table: CharacterTable): boolean {
  for (const row of table.matrix) {
    for (const cell of row) {
      if (cell.includes('\\theta')) {
        return true
      }
    }
  }
  return false
}

export function supercharacterMetadataBlockInfo(
  table: CharacterTable,
): CheckBlockInfo {
  if (!table.groupOrder) {
    return {
      blocked: true,
      reason: 'groupOrder is required',
    }
  }

  for (let j = 0; j < table.columns.length; j++) {
    if (!table.columns[j]?.classSize) {
      return {
        blocked: true,
        reason: `classSize required on column ${j} (superclass size |K|)`,
      }
    }
  }

  if (tableHasThetaCells(table)) {
    return {
      blocked: true,
      reason: 'supercharacter cells must be polynomials in q (no \\theta)',
    }
  }

  return { blocked: false }
}

/** Single source of truth for whether a supercharacter check can run. */
export function resolveSupercharacterCheckBlocked(
  checkId: string,
  table: CharacterTable,
): CheckBlockInfo {
  if (checkId === 'superchar-count') {
    return { blocked: false }
  }
  if (checkId === 'superchar-superclass-sizes') {
    if (!table.groupOrder) {
      return { blocked: true, reason: 'groupOrder is required' }
    }
    for (let j = 0; j < table.columns.length; j++) {
      if (!table.columns[j]?.classSize) {
        return {
          blocked: true,
          reason: `classSize required on column ${j} (superclass size |K|)`,
        }
      }
    }
    return { blocked: false }
  }
  return supercharacterMetadataBlockInfo(table)
}

export function isTrivialHeader(spec: HeaderSpec): boolean {
  if (spec.restriction) {
    return false
  }
  const above = spec.arcs?.above
  const below = spec.arcs?.below
  const hasAbove = above != null && Object.keys(above).length > 0
  const hasBelow = below != null && Object.keys(below).length > 0
  return !hasAbove && !hasBelow
}
