import { sageRequiredBlockedResult } from './sageBlocked'
import { resolveCheckBlocked } from './expansionReadiness'
import type { CheckTier, TableCheck } from './types'
import type { CharacterTable } from '../types/characterTable'

export type SageCheckDef = {
  id: string
  title: string
  description: string
  formulaLatex: string
  tier?: CheckTier
  requiresGroupOrder?: boolean
  buildSageCode: (
    table: CharacterTable,
    qValues: readonly number[],
  ) => string | null
}

/** Standard Sage-only numeric/symbolic check with shared blocked + runLocal wiring. */
export function defineSageCheck(def: SageCheckDef): TableCheck {
  return {
    id: def.id,
    title: def.title,
    description: def.description,
    formulaLatex: def.formulaLatex,
    tier: def.tier ?? 'numeric',
    requiresGroupOrder: def.requiresGroupOrder,
    requiresSage: true,
    usesSage: true,
    isBlocked: (table, qValues) =>
      resolveCheckBlocked(def.id, table, qValues),
    runLocal: () => sageRequiredBlockedResult(),
    buildSageCode: def.buildSageCode,
  }
}
