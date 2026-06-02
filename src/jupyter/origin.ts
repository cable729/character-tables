import { JUPYTER_SERVER_CONFIG_SNIPPET } from './configSnippet'

/** Production GitHub Pages origin (no path). */
export const GITHUB_PAGES_ORIGIN = 'https://cable729.github.io'

/** Where this app is loaded in the browser (no trailing slash). */
export function getAppOrigin(): string {
  if (typeof window !== 'undefined') return window.location.origin
  return GITHUB_PAGES_ORIGIN
}

export function jupyterOriginsToAllow(): string[] {
  const origins = new Set<string>([GITHUB_PAGES_ORIGIN, getAppOrigin()])
  if (import.meta.env.DEV) {
    for (const port of [5173, 5174, 4173]) {
      origins.add(`http://localhost:${port}`)
      origins.add(`http://127.0.0.1:${port}`)
    }
  }
  return [...origins].sort()
}

export function jupyterServerConfigSnippet(): string {
  return JUPYTER_SERVER_CONFIG_SNIPPET
}
