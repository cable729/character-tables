export const SAGE_RUN_DEBOUNCE_MS = 600
export const CONSOLE_STORAGE_KEY = 'sage-checks-console'
export const CONSOLE_MIN_HEIGHT = 160
export const CONSOLE_DEFAULT_HEIGHT = 320
export const CONSOLE_HEADER_HEIGHT = 48

export function maxConsoleHeight(): number {
  return Math.floor(window.innerHeight * 0.85)
}

export function clampConsoleHeight(height: number): number {
  return Math.min(maxConsoleHeight(), Math.max(CONSOLE_MIN_HEIGHT, height))
}
