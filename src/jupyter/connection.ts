import { ServerConnection } from '@jupyterlab/services'
import { getAppOrigin } from './origin'
import type { JupyterServerConfig } from './types'

/** Build settings the same way JupyterLab does (token header + optional query token). */
export function makeServerSettings(
  config: JupyterServerConfig,
): ServerConnection.ISettings {
  return ServerConnection.makeSettings({
    baseUrl: config.baseUrl,
    token: config.token,
    appendToken: true,
  })
}

export type JupyterProbeResult =
  | { ok: true }
  | { ok: false; reason: 'auth_required'; status: number }
  | { ok: false; reason: 'not_found'; status: number }
  | { ok: false; reason: 'http_error'; status: number }
  | { ok: false; reason: 'cors_blocked'; detail: string }
  | { ok: false; reason: 'network_error'; detail: string }

/**
 * Probe using Jupyter's request helper (Authorization: token …).
 * @see https://jupyter-server.readthedocs.io/en/latest/operators/security.html
 */
export async function probeJupyterServerDetailed(
  config: JupyterServerConfig,
): Promise<JupyterProbeResult> {
  if (!config.baseUrl) {
    return { ok: false, reason: 'network_error', detail: 'Empty server URL' }
  }

  if (!config.token) {
    return {
      ok: false,
      reason: 'auth_required',
      status: 401,
    }
  }

  const settings = makeServerSettings(config)
  const url = `${settings.baseUrl}api/status`

  try {
    const response = await ServerConnection.makeRequest(url, {}, settings)
    if (response.ok) return { ok: true }
    if (response.status === 401 || response.status === 403) {
      return { ok: false, reason: 'auth_required', status: response.status }
    }
    if (response.status === 404) {
      return {
        ok: false,
        reason: 'auth_required',
        status: 404,
      }
    }
    return { ok: false, reason: 'http_error', status: response.status }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    if (/cors|cross-origin|access-control-allow-origin/i.test(detail)) {
      return {
        ok: false,
        reason: 'cors_blocked',
        detail:
          `Browser blocked Jupyter's response. Ensure ~/.jupyter/jupyter_server_config.py exists ` +
          `(not .jupyter_server_config.py), restart Jupyter, and paste the full URL with ?token=…. ` +
          `App origin: ${getAppOrigin()}.`,
      }
    }
    if (
      /networkerror|failed to fetch|load failed|network request failed/i.test(
        detail,
      )
    ) {
      return {
        ok: false,
        reason: 'cors_blocked',
        detail:
          `Network error talking to Jupyter. If the server log shows "Blocking Cross Origin" with 404, ` +
          `the request likely had no token — paste the full URL from jupyter server list.`,
      }
    }
    return { ok: false, reason: 'network_error', detail }
  }
}

export async function probeJupyterServer(
  config: JupyterServerConfig,
): Promise<boolean> {
  const result = await probeJupyterServerDetailed(config)
  return result.ok
}
