import { useJupyterStore } from '../store/jupyterStore'
import type { SageExecuteResult } from './types'

/** Run Sage code via the connected local kernel, or return a clear error. */
export async function requireSageExecute(
  code: string,
): Promise<SageExecuteResult> {
  return useJupyterStore.getState().executeSage(code)
}

export function isSageConnected(): boolean {
  return useJupyterStore.getState().status === 'connected'
}

export function sageConnectionMessage(): string {
  return useJupyterStore.getState().statusMessage
}
