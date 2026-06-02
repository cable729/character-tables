import type { CheckResult, PerQResult } from './types'

const CHECK_LINE_RE =
  /CHECK id=(\S+) q=(\d+) ok=(True|False)(?: details_json=(.+))?/g

export function parseSageCheckAllOk(stdout: string): boolean | null {
  const match = /all_ok=(True|False)/.exec(stdout)
  if (!match) return null
  return match[1] === 'True'
}

export function parseSageCheckResults(stdout: string): Map<string, CheckResult> {
  const byCheck = new Map<string, PerQResult[]>()

  for (const match of stdout.matchAll(CHECK_LINE_RE)) {
    const id = match[1]
    const q = Number(match[2])
    const passes = match[3] === 'True'
    let details: unknown
    if (match[4]) {
      try {
        details = JSON.parse(match[4]) as unknown
      } catch {
        details = match[4]
      }
    }
    const row: PerQResult = { q, passes, details }
    const list = byCheck.get(id) ?? []
    list.push(row)
    byCheck.set(id, list)
  }

  const results = new Map<string, CheckResult>()
  for (const [id, perQ] of byCheck) {
    perQ.sort((a, b) => a.q - b.q)
    results.set(id, {
      passes: perQ.every((r) => r.passes),
      perQ,
    })
  }
  return results
}
