import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { JupyterSageSession } from '../src/jupyter/client'
import { parseJupyterUrl } from './lib/sage-bench'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const sageCode = readFileSync(
  path.join(root, 'scripts/verify-ut2-classes.sage'),
  'utf8',
)

async function main(): Promise<void> {
  const url =
    process.env.JUPYTER_URL ??
    process.argv[2] ??
    ''
  if (!url) {
    console.log('SKIP: set JUPYTER_URL or pass URL as argv[1]')
    return
  }
  const { baseUrl, token } = parseJupyterUrl(url)
  const session = new JupyterSageSession()
  await session.connect({ baseUrl, token })
  const result = await session.execute(sageCode, { timeoutMs: 300_000 })
  await session.disconnect()
  console.log(result.stdout)
  if (result.stderr) {
    console.error('STDERR:', result.stderr)
  }
  if (!result.success) {
    console.error('ERROR:', result.error)
    process.exit(1)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
