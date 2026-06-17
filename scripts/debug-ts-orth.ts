/**
 * TS-only orthogonality check (no Sage) for post-fix verification.
 */
import { appendFileSync } from 'node:fs'
import { ut3Example } from '../src/data/ut3Example'
import { ut4Example } from '../src/data/ut4Example'
import { iterateExpandedPairs } from '../src/expansion/iterateExpandedPairs'
import { evalCellAtQ, makeAdditiveTheta, complexConj, complexMul } from '../src/expansion/evalCell'
import { evalQPolynomial } from '../src/expansion/evalClassSize'

const LOG = '/Users/calebjares/git/character-tables/.cursor/debug-1e06d1.log'

function log(message: string, data: Record<string, unknown>): void {
  appendFileSync(
    LOG,
    JSON.stringify({
      sessionId: '1e06d1',
      hypothesisId: 'H5',
      location: 'debug-ts-orth.ts',
      message,
      data,
      timestamp: Date.now(),
      runId: 'post-fix-ts',
    }) + '\n',
  )
}

function tsOrthogonality(name: string, table: typeof ut3Example, q: number) {
  const theta = makeAdditiveTheta(q)
  const pairs = iterateExpandedPairs(table, q)
  const G = evalQPolynomial(table.groupOrder ?? '1', q)
  const rowKeys = new Map<string, number[]>()
  for (const p of pairs) {
    const rk = `${p.rowIndex}:${p.rowSliceIndex}`
    if (!rowKeys.has(rk)) rowKeys.set(rk, [])
    const v = evalCellAtQ(p.cellLatex, p.rowAssignment, p.colAssignment, q, theta)
    rowKeys.get(rk)!.push(v.re) // simplified - use full complex in real check
  }
  // proper weighted dot
  const rows: { key: string; vals: ReturnType<typeof evalCellAtQ>[] }[] = []
  const seen = new Set<string>()
  for (const p of pairs) {
    const rk = `${p.rowIndex}:${p.rowSliceIndex}`
    if (seen.has(rk)) continue
    seen.add(rk)
    const vals = pairs
      .filter((x) => x.rowIndex === p.rowIndex && x.rowSliceIndex === p.rowSliceIndex)
      .map((x) => evalCellAtQ(x.cellLatex, x.rowAssignment, x.colAssignment, q, theta))
    rows.push({ key: rk, vals })
  }
  const weights = pairs
    .filter((p, i, arr) => arr.findIndex((x) => x.colIndex === p.colIndex && x.colSliceIndex === p.colSliceIndex) === i)
    .map((p) => p.classWeight)
  const bad: { a: string; b: string; ipRe: number; ipIm: number }[] = []
  for (let i = 0; i < rows.length; i++) {
    for (let j = 0; j < rows.length; j++) {
      let ipRe = 0
      let ipIm = 0
      for (let k = 0; k < weights.length; k++) {
        const prod = complexMul(rows[i].vals[k], complexConj(rows[j].vals[k]))
        ipRe += weights[k] * prod.re
        ipIm += weights[k] * prod.im
      }
      const expected = i === j ? G : 0
      if (Math.abs(ipRe - expected) > 1e-6 || Math.abs(ipIm) > 1e-6) {
        if (bad.length < 10) bad.push({ a: rows[i].key, b: rows[j].key, ipRe, ipIm })
      }
    }
  }
  log(`${name} q=${q} TS orthogonality post-fix`, { badCount: bad.length, bad, G })
  console.log(name, 'q=' + q, 'bad:', bad.length)
}

for (const q of [2, 3]) {
  tsOrthogonality('UT3', ut3Example, q)
  tsOrthogonality('UT4', ut4Example, q)
}
