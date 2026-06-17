import type { TableCheck } from '../../checks/types'
import { MathCell } from '../MathCell'

export function CheckDescription({ check }: { check: TableCheck }) {
  const tierLatex =
    check.tier === 'symbolic'
      ? String.raw`\text{Tier: symbolic in } q \text{ (verified in Sage at each test } q\text{).}`
      : check.tier === 'structural'
        ? String.raw`\text{Tier: structural (no } q \text{ required).}`
        : String.raw`\text{Tier: numeric at each test } q \text{ (Sage kernel required).}`

  return (
    <div className="space-y-3 text-sm text-slate-700">
      <MathCell latex={check.description} displayMode />
      <MathCell latex={check.formulaLatex} displayMode />
      <MathCell latex={tierLatex} className="text-xs text-slate-500" />
    </div>
  )
}
