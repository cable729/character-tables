/**
 * Execute Sage unit tests via Jupyter (optional — skipped without JUPYTER_URL).
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { JupyterSageSession } from '../src/jupyter/client'
import { loadSageLibSource } from '../src/sage/sageLibModules'
import { parseJupyterUrl } from './lib/sage-bench'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const testBody = readFileSync(
  path.join(root, 'sage/tests/test_eval.sage'),
  'utf8',
)

async function main(): Promise<number> {
  const url =
    process.env.JUPYTER_URL ??
    process.argv[2] ??
    ''
  if (!url) {
    console.log('SKIP sage tests: set JUPYTER_URL or pass URL as argv[1]')
    return 0
  }

  const { baseUrl, token } = parseJupyterUrl(url)
  const code = loadSageLibSource() + '\n\n' + testBody
  const session = new JupyterSageSession()
  await session.connect({ baseUrl, token })
  const result = await session.execute(code, { timeoutMs: 180_000 })
  await session.disconnect()

  console.log(result.stdout)
  if (result.stderr) {
    console.error(result.stderr)
  }

  const summary = result.stdout
    .split('\n')
    .find((l) => l.startsWith('SAGE_TEST_SUMMARY'))
  const ok = summary?.includes('ok=True')
  return ok ? 0 : 1
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
