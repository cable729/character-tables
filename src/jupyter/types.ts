export type JupyterConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'auth_failed'
  | 'server_unreachable'
  | 'kernel_missing'
  | 'error'

export interface JupyterServerConfig {
  baseUrl: string
  token: string
}

export interface SageExecuteResult {
  stdout: string
  stderr: string
  error: string | null
  success: boolean
  cancelled?: boolean
}

export const JUPYTER_STORAGE_KEY = 'character-tables-jupyter-connection'

export const DEFAULT_JUPYTER_CANDIDATES = [
  'http://127.0.0.1:8888/',
  'http://localhost:8888/',
] as const
