/**
 * One-off: connect to local Jupyter Sage and time each check separately.
 * Usage: npx vite-node scripts/benchmark-sage-checks.ts [jupyter-url-with-token]
 */
import { JupyterSageSession } from '../src/jupyter/client'
import { DEFAULT_CHECK_Q_VALUES, TABLE_CHECKS } from '../src/checks/registry'
import { resolveCheckBlocked } from '../src/checks/expansionReadiness'
import { buildCombinedSageBody, sagePreamble } from '../src/sage/codegen'
import { ut4Example } from '../src/data/ut4Example'
import type { CharacterTable } from '../src/types/characterTable'

function parseJupyterUrl(raw: string): { baseUrl: string; token: string } {
  const url = new URL(raw)
  const token = url.searchParams.get('token') ?? ''
  url.search = ''
  url.hash = ''
  const baseUrl = url.toString().endsWith('/')
    ? url.toString()
    : `${url.toString()}/`
  return { baseUrl, token }
}

function buildSingleCheckScript(
  table: CharacterTable,
  checkId: string,
  fragment: string,
): string {
  return sagePreamble(table) + '\n' + buildCombinedSageBody([fragment])
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60_000).toFixed(1)}m`
}

async function main(): Promise<void> {
  const jupyterUrl = process.argv[2] ?? process.env.JUPYTER_URL
  if (!jupyterUrl) {
    console.error(
      'Usage: npx vite-node scripts/benchmark-sage-checks.ts "http://localhost:8888/?token=…"',
    )
    console.error('Get URL from: jupyter server list')
    process.exit(1)
  }

  const { baseUrl, token } = parseJupyterUrl(jupyterUrl)
  if (!token) {
    console.error('Missing ?token= in Jupyter URL. Run: jupyter server list')
    process.exit(1)
  }

  const table = ut4Example
  const qValues = [...DEFAULT_CHECK_Q_VALUES]

  console.log('Table:', table.title ?? table.group ?? '(untitled)')
  console.log('q values:', qValues.join(', '))
  console.log('Jupyter:', baseUrl)
  console.log('')

  const session = new JupyterSageSession()
  console.log('Connecting to Sage kernel…')
  const tConnect = Date.now()
  await session.connect({ baseUrl, token })
  console.log(`Connected (${formatMs(Date.now() - tConnect)}, spec: ${session.kernelSpecName})`)
  console.log('')

  // Warm up: load character_tables.sage once
  console.log('Warm-up (load library + TABLE)…')
  const warmupStart = Date.now()
  const warmup = await session.execute(
    buildSingleCheckScript(
      table,
      'warmup',
      '_check_ok = True\nprint("warmup ok")',
    ),
    { timeoutMs: 120_000 },
  )
  if (!warmup.success) {
    console.error('Warm-up failed:', warmup.error ?? warmup.stderr)
    await session.disconnect()
    process.exit(1)
  }
  console.log(`Warm-up done (${formatMs(Date.now() - warmupStart)})`)
  console.log('')

  type Row = { id: string; title: string; ms: number; ok: boolean; note: string }
  const rows: Row[] = []

  for (const check of TABLE_CHECKS) {
    if (!check.buildSageCode) continue

    const blocked = resolveCheckBlocked(check.id, table, qValues)
    if (blocked.blocked) {
      rows.push({
        id: check.id,
        title: check.title,
        ms: 0,
        ok: false,
        note: `blocked: ${blocked.reason ?? 'unknown'}`,
      })
      continue
    }

    const fragment = check.buildSageCode(table, qValues)
    if (!fragment) continue

    const code = buildSingleCheckScript(table, check.id, fragment)
    process.stdout.write(`Running ${check.id}… `)

    const start = Date.now()
    const result = await session.execute(code, { timeoutMs: 20 * 60 * 1000 })
    const ms = Date.now() - start

    const ok = result.success && /all_ok=True/.test(result.stdout)
    const note = result.success
      ? ok
        ? 'pass'
        : 'fail (check returned false)'
      : (result.error ?? result.stderr).split('\n')[0]?.slice(0, 80) ?? 'error'

    rows.push({ id: check.id, title: check.title, ms, ok, note })
    console.log(`${formatMs(ms)} — ${note}`)
  }

  await session.disconnect()

  console.log('')
  console.log('=== Summary (UT₄ table, q = 2, 3, 5) ===')
  console.log('')
  const sorted = [...rows].sort((a, b) => b.ms - a.ms)
  const maxId = Math.max(...sorted.map((r) => r.id.length))
  for (const r of sorted) {
    const time = r.ms > 0 ? formatMs(r.ms).padStart(7) : '      —'
    console.log(
      `${time}  ${r.id.padEnd(maxId)}  ${r.ok ? '✓' : '·'}  ${r.note}`,
    )
  }

  const ran = sorted.filter((r) => r.ms > 0)
  const total = ran.reduce((s, r) => s + r.ms, 0)
  console.log('')
  console.log(
    `Total (sequential): ${formatMs(total)} across ${ran.length} checks`,
  )
  console.log(
    `Combined (app runs one execute): would be ~${formatMs(total)} if checks do not share expanded cache between runs`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
