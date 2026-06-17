import type { CharacterTable } from '../types/characterTable'
import { effectiveQValues } from '../checks/expansionReadiness'
import { loadSageLibSource, sageLibRevision } from './sageLibModules'

export type SageTablePayload = {
  title?: string
  group?: string
  groupOrder?: string
  n?: number
  columns: CharacterTable['columns']
  rows: CharacterTable['rows']
  matrix: string[][]
}

export function serializeTableForSage(table: CharacterTable): SageTablePayload {
  return {
    title: table.title,
    group: table.group,
    groupOrder: table.groupOrder,
    n: table.n,
    columns: table.columns,
    rows: table.rows,
    matrix: table.matrix,
  }
}

export function renderSageTemplate(
  template: string,
  vars: Record<string, string>,
): string {
  let out = template
  for (const [key, value] of Object.entries(vars)) {
    out = out.replaceAll(`{{${key}}}`, value)
  }
  return out
}

export function sagePreamble(table: CharacterTable): string {
  const payload = JSON.stringify(serializeTableForSage(table))
  const lib = loadSageLibSource()
  const rev = sageLibRevision()
  return `# character-tables ${rev}
try:
    _EXPANDED_CACHE.clear()
except NameError:
    pass

${lib}

import json
TABLE = json.loads(${JSON.stringify(payload)})
_EXPANDED_CACHE = {}
print("SAGE_PROGRESS lib=${rev} loaded", flush=True)
`
}

export { sageLibRevision }

export function sageQValuesLiteral(qValues: readonly number[]): string {
  const list = effectiveQValues(qValues)
  return `[${list.join(', ')}]`
}

export function wrapCheckFragment(checkId: string, body: string): string {
  return `# --- ${checkId} ---
print("SAGE_PROGRESS check=${checkId} start", flush=True)
_check_ok = True
${body.replace(/\ball_ok\b/g, '_check_ok')}
print("SAGE_PROGRESS check=${checkId} done ok=%s" % _check_ok, flush=True)
overall_ok = overall_ok and _check_ok
`
}

export function buildCheckCall(
  checkId: string,
  runner: string,
  qValues: readonly number[],
): string {
  const qLit = sageQValuesLiteral(qValues)
  return wrapCheckFragment(
    checkId,
    `_check_ok = ${runner}(TABLE, "${checkId}", ${qLit})`,
  )
}

export function buildThetaSumFragment(qValues: readonly number[]): string {
  const qLit = sageQValuesLiteral(qValues)
  return wrapCheckFragment(
    'theta-sum',
    `_check_ok = run_theta_sum_check("theta-sum", ${qLit})`,
  )
}

export function sageTableSignature(table: CharacterTable): string {
  return JSON.stringify(serializeTableForSage(table))
}

export function buildCombinedSageBody(
  fragments: string[],
): string {
  const parts = ['overall_ok = True', ...fragments]
  parts.push('print(f"all_ok={overall_ok}")')
  return parts.join('\n\n')
}

export function buildFullSageScript(
  table: CharacterTable,
  fragments: string[],
): string {
  return sagePreamble(table) + '\n' + buildCombinedSageBody(fragments)
}
