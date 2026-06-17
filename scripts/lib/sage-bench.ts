import type { CharacterTable } from '../../src/types/characterTable'
import { buildCombinedSageBody, sagePreamble } from '../../src/sage/codegen'

export function parseJupyterUrl(raw: string): { baseUrl: string; token: string } {
  const url = new URL(raw)
  const token = url.searchParams.get('token') ?? ''
  const baseUrl = `${url.origin}/`
  return { baseUrl, token }
}

export function formatMs(ms: number): string {
  if (ms <= 0) return '—'
  if (ms < 1000) return `${Math.round(ms)}ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60_000).toFixed(1)}m`
}

export function buildSingleCheckScript(
  table: CharacterTable,
  fragment: string,
): string {
  return sagePreamble(table) + '\n' + buildCombinedSageBody([fragment])
}
