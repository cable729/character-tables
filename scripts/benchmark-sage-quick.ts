/**
 * Time quick-mode Sage checks only (matches app default depth).
 */
import { JupyterSageSession } from '../src/jupyter/client'
import { buildCombinedSageCode } from '../src/checks/registry'
import { ut4Example } from '../src/data/ut4Example'

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

async function main(): Promise<void> {
  const jupyterUrl = process.argv[2] ?? process.env.JUPYTER_URL
  if (!jupyterUrl) {
    console.error('Pass Jupyter URL with token (jupyter server list)')
    process.exit(1)
  }
  const { baseUrl, token } = parseJupyterUrl(jupyterUrl)

  const session = new JupyterSageSession()
  await session.connect({ baseUrl, token })

  const code = buildCombinedSageCode(ut4Example, {
    selectedQ: [2],
    scope: 'quick',
  })
  const start = Date.now()
  const result = await session.execute(code, { timeoutMs: 120_000 })
  const ms = Date.now() - start
  await session.disconnect()

  console.log(`Quick mode (combined, q=2 only): ${ms}ms`)
  console.log('success:', result.success)
  console.log('stdout tail:', result.stdout.trim().split('\n').slice(-8).join('\n'))
  if (result.error) console.log('error:', result.error)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
