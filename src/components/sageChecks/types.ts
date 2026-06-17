import type { CheckResult } from '../../checks/types'
import type { SageExecuteResult } from '../../jupyter/types'

export type CheckStatus =
  | 'pass'
  | 'fail'
  | 'running'
  | 'disabled'
  | 'pending'
  | 'blocked'
  | 'skipped'

export type CheckRowState = {
  result: CheckResult | null
  status: CheckStatus
}

export type SageRunState =
  | { phase: 'idle' }
  | { phase: 'running'; startedAt: number }
  | { phase: 'done'; result: SageExecuteResult }
