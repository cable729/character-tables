import type { TableCheck } from '../../checks/types'

export function isStructuralCheck(check: TableCheck): boolean {
  return check.tier === 'structural'
}

export function usesSageCheck(check: TableCheck): boolean {
  return Boolean(check.usesSage && check.buildSageCode)
}
