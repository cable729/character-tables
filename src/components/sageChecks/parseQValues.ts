import { DEFAULT_CHECK_Q_VALUES } from '../../checks/registry'

export function parseQValuesInput(input: string): number[] {
  const values = input
    .split(/[,;\s]+/)
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n >= 2)
  return values.length > 0 ? values : [...DEFAULT_CHECK_Q_VALUES]
}
