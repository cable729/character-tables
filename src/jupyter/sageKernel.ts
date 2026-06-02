import { KernelSpecManager } from '@jupyterlab/services'
import type { ServerConnection } from '@jupyterlab/services'

/** Pick a local kernelspec that looks like SageMath. */
export async function findSageKernelSpecName(
  serverSettings: ServerConnection.ISettings,
): Promise<string | null> {
  const specManager = new KernelSpecManager({ serverSettings })
  await specManager.ready
  await specManager.refreshSpecs()

  const specs = specManager.specs?.kernelspecs
  if (!specs) return null

  const entries = Object.entries(specs)
  const match = entries.find(([name, model]) => {
    if (!model) return /sage/i.test(name)
    const spec = model.spec
    const display =
      spec && typeof spec === 'object' && 'display_name' in spec
        ? String((spec as { display_name?: string }).display_name ?? '')
        : ''
    return /sage/i.test(name) || /sage/i.test(display)
  })

  return match?.[0] ?? null
}
