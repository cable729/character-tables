/**
 * Run UT2 row orthogonality in Sage and compare bad pair count with TS.
 */
import { parseTableYaml } from '../src/schema/yamlTable'
import ut2Yaml from '../src/examples/ut2-ut1-fq.yaml?raw'
import { rowOrthogonalityAtQ } from '../src/expansion/rowOrthogonality'
import { JupyterSageSession } from '../src/jupyter/client'
import { buildCombinedSageBody, sagePreamble } from '../src/sage/codegen'
import { parseJupyterUrl } from './lib/sage-bench'

async function main(): Promise<void> {
  const table = parseTableYaml(ut2Yaml)
  for (const q of [2, 3] as const) {
    const ts = rowOrthogonalityAtQ(table, q, 5)
    console.log(`TS q=${q} bad=${ts.bad.length}`, ts.bad.slice(0, 3))

    const frag = `# --- row-orth ---
_check_ok = run_row_orthogonality_check(TABLE, "row-orthogonality", [${q}])`
    const code =
      sagePreamble(table) + '\n' + buildCombinedSageBody([frag]) + '\n'
    const jupyterUrl =
      process.env.JUPYTER_URL ?? 'http://localhost:8888/?token=0afbf1a9f014006c81492dd7433f3c887e9f6424089c4251'
    const { baseUrl, token } = parseJupyterUrl(jupyterUrl)
    const session = new JupyterSageSession()
    await session.connect({ baseUrl, token })
    const result = await session.execute(code, { timeoutMs: 120_000 })
    await session.disconnect()
    const checkLine = result.stdout.split('\n').find((l) => l.includes('CHECK id=row-orthogonality'))
    console.log('Sage stdout tail:', result.stdout.split('\n').slice(-5).join('\n'))
    if (checkLine) {
      const m = /details_json=(.+)$/.exec(checkLine)
      if (m) {
        const details = JSON.parse(m[1]) as { badPairs?: unknown[]; ok?: boolean }
        console.log(`Sage q=${q} ok=${details.ok} bad=${details.badPairs?.length ?? '?'}`, details.badPairs?.slice(0, 3))
      }
    } else {
      console.log('Sage error:', result.error, result.stderr?.slice(0, 500))
    }
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
