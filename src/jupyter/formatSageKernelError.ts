/** CSI SGR and related terminal escape sequences from IPython tracebacks. */
const ANSI_ESCAPE =
  /(?:\u001b|\u009b)[\][()#;?]*(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PRZcf-nqry=><]/g

export function stripAnsi(text: string): string {
  return text.replace(ANSI_ESCAPE, '')
}

export type JupyterErrorContent = {
  traceback?: string[]
  ename?: string
  evalue?: string
}

export function formatJupyterError(content: JupyterErrorContent): string | null {
  const lines = (content.traceback ?? [])
    .map((line) => stripAnsi(line).trimEnd())
    .filter((line) => line.length > 0)

  if (lines.length > 0) {
    return lines.join('\n')
  }

  const ename = content.ename?.trim()
  const evalue = content.evalue?.trim()
  if (ename && evalue) {
    return `${ename}: ${evalue}`
  }
  if (ename) {
    return ename
  }
  if (evalue) {
    return evalue
  }
  return null
}

export function formatSageOutput(text: string): string {
  return stripAnsi(text)
}
