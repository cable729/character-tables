/** Evaluate a conjugacy class size formula in q (LaTeX subset used in YAML). */
export function evalClassSize(latex: string, q: number): number {
  const s = latex.replace(/\{/g, '').replace(/\}/g, '').replace(/\s/g, '')

  if (s === '1') {
    return 1
  }
  if (s === 'q') {
    return q
  }

  const qPow = /^q\^(\d+)$/.exec(s)
  if (qPow) {
    return q ** Number(qPow[1])
  }

  if (s === '(q-1)') {
    return q - 1
  }
  if (s === '(q-1)q') {
    return (q - 1) * q
  }

  throw new Error(`Unsupported classSize: ${latex}`)
}
