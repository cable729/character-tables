/** Coefficients of a polynomial in q: sum_i coeffs[i] * q^i */
export type QPolyCoeffs = number[]

export function normalizeQPolyLatex(latex: string): string {
  return latex.replace(/\{/g, '').replace(/\}/g, '').replace(/\s/g, '')
}

function trimLeadingZeros(coeffs: QPolyCoeffs): QPolyCoeffs {
  let end = coeffs.length
  while (end > 1 && coeffs[end - 1] === 0) {
    end--
  }
  return coeffs.slice(0, end)
}

function addCoeffs(a: QPolyCoeffs, b: QPolyCoeffs): QPolyCoeffs {
  const len = Math.max(a.length, b.length)
  const out: number[] = []
  for (let i = 0; i < len; i++) {
    out[i] = (a[i] ?? 0) + (b[i] ?? 0)
  }
  return trimLeadingZeros(out)
}

function subCoeffs(a: QPolyCoeffs, b: QPolyCoeffs): QPolyCoeffs {
  const len = Math.max(a.length, b.length)
  const out: number[] = []
  for (let i = 0; i < len; i++) {
    out[i] = (a[i] ?? 0) - (b[i] ?? 0)
  }
  return trimLeadingZeros(out)
}

function mulCoeffs(a: QPolyCoeffs, b: QPolyCoeffs): QPolyCoeffs {
  if (a.length === 0 || b.length === 0) {
    return [0]
  }
  const out = new Array(a.length + b.length - 1).fill(0)
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      out[i + j]! += a[i]! * b[j]!
    }
  }
  return trimLeadingZeros(out)
}

function scaleCoeffs(c: QPolyCoeffs, k: number): QPolyCoeffs {
  if (k === 0) {
    return [0]
  }
  return trimLeadingZeros(c.map((x) => x * k))
}

export function matchingClose(s: string, openIdx: number): number {
  let depth = 0
  for (let i = openIdx; i < s.length; i++) {
    if (s[i] === '(') {
      depth++
    } else if (s[i] === ')') {
      depth--
      if (depth === 0) {
        return i
      }
    }
  }
  return -1
}

export function splitTopLevelFactors(s: string): string[] | null {
  const factors: string[] = []
  let i = 0
  while (i < s.length) {
    if (s[i] === '(') {
      const close = matchingClose(s, i)
      if (close < 0) {
        return null
      }
      if (close + 1 < s.length && s[close + 1] === '(') {
        factors.push(s.slice(i, close + 1))
        i = close + 1
      } else {
        factors.push(s.slice(i))
        i = s.length
      }
    } else {
      const next = s.indexOf('(', i)
      const chunk = next >= 0 ? s.slice(i, next) : s.slice(i)
      if (chunk) {
        factors.push(chunk)
      }
      i = next >= 0 ? next : s.length
    }
  }
  return factors.length > 1 ? factors : null
}

function findTopLevelMinus(s: string): number {
  let depth = 0
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (ch === '(') {
      depth++
    } else if (ch === ')') {
      depth--
    } else if (ch === '-' && depth === 0 && i > 0) {
      return i
    }
  }
  return -1
}

function findTopLevelPlus(s: string): number {
  let depth = 0
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (ch === '(') {
      depth++
    } else if (ch === ')') {
      depth--
    } else if (ch === '+' && depth === 0 && i > 0) {
      return i
    }
  }
  return -1
}

function factorToCoeffs(factor: string): QPolyCoeffs {
  let s = factor
  let sign = 1
  if (s.startsWith('-')) {
    sign = -1
    s = s.slice(1)
  }
  if (!s) {
    return [0]
  }

  if (s.startsWith('(') && matchingClose(s, 0) === s.length - 1) {
    const inner = parseQPolyToCoeffs(s.slice(1, -1))
    return scaleCoeffs(inner, sign)
  }

  const coeffs = parseQPolyAtomToCoeffs(s)
  return scaleCoeffs(coeffs, sign)
}

function parseQPolyAtomToCoeffs(s: string): QPolyCoeffs {
  if (s === '0') {
    return [0]
  }
  if (s === '1') {
    return [1]
  }
  if (s === 'q') {
    return [0, 1]
  }

  const qPow = /^q\^(\d+)$/.exec(s)
  if (qPow) {
    const n = Number(qPow[1])
    const out = new Array(n + 1).fill(0)
    out[n] = 1
    return out
  }

  const qMinusOne: QPolyCoeffs = [-1, 1]

  if (s === '(q-1)') {
    return qMinusOne
  }
  if (s === '(q-1)q') {
    return mulCoeffs(qMinusOne, [0, 1])
  }

  const qMinusOnePow = /^\(q-1\)\^(\d+)$/.exec(s)
  if (qMinusOnePow) {
    let base: QPolyCoeffs = qMinusOne
    const exp = Number(qMinusOnePow[1])
    for (let i = 1; i < exp; i++) {
      base = mulCoeffs(base, qMinusOne)
    }
    return base
  }

  const qMinusOneQPow = /^\(q-1\)q\^(\d+)$/.exec(s)
  if (qMinusOneQPow) {
    const qPart = parseQPolyAtomToCoeffs(`q^${qMinusOneQPow[1]}`)
    return mulCoeffs(qMinusOne, qPart)
  }

  const qMinusOneSqQ = /^\(q-1\)\^(\d+)q$/.exec(s)
  if (qMinusOneSqQ) {
    let base: QPolyCoeffs = qMinusOne
    const exp = Number(qMinusOneSqQ[1])
    for (let i = 1; i < exp; i++) {
      base = mulCoeffs(base, qMinusOne)
    }
    return mulCoeffs(base, [0, 1])
  }

  const coeffQ = /^(\d+)q\^?(\d*)$/.exec(s)
  if (coeffQ) {
    const k = Number(coeffQ[1])
    const pow = coeffQ[2] ? Number(coeffQ[2]) : 1
    const qPart = parseQPolyAtomToCoeffs(pow === 1 ? 'q' : `q^${pow}`)
    return mulCoeffs([k], qPart)
  }

  const qPlusOne = /^\(q\+1\)$/.exec(s)
  if (qPlusOne) {
    return [1, 1]
  }

  const intMatch = /^(\d+)$/.exec(s)
  if (intMatch) {
    return [Number(intMatch[1])]
  }

  const factors = splitTopLevelFactors(s)
  if (factors) {
    return factors.reduce(
      (acc, f) => mulCoeffs(acc, factorToCoeffs(f)),
      [1] as QPolyCoeffs,
    )
  }

  throw new Error(`Unsupported q-polynomial factor: ${s}`)
}

export function parseQPolyToCoeffs(latex: string): QPolyCoeffs {
  const s = normalizeQPolyLatex(latex)
  if (!s || s === '0') {
    return [0]
  }

  if (s.startsWith('-')) {
    return scaleCoeffs(parseQPolyToCoeffs(s.slice(1)), -1)
  }

  if (s.startsWith('(') && matchingClose(s, 0) === s.length - 1) {
    return parseQPolyToCoeffs(s.slice(1, -1))
  }

  const plusIndex = findTopLevelPlus(s)
  if (plusIndex >= 0) {
    const left = s.slice(0, plusIndex)
    const right = s.slice(plusIndex + 1)
    return addCoeffs(parseQPolyToCoeffs(left), parseQPolyToCoeffs(right))
  }

  const minusIndex = findTopLevelMinus(s)
  if (minusIndex >= 0) {
    const left = s.slice(0, minusIndex)
    const right = s.slice(minusIndex + 1)
    return subCoeffs(parseQPolyToCoeffs(left), parseQPolyToCoeffs(right))
  }

  const factors = splitTopLevelFactors(s)
  if (factors) {
    return factors.reduce(
      (acc, f) => mulCoeffs(acc, factorToCoeffs(f)),
      [1] as QPolyCoeffs,
    )
  }

  return parseQPolyAtomToCoeffs(s)
}

const FORMAT_TEMPLATES: { latex: string; build: (c: QPolyCoeffs) => boolean }[] =
  [
    {
      latex: '0',
      build: (c) => c.length === 1 && c[0] === 0,
    },
    {
      latex: '1',
      build: (c) => c.length === 1 && c[0] === 1,
    },
    {
      latex: '2',
      build: (c) => c.length === 1 && c[0] === 2,
    },
    {
      latex: '-1',
      build: (c) => c.length === 1 && c[0] === -1,
    },
    {
      latex: '2(q-1)',
      build: (c) => c.length === 2 && c[0] === -2 && c[1] === 2,
    },
    {
      latex: '2q-2',
      build: (c) => c.length === 2 && c[0] === -2 && c[1] === 2,
    },
    {
      latex: '2 - q',
      build: (c) => c.length === 2 && c[0] === 2 && c[1] === -1,
    },
    {
      latex: 'q',
      build: (c) => c.length === 2 && c[0] === 0 && c[1] === 1,
    },
    {
      latex: 'q^{2}',
      build: (c) => c.length === 3 && c[0] === 0 && c[1] === 0 && c[2] === 1,
    },
    {
      latex: 'q^{3}',
      build: (c) =>
        c.length === 4 && c[0] === 0 && c[1] === 0 && c[2] === 0 && c[3] === 1,
    },
    {
      latex: 'q-1',
      build: (c) => c.length === 2 && c[0] === -1 && c[1] === 1,
    },
    {
      latex: '(q-1)',
      build: (c) => c.length === 2 && c[0] === -1 && c[1] === 1,
    },
    {
      latex: '(q-1)^{2}',
      build: (c) => c.length === 3 && c[0] === 1 && c[1] === -2 && c[2] === 1,
    },
    {
      latex: 'q^{2} - 1',
      build: (c) => c.length === 3 && c[0] === -1 && c[1] === 0 && c[2] === 1,
    },
    {
      latex: 'q^{3} - 1',
      build: (c) =>
        c.length === 4 && c[0] === -1 && c[1] === 0 && c[2] === 0 && c[3] === 1,
    },
    {
      latex: '(q-1)q',
      build: (c) => c.length === 3 && c[0] === 0 && c[1] === -1 && c[2] === 1,
    },
    {
      latex: 'q(q-1)',
      build: (c) => c.length === 3 && c[0] === 0 && c[1] === -1 && c[2] === 1,
    },
    {
      latex: 'q(q - 1)',
      build: (c) => c.length === 3 && c[0] === 0 && c[1] === -1 && c[2] === 1,
    },
    {
      latex: '(q-1)^{2}q',
      build: (c) =>
        c.length === 4 && c[0] === 0 && c[1] === 1 && c[2] === -2 && c[3] === 1,
    },
    {
      latex: '(q-1)q^{2}',
      build: (c) =>
        c.length === 4 && c[0] === 0 && c[1] === -1 && c[2] === 1 && c[3] === 0,
    },
  ]

function coeffsEqual(a: QPolyCoeffs, b: QPolyCoeffs): boolean {
  const ta = trimLeadingZeros(a)
  const tb = trimLeadingZeros(b)
  if (ta.length !== tb.length) {
    return false
  }
  return ta.every((v, i) => v === tb[i])
}

export function formatQPolyCoeffs(coeffs: QPolyCoeffs): string {
  const c = trimLeadingZeros(coeffs)
  for (const { latex, build } of FORMAT_TEMPLATES) {
    if (build(c)) {
      return latex
    }
  }

  const terms: string[] = []
  for (let i = c.length - 1; i >= 0; i--) {
    const coef = c[i]!
    if (coef === 0) {
      continue
    }
    if (i === 0) {
      terms.push(String(coef))
      continue
    }
    const qPart = i === 1 ? 'q' : `q^{${i}}`
    if (coef === 1) {
      terms.push(qPart)
    } else if (coef === -1) {
      terms.push(`-${qPart}`)
    } else {
      terms.push(`${coef}${qPart}`)
    }
  }

  if (terms.length === 0) {
    return '0'
  }

  let out = terms[0]!
  for (let t = 1; t < terms.length; t++) {
    const term = terms[t]!
    if (term.startsWith('-')) {
      out += ` - ${term.slice(1)}`
    } else {
      out += ` + ${term}`
    }
  }
  return out
}

export function addQPolynomialLatex(a: string, b: string): string {
  const sum = addCoeffs(parseQPolyToCoeffs(a), parseQPolyToCoeffs(b))
  const formatted = formatQPolyCoeffs(sum)
  if (!coeffsEqual(parseQPolyToCoeffs(formatted), sum)) {
    throw new Error(`addQPolynomialLatex round-trip failed for "${a}" + "${b}"`)
  }
  return formatted
}

export function sumQPolynomialLatex(cells: string[]): string {
  if (cells.length === 0) {
    return '0'
  }
  const [first, ...rest] = cells
  return rest.reduce(
    (acc, cell) => addQPolynomialLatex(acc, cell),
    formatQPolyCoeffs(parseQPolyToCoeffs(first!)),
  )
}

export function qPolyCoeffsEqual(a: string, b: string): boolean {
  return coeffsEqual(parseQPolyToCoeffs(a), parseQPolyToCoeffs(b))
}
