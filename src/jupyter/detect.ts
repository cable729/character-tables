import {
  type JupyterProbeResult,
} from './connection'
import { getAppOrigin } from './origin'
import {
  DEFAULT_JUPYTER_CANDIDATES,
  JUPYTER_STORAGE_KEY,
  type JupyterServerConfig,
} from './types'

function normalizeBaseUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ''
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`
}

/** Parse a pasted Jupyter Lab URL, server list line, or server base URL. */
export function parseJupyterConnectionInput(pasteUrl: string): JupyterServerConfig {
  const urlOrBase = pasteUrl
  const tokenField = ''
  const trimmed = urlOrBase.trim()
  const tokenFromField = tokenField.trim()

  if (!trimmed) {
    return { baseUrl: '', token: tokenFromField }
  }

  // Pasted only ?token=… from server list line — fill in default server URL.
  if (trimmed.startsWith('?')) {
    const params = new URLSearchParams(trimmed.replace(/^\?/, ''))
    const tokenFromQuery = params.get('token') ?? ''
    return {
      baseUrl: DEFAULT_JUPYTER_CANDIDATES[1],
      token: tokenFromField || tokenFromQuery,
    }
  }

  const urlMatch = trimmed.match(/https?:\/\/[^\s]+/)
  const urlPart = urlMatch?.[0] ?? trimmed

  try {
    const parsed = new URL(urlPart)
    const tokenFromQuery = parsed.searchParams.get('token') ?? ''
    return {
      baseUrl: `${parsed.origin}/`,
      token: tokenFromField || tokenFromQuery,
    }
  } catch {
    return {
      baseUrl: normalizeBaseUrl(trimmed),
      token: tokenFromField,
    }
  }
}

type StoredJupyterConfig = JupyterServerConfig & { pasteUrl?: string }

/** Rebuild a pasteable URL from stored server + token (best-effort). */
export function formatJupyterUrlForDisplay(
  config: JupyterServerConfig,
): string {
  if (!config.baseUrl) return ''
  if (!config.token) return config.baseUrl
  const base = config.baseUrl.replace(/\/$/, '')
  return `${base}/?token=${config.token}`
}

export function loadStoredJupyterPasteUrl(): string | null {
  try {
    const raw = localStorage.getItem(JUPYTER_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredJupyterConfig
    if (typeof parsed.pasteUrl === 'string' && parsed.pasteUrl.trim()) {
      return parsed.pasteUrl.trim()
    }
    if (typeof parsed.baseUrl === 'string') {
      return formatJupyterUrlForDisplay(parsed) || null
    }
    return null
  } catch {
    return null
  }
}

export function loadStoredJupyterConfig(): JupyterServerConfig | null {
  const pasteUrl = loadStoredJupyterPasteUrl()
  if (!pasteUrl) return null
  const config = parseJupyterConnectionInput(pasteUrl)
  return config.token ? config : null
}

export function saveJupyterConfig(
  config: JupyterServerConfig,
  pasteUrl: string,
): void {
  localStorage.setItem(
    JUPYTER_STORAGE_KEY,
    JSON.stringify({
      baseUrl: normalizeBaseUrl(config.baseUrl),
      token: config.token,
      pasteUrl: pasteUrl.trim(),
    }),
  )
}

export function probeFailureMessage(
  probe: Extract<JupyterProbeResult, { ok: false }>,
  config: JupyterServerConfig,
): { status: 'auth_failed' | 'server_unreachable'; message: string } {
  if (probe.reason === 'auth_required') {
    return {
      status: 'auth_failed',
      message:
        'Jupyter needs a token on every API call. Run `jupyter server list` and paste the full URL (http://localhost:8888/…?token=…). A /tree URL is fine.',
    }
  }

  if (probe.reason === 'cors_blocked') {
    return {
      status: 'server_unreachable',
      message: probe.detail,
    }
  }

  if (probe.reason === 'network_error') {
    return {
      status: 'server_unreachable',
      message: `Cannot reach Jupyter at ${config.baseUrl} (${probe.detail}). Is Sage/Jupyter running?`,
    }
  }

  if (!config.token) {
    return {
      status: 'auth_failed',
      message:
        'Paste the URL from `jupyter server list` (includes ?token=…). Same setup works on GitHub Pages once CORS is configured.',
    }
  }

  return {
    status: 'server_unreachable',
    message: `Jupyter returned HTTP ${probe.status ?? 'error'}. App origin: ${getAppOrigin()}.`,
  }
}

export { normalizeBaseUrl }
