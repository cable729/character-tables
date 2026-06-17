import { JUPYTER_SERVER_CONFIG_SNIPPET } from './configSnippet'

/** Production GitHub Pages origin (no path). */
export const GITHUB_PAGES_ORIGIN = 'https://cable729.github.io'

/** Where this app is loaded in the browser (no trailing slash). */
export function getAppOrigin(): string {
  if (typeof window !== 'undefined') return window.location.origin
  return GITHUB_PAGES_ORIGIN
}

export function jupyterServerConfigSnippet(): string {
  return JUPYTER_SERVER_CONFIG_SNIPPET
}
