import type { CheckResult } from './types'

export const SAGE_CONNECT_MESSAGE =
  'Connect a local Jupyter Sage kernel to run numeric checks.'

export function sageRequiredBlockedResult(): CheckResult {
  return {
    passes: false,
    blocked: true,
    blockReason: SAGE_CONNECT_MESSAGE,
  }
}

export function isNumericTier(tier: 'symbolic' | 'structural' | 'numeric'): boolean {
  return tier === 'numeric' || tier === 'symbolic'
}
