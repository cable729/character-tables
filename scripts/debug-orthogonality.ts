/**
 * Compare TS vs Sage expanded cell values and orthogonality bad pairs.
 * Writes NDJSON to .cursor/debug-1e06d1.log
 */
import { appendFileSync } from 'node:fs'
import { JupyterSageSession } from '../src/jupyter/client'
import { buildCombinedSageBody, sagePreamble } from '../src/sage/codegen'
import { ut3Example } from '../src/data/ut3Example'
import { ut4Example } from '../src/data/ut4Example'
import type { CharacterTable } from '../src/types/characterTable'
import { iterateExpandedPairs } from '../src/expansion/iterateExpandedPairs'
import {
  complexAdd,
  complexConj,
  complexMul,
  complexEq,
  evalCellAtQ,
  makeAdditiveTheta,
} from '../src/expansion/evalCell'
import { evalQPolynomial } from '../src/expansion/evalClassSize'
import { parseJupyterUrl } from './lib/sage-bench'

const LOG = '/Users/calebjares/git/character-tables/.cursor/debug-1e06d1.log'

function log(
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown>,
): void {
  const line = JSON.stringify({
    sessionId: '1e06d1',
    hypothesisId,
    location,
    message,
    data,
    timestamp: Date.now(),
    runId: 'debug-orth',
  })
  appendFileSync(LOG, line + '\n')
}

function tsRowOrthogonality(table: CharacterTable, q: number) {
  const theta = makeAdditiveTheta(q)
  const pairs = iterateExpandedPairs(table, q)
  const G = evalQPolynomial(table.groupOrder ?? '1', q)

  const rowKeys = new Map<string, number>()
  const rows: { key: string; values: { re: number; im: number }[]; weights: number[] }[] = []

  for (const p of pairs) {
    const key = `${p.rowIndex}:${p.rowSliceIndex}`
    let row = rows.find((r) => r.key === key)
    if (!row) {
      row = { key, values: [], weights: [] }
      rows.push(row)
      rowKeys.set(key, rows.length - 1)
    }
    row.values.push(evalCellAtQ(p.cellLatex, p.rowAssignment, p.colAssignment, q, theta))
    row.weights.push(p.classWeight)
  }

  const bad: { a: string; b: string; ipRe: number; ipIm: number; expected: number }[] = []
  for (let i = 0; i < rows.length; i++) {
    for (let k = 0; k < rows.length; k++) {
      let ip = { re: 0, im: 0 }
      for (let j = 0; j < rows[i].values.length; j++) {
        const w = rows[i].weights[j]
        const prod = complexMul(rows[i].values[j], complexConj(rows[k].values[j]))
        ip = complexAdd(ip, { re: w * prod.re, im: w * prod.im })
      }
      const expected = i === k ? G : 0
      const ok = expected === 0 ? complexEq(ip, { re: 0, im: 0 }) : complexEq(ip, { re: expected, im: 0 })
      if (!ok && bad.length < 8) {
        bad.push({ a: rows[i].key, b: rows[k].key, ipRe: ip.re, ipIm: ip.im, expected })
      }
    }
  }
  return { G, rowCount: rows.length, colCount: rows[0]?.values.length ?? 0, bad }
}

async function sageBadPairs(table: CharacterTable, q: number): Promise<unknown> {
  const frag = `# --- row-orth ---
_check_ok = run_row_orthogonality_check(TABLE, "row-orthogonality", [${q}])`
  const code =
    sagePreamble(table) +
    '\n' +
    buildCombinedSageBody([frag]) +
    '\nexp = get_expanded_table(TABLE, ' +
    q +
    ')\nprint("DEBUG_ROW_COUNT", len(exp["flatRows"]), len(exp["flatColWeights"]))\n'
  const jupyterUrl =
    process.argv[2] ??
    'http://localhost:8888/tree?token=b943873595b03cc26649c4027ca65fbe77a2b9baeb267a67'
  const { baseUrl, token } = parseJupyterUrl(jupyterUrl)
  const session = new JupyterSageSession()
  await session.connect({ baseUrl, token })
  const result = await session.execute(code, { timeoutMs: 120_000 })
  await session.disconnect()
  const checkLine = result.stdout.split('\n').find((l) => l.includes('CHECK id=row-orthogonality'))
  const rowCountLine = result.stdout.split('\n').find((l) => l.startsWith('DEBUG_ROW_COUNT'))
  let badPairs: unknown = null
  if (checkLine) {
    const m = /details_json=(.+)$/.exec(checkLine)
    if (m) {
      badPairs = JSON.parse(m[1]).badPairs
    }
  }
  return { success: result.success, badPairs, rowCountLine, error: result.error }
}

async function main(): Promise<void> {
  for (const [name, table] of [
    ['UT3', ut3Example],
    ['UT4', ut4Example],
  ] as const) {
    for (const q of [2, 3]) {
      const ts = tsRowOrthogonality(table, q)
      log('H2', 'debug-orthogonality.ts:ts', `${name} q=${q} TS orthogonality`, ts)

      const sage = await sageBadPairs(table, q)
      log('H1', 'debug-orthogonality.ts:sage', `${name} q=${q} Sage orthogonality`, {
        sage,
        tsBadCount: ts.bad.length,
        tsFirstBad: ts.bad[0] ?? null,
      })

      // Sample first failing pair cell comparison
      if (ts.bad[0]) {
        const [ri, rsi] = ts.bad[0].a.split(':').map(Number)
        const pairs = iterateExpandedPairs(table, q).filter(
          (p) => p.rowIndex === ri && p.rowSliceIndex === rsi,
        )
        const sample = pairs.slice(0, 3).map((p) => ({
          col: `${p.colIndex}:${p.colSliceIndex}`,
          latex: p.cellLatex,
          rowAssign: p.rowAssignment,
          colAssign: p.colAssignment,
          tsVal: evalCellAtQ(p.cellLatex, p.rowAssignment, p.colAssignment, q, makeAdditiveTheta(q)),
        }))
        log('H3', 'debug-orthogonality.ts:sample', `${name} q=${q} sample cells row ${ts.bad[0].a}`, {
          sample,
        })
      }
    }
  }
}

main().catch((e) => {
  log('ERR', 'debug-orthogonality.ts', 'fatal', { error: String(e) })
  console.error(e)
  process.exit(1)
})
