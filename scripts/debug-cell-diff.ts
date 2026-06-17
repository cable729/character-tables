/**
 * Cell-by-cell TS vs Sage comparison for orthogonality failures.
 */
import { appendFileSync } from 'node:fs'
import { JupyterSageSession } from '../src/jupyter/client'
import { sagePreamble } from '../src/sage/codegen'
import { ut3Example } from '../src/data/ut3Example'
import { ut4Example } from '../src/data/ut4Example'
import { iterateExpandedPairs } from '../src/expansion/iterateExpandedPairs'
import { evalCellAtQ, makeAdditiveTheta } from '../src/expansion/evalCell'
import { parseJupyterUrl } from './lib/sage-bench'

const LOG = '/Users/calebjares/git/character-tables/.cursor/debug-1e06d1.log'

function log(hypothesisId: string, message: string, data: Record<string, unknown>): void {
  appendFileSync(
    LOG,
    JSON.stringify({
      sessionId: '1e06d1',
      hypothesisId,
      location: 'debug-cell-diff.ts',
      message,
      data,
      timestamp: Date.now(),
      runId: 'cell-diff',
    }) + '\n',
  )
}

async function sageRowValues(table: unknown, q: number, rowKey: string): Promise<string[]> {
  const code =
    sagePreamble(table as never) +
    `
exp = build_expanded_table(TABLE, ${q})
idx = None
for i, fr in enumerate(exp["flatRows"]):
    if fr["key"] == "${rowKey}":
        idx = i
        break
if idx is None:
    print("SAGE_CELL_ERR missing row")
else:
    vals = exp["rowValues"][idx]
    print("SAGE_CELLS", json.dumps([str(v) for v in vals]))
`
  const url =
    process.argv[2] ??
    'http://localhost:8888/tree?token=b943873595b03cc26649c4027ca65fbe77a2b9baeb267a67'
  const { baseUrl, token } = parseJupyterUrl(url)
  const session = new JupyterSageSession()
  await session.connect({ baseUrl, token })
  const result = await session.execute(code, { timeoutMs: 120_000 })
  await session.disconnect()
  const line = result.stdout.split('\n').find((l) => l.startsWith('SAGE_CELLS'))
  if (!line) return []
  return JSON.parse(line.replace('SAGE_CELLS ', '')) as string[]
}

async function compare(name: string, table: typeof ut3Example, q: number, rowKey: string) {
  const [ri, rsi] = rowKey.split(':').map(Number)
  const theta = makeAdditiveTheta(q)
  const pairs = iterateExpandedPairs(table, q).filter(
    (p) => p.rowIndex === ri && p.rowSliceIndex === rsi,
  )
  const tsVals = pairs.map((p) => {
    const v = evalCellAtQ(p.cellLatex, p.rowAssignment, p.colAssignment, q, theta)
    return `${v.re}${v.im !== 0 ? `+${v.im}i` : ''}`
  })
  const sageVals = await sageRowValues(table, q, rowKey)
  const mismatches = pairs
    .map((p, i) => ({
      col: `${p.colIndex}:${p.colSliceIndex}`,
      latex: p.cellLatex,
      rowAssign: p.rowAssignment,
      colAssign: p.colAssignment,
      ts: tsVals[i],
      sage: sageVals[i] ?? '?',
    }))
    .filter((m) => m.ts !== m.sage && m.sage !== '?')
  log('H4', `${name} q=${q} row ${rowKey} cell diff`, {
    mismatchCount: mismatches.length,
    mismatches: mismatches.slice(0, 12),
    tsVals,
    sageVals,
  })
}

async function main() {
  await compare('UT3', ut3Example, 3, '1:0')
  await compare('UT3', ut3Example, 3, '1:1')
  await compare('UT4', ut4Example, 2, '1:0')
}

main().catch((e) => {
  log('ERR', 'fatal', { error: String(e) })
  process.exit(1)
})
