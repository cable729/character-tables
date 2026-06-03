import type { HeaderSpec } from '../types/characterTable'
import type { CharacterTable } from '../types/characterTable'
import { collectLabelsFromDict } from '../diagram/utils'
import { parseNotAllZeroRestriction } from '../headers/canonicalize'
import {
  buildBelowLabelSplitChildren,
  type BelowLabelSplitResult,
} from './splitBelowLabel'

export type ProposedBelowLabelSplit = {
  belowLabel: string
  reason: string
  preview: BelowLabelSplitResult
}

/**
 * Suggest a below-arc label to split on when a known-good rule applies.
 */
export function proposeBelowLabelSplit(
  parent: HeaderSpec,
  table: CharacterTable,
): ProposedBelowLabelSplit | null {
  const { aboveLabels, belowLabels } = collectLabelsFromDict(parent.arcs)
  if (belowLabels.length === 0) {
    return null
  }

  const notAllZero = parseNotAllZeroRestriction(parent.restriction)
  if (notAllZero && notAllZero.length >= 2) {
    const allBelow = notAllZero.every((l) => belowLabels.includes(l))
    if (allBelow) {
      const belowLabel = notAllZero[notAllZero.length - 1]!
      const remaining = notAllZero.filter((l) => l !== belowLabel)
      try {
        const preview = buildBelowLabelSplitChildren(
          parent,
          belowLabel,
          table,
        )
        return {
          belowLabel,
          reason: String.raw`Step 1 — split on ${belowLabel}: under:${remaining[0]} + over:${belowLabel} with q(q-1) classes, and over:${remaining[0]} only with (q-1). Then split the mixed column on ${remaining[0]}.`,
          preview,
        }
      } catch {
        return null
      }
    }
  }

  if (
    belowLabels.length === 1 &&
    aboveLabels.length >= 1 &&
    !parent.restriction?.trim()
  ) {
    const belowLabel = belowLabels[0]!
    try {
      const preview = buildBelowLabelSplitChildren(
        parent,
        belowLabel,
        table,
      )
      return {
        belowLabel,
        reason: String.raw`Step 2 — split on ${belowLabel}: separate (q-1)^2, (q-1), and (q-1) overarc columns.`,
        preview,
      }
    } catch {
      return null
    }
  }

  return null
}
