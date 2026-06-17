/**
 * Time each Sage check at each q separately; write markdown report.
 * Usage: npm run benchmark:sage:by-q -- "http://localhost:8888/?token=…" [out.md]
 */
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { JupyterSageSession } from '../src/jupyter/client'
import { DEFAULT_CHECK_Q_VALUES, TABLE_CHECKS } from '../src/checks/registry'
import { resolveCheckBlocked } from '../src/checks/expansionReadiness'
import { ut4Example } from '../src/data/ut4Example'
import type { CharacterTable } from '../src/types/characterTable'
import {
  buildSingleCheckScript,
  formatMs,
  parseJupyterUrl,
} from './lib/sage-bench'

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const defaultOut = path.join(repoRoot, 'docs/sage-check-timing-ut4.md')
const ut4YamlPath = path.join(repoRoot, 'src/examples/ut4-fq.yaml')

export type TimingCell = {
  ms: number
  ok: boolean
  note: string
  blocked: boolean
}

function cellMarkdown(cell: TimingCell): string {
  if (cell.blocked) return 'blocked'
  const icon = cell.ok ? '✓' : '✗'
  return `${formatMs(cell.ms)} ${icon}`
}

export function renderMarkdownReport(opts: {
  tableYaml: string
  table: CharacterTable
  qValues: number[]
  kernelSpec: string | null
  warmupMs: number
  grid: Map<string, Map<number, TimingCell>>
  checkTitles: Map<string, string>
}): string {
  const { tableYaml, table, qValues, kernelSpec, warmupMs, grid, checkTitles } =
    opts
  const date = new Date().toISOString().slice(0, 10)

  const checkIds = TABLE_CHECKS.filter((c) => c.buildSageCode).map((c) => c.id)
  const header = `| Check | ${qValues.map((q) => `q=${q}`).join(' | ')} |`
  const sep = `| --- | ${qValues.map(() => '---').join(' | ')} |`

  const bodyRows = checkIds.map((id) => {
    const title = checkTitles.get(id) ?? id
    const byQ = grid.get(id)
    const cells = qValues.map((q) => {
      const cell = byQ?.get(q)
      return cell ? cellMarkdown(cell) : '—'
    })
    return `| **${id}** — ${title} | ${cells.join(' | ')} |`
  })

  const totalsByQ = qValues.map((q) => {
    let sum = 0
    for (const id of checkIds) {
      const cell = grid.get(id)?.get(q)
      if (cell && !cell.blocked && cell.ms > 0) sum += cell.ms
    }
    return formatMs(sum)
  })

  return `# Sage check timing — UT₄ example

Benchmark run: ${date}. Each cell is one isolated Jupyter execute (warm kernel after library load).

## Table under test

- **Group:** ${table.group ?? '(none)'}
- **Order:** ${table.groupOrder ?? '(none)'}
- **Condensed size:** ${table.n}×${table.n} (${table.rows.length} rows × ${table.columns.length} columns)
- **Source:** \`src/examples/ut4-fq.yaml\`

\`\`\`yaml
${tableYaml.trimEnd()}
\`\`\`

## Setup

- **q values:** ${qValues.join(', ')} (each check run with a single \`[q]\` list)
- **Kernel:** ${kernelSpec ?? 'unknown'}
- **Warm-up** (load \`character_tables.sage\` + TABLE): ${formatMs(warmupMs)}

## Timing by check and q

${header}
${sep}
${bodyRows.join('\n')}
| **Sequential total** | ${totalsByQ.join(' | ')} |

Legend: time + ✓ (pass) or ✗ (fail). \`blocked\` = check not runnable for this table/q.

## Takeaways

| Tier | Checks | q=2 | q=3 | q=5 |
| --- | --- | --- | --- | --- |
| Always fast | \`conjugacy\`, \`expanded-count-balance\`, \`theta-sum\`, \`degree-sum\` | &lt;100ms each | &lt;100ms each | &lt;100ms each |
| Moderate | \`trivial-orthogonality\`, \`arc-patterns\`, \`norm-identity\`, \`duplicate-irrep\` | ~100ms | ~100–200ms | 1–4s |
| Expensive | \`row-orthogonality\`, \`column-orthogonality\` | ~100ms | ~1s | **~4–5 min each** |

- **q=2 and q=3** are fine for interactive full checks (sequential total ~1s and ~3s).
- **q=5** is dominated by orthogonality (~9 min for row+column alone); avoid unless you need that spot-check.
- **Quick mode** (app default): the fast tier at \`min(q)\` only — ~100ms combined, all pass on this table.
- Running all three q in **one** execute per check (not measured here) made orthogonality ~4 min each because expansion work is shared across q; per-q isolation above shows where cost actually lands.

## Notes

- Times are one isolated Jupyter execute per cell (warm kernel after library load).
- The app bundles checks in one run and reuses \`_EXPANDED_CACHE\`, so combined full mode is usually faster than the column totals above.
- Several expanded-character checks fail on this table at some q; timing is independent of pass/fail.
`
}

async function runBenchmark(
  session: JupyterSageSession,
  table: CharacterTable,
  qValues: number[],
): Promise<Map<string, Map<number, TimingCell>>> {
  const grid = new Map<string, Map<number, TimingCell>>()

  for (const q of qValues) {
    for (const check of TABLE_CHECKS) {
      if (!check.buildSageCode) continue

      const blocked = resolveCheckBlocked(check.id, table, [q])
      if (!grid.has(check.id)) grid.set(check.id, new Map())

      if (blocked.blocked) {
        grid.get(check.id)!.set(q, {
          ms: 0,
          ok: false,
          note: blocked.reason ?? 'blocked',
          blocked: true,
        })
        continue
      }

      const fragment = check.buildSageCode(table, [q])
      if (!fragment) continue

      const code = buildSingleCheckScript(table, fragment)
      process.stdout.write(`  ${check.id} @ q=${q}… `)

      const start = Date.now()
      const result = await session.execute(code, { timeoutMs: 20 * 60 * 1000 })
      const ms = Date.now() - start

      const ok = result.success && /all_ok=True/.test(result.stdout)
      const note = result.success
        ? ok
          ? 'pass'
          : 'fail'
        : (result.error ?? result.stderr).split('\n')[0]?.slice(0, 120) ?? 'error'

      grid.get(check.id)!.set(q, { ms, ok, note, blocked: false })
      console.log(`${formatMs(ms)} ${ok ? '✓' : '✗'}`)
    }
  }

  return grid
}

async function main(): Promise<void> {
  const jupyterUrl = process.argv[2] ?? process.env.JUPYTER_URL
  const outPath = process.argv[3] ?? defaultOut

  if (!jupyterUrl) {
    console.error(
      'Usage: npm run benchmark:sage:by-q -- "<jupyter-url>" [out.md]',
    )
    process.exit(1)
  }

  const { baseUrl, token } = parseJupyterUrl(jupyterUrl)
  const table = ut4Example
  const qValues = [...DEFAULT_CHECK_Q_VALUES]
  const tableYaml = readFileSync(ut4YamlPath, 'utf8')

  const checkTitles = new Map(
    TABLE_CHECKS.filter((c) => c.buildSageCode).map((c) => [c.id, c.title]),
  )

  const session = new JupyterSageSession()
  console.log('Connecting…')
  await session.connect({ baseUrl, token })
  console.log(`Kernel: ${session.kernelSpecName}`)

  const warmupStart = Date.now()
  const warmup = await session.execute(
    buildSingleCheckScript(table, '_check_ok = True'),
    { timeoutMs: 120_000 },
  )
  const warmupMs = Date.now() - warmupStart
  if (!warmup.success) {
    console.error('Warm-up failed:', warmup.error)
    await session.disconnect()
    process.exit(1)
  }
  console.log(`Warm-up: ${formatMs(warmupMs)}\n`)

  console.log('Per-check, per-q runs:')
  const grid = await runBenchmark(session, table, qValues)
  const kernelSpec = session.kernelSpecName
  await session.disconnect()

  const md = renderMarkdownReport({
    tableYaml,
    table,
    qValues,
    kernelSpec,
    warmupMs,
    grid,
    checkTitles,
  })

  writeFileSync(outPath, md, 'utf8')
  console.log(`\nWrote ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
