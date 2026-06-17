/**
 * Run verifier Sage checks on shipped examples at q=2,3.
 * Usage: npx vite-node scripts/verify-sage-examples.ts "http://localhost:8888/?token=…"
 */
import { JupyterSageSession } from '../src/jupyter/client'
import {
  buildCombinedSageCode,
  parseSageCheckResults,
  type SageCheckScope,
} from '../src/checks/registry'
import { ut3Example } from '../src/data/ut3Example'
import { ut4Example } from '../src/data/ut4Example'
import { ut3SupercharacterFullExample } from '../src/data/ut3SupercharacterExample'
import type { CharacterTable } from '../src/types/characterTable'
import { parseJupyterUrl } from './lib/sage-bench'

async function main(): Promise<void> {
  const jupyterUrl =
    process.argv[2] ??
    process.env.JUPYTER_URL ??
    'http://localhost:8888/tree?token=b943873595b03cc26649c4027ca65fbe77a2b9baeb267a67'
  const { baseUrl, token } = parseJupyterUrl(jupyterUrl)

  const session = new JupyterSageSession()
  await session.connect({ baseUrl, token })

  const cases: { name: string; table: CharacterTable; scope: SageCheckScope }[] =
    [
      { name: 'UT3 character', table: ut3Example, scope: 'verifier' },
      { name: 'UT4 character', table: ut4Example, scope: 'verifier' },
      {
        name: 'UT3 supercharacter',
        table: ut3SupercharacterFullExample,
        scope: 'verifier',
      },
    ]

  let failed = false
  for (const { name, table, scope } of cases) {
    for (const q of [2, 3]) {
      const code = buildCombinedSageCode(table, { selectedQ: [q], scope })
      const result = await session.execute(code, { timeoutMs: 300_000 })
      if (!result.success) {
        failed = true
        console.error(
          `${name} q=${q}: ERROR`,
          result.error ?? result.stderr,
        )
        continue
      }
      const parsed = parseSageCheckResults(result.stdout)
      const lines = [...parsed.entries()].map(
        ([id, r]) => `${id}=${r.passes ? 'pass' : 'FAIL'}`,
      )
      const anyFail = [...parsed.values()].some((r) => !r.passes)
      if (anyFail) failed = true
      console.log(`${name} q=${q}: ${lines.join(', ')}`)
    }
  }

  await session.disconnect()
  if (failed) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
