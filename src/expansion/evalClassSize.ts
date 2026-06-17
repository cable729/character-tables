/** Evaluate LaTeX polynomials in q used in YAML (classSize, groupOrder, expansionCount). */
import { matchingClose, splitTopLevelFactors } from './qPolynomial'

export function evalQPolynomial(latex: string, q: number): number {
  const s = latex.replace(/\{/g, '').replace(/\}/g, '').replace(/\s/g, '')

  if (s.startsWith('(') && matchingClose(s, 0) === s.length - 1) {
    return evalQPolynomial(s.slice(1, -1), q)
  }

  const plusIndex = findTopLevelPlus(s)
  if (plusIndex >= 0) {
    const left = s.slice(0, plusIndex)
    const right = s.slice(plusIndex + 1)
    return evalQPolynomial(left, q) + evalQPolynomial(right, q)
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

  const coeffQ = /^(\d+)q$/.exec(s)
  if (coeffQ) {
    return Number(coeffQ[1]) * q
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

  const intMatch = /^(\d+)$/.exec(s)
  if (intMatch) {
    return Number(intMatch[1])
  }

  throw new Error(`Unsupported q-polynomial: ${s}`)
}
