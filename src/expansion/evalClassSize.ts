/** Evaluate LaTeX polynomials in q used in YAML (classSize, groupOrder, expansionCount). */
export function evalQPolynomial(latex: string, q: number): number {
  const s = latex.replace(/\{/g, '').replace(/\}/g, '').replace(/\s/g, '')

  if (s.startsWith('(') && matchingClose(s, 0) === s.length - 1) {
    return evalQPolynomial(s.slice(1, -1), q)
  }

  const minusIndex = findTopLevelMinus(s)
  if (minusIndex >= 0) {
    const left = s.slice(0, minusIndex)
    const right = s.slice(minusIndex + 1)
    return evalQPolynomial(left, q) - evalQPolynomial(right, q)
  }

  const factors = splitTopLevelFactors(s)
  if (factors) {
    return factors.reduce((prod, factor) => prod * evalQPolynomial(factor, q), 1)
  }

  return evalQPolynomialAtom(s, q)
}

function matchingClose(s: string, openIdx: number): number {
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

function splitTopLevelFactors(s: string): string[] | null {
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

function evalQPolynomialAtom(s: string, q: number): number {
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

  const qMinusOnePow = /^\(q-1\)\^(\d+)$/.exec(s)
  if (qMinusOnePow) {
    return (q - 1) ** Number(qMinusOnePow[1])
  }

  const qMinusOneQPow = /^\(q-1\)q\^(\d+)$/.exec(s)
  if (qMinusOneQPow) {
    return (q - 1) * q ** Number(qMinusOneQPow[1])
  }

  const qMinusOneSqQ = /^\(q-1\)\^(\d+)q$/.exec(s)
  if (qMinusOneSqQ) {
    return (q - 1) ** Number(qMinusOneSqQ[1]) * q
  }

  const qPlusOne = /^\(q\+1\)$/.exec(s)
  if (qPlusOne) {
    return q + 1
  }

  const qMinusOneSqTimesQPlusOne = /^\(q-1\)\^(\d+)\(q\+1\)$/.exec(s)
  if (qMinusOneSqTimesQPlusOne) {
    return (q - 1) ** Number(qMinusOneSqTimesQPlusOne[1]) * (q + 1)
  }

  throw new Error(`Unsupported q-polynomial: ${s}`)
}

/** @deprecated Use evalQPolynomial */
export function evalClassSize(latex: string, q: number): number {
  return evalQPolynomial(latex, q)
}
