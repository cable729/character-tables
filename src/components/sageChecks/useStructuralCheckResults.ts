import { useEffect, useState } from 'react'
import type { TableCheck } from '../../checks/types'
import type { CharacterTable } from '../../types/characterTable'
import type { CheckRowState } from './types'

export function useStructuralCheckResults(
  checks: TableCheck[],
  table: CharacterTable,
  qValues: number[],
): Record<string, CheckRowState> {
  const checkIds = checks.map((c) => c.id).join('\0')

  const [results, setResults] = useState<Record<string, CheckRowState>>(() =>
    Object.fromEntries(
      checks.map((c) => [c.id, { status: 'pending' as const, result: null }]),
    ),
  )

  useEffect(() => {
    let cancelled = false
    setResults(
      Object.fromEntries(
        checks.map((c) => [c.id, { status: 'pending' as const, result: null }]),
      ),
    )

    void (async () => {
      for (const check of checks) {
        if (cancelled) return
        setResults((prev) => ({
          ...prev,
          [check.id]: { status: 'running', result: null },
        }))
        await new Promise<void>((resolve) => setTimeout(resolve, 0))
        if (cancelled) return
        try {
          const result = check.runLocal(table, qValues)
          if (cancelled) return
          setResults((prev) => ({
            ...prev,
            [check.id]: {
              status: result.passes ? 'pass' : 'fail',
              result,
            },
          }))
        } catch {
          if (cancelled) return
          setResults((prev) => ({
            ...prev,
            [check.id]: { status: 'fail', result: null },
          }))
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [checkIds, table, qValues, checks])

  return results
}
