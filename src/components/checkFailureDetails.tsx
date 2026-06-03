import type { PerQResult } from '../checks/types'

const MAX_LINES = 12

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value.filter((x): x is string => typeof x === 'string')
}

function truncate(lines: string[]): string[] {
  if (lines.length <= MAX_LINES) {
    return lines
  }
  return [
    ...lines.slice(0, MAX_LINES),
    `… and ${lines.length - MAX_LINES} more`,
  ]
}

function formatByCheckId(checkId: string, details: unknown): string[] {
  if (!isRecord(details)) {
    return []
  }

  switch (checkId) {
    case 'arc-patterns':
      return stringList(details.violations)

    case 'expanded-count-balance': {
      const rowTotal = details.rowTotal
      const colTotal = details.colTotal
      if (typeof rowTotal === 'number' && typeof colTotal === 'number') {
        return [`expanded rows ${rowTotal} ≠ expanded columns ${colTotal}`]
      }
      return []
    }

    case 'trivial-row-column': {
      const lines: string[] = []
      for (const issue of stringList(details.row0Issues)) {
        lines.push(`row 0: ${issue}`)
      }
      for (const issue of stringList(details.col0Issues)) {
        lines.push(`column 0: ${issue}`)
      }
      return lines
    }

    case 'trivial-orthogonality': {
      const groupOrder = details.groupOrder
      const badRows = details.badRows
      if (Array.isArray(badRows)) {
        return badRows
          .filter(isRecord)
          .map((row) => {
            const i = row.rowIndex
            const sum =
              row.sum ??
              (typeof row.sumRe === 'number'
                ? `${row.sumRe}${typeof row.sumIm === 'number' && Math.abs(row.sumIm) > 1e-9 ? ` + ${row.sumIm}i` : ''}`
                : '?')
            const expected =
              i === 0
                ? `expected sum ≈ ${groupOrder}`
                : 'expected sum ≈ 0'
            return `row ${i}: sum = ${sum} (${expected})`
          })
      }
      const rows = details.rows
      if (!Array.isArray(rows)) {
        return []
      }
      const lines: string[] = []
      for (const row of rows) {
        if (!isRecord(row) || row.ok !== false) {
          continue
        }
        const i = row.rowIndex
        const sumRe = row.sumRe
        const sumIm = row.sumIm
        const expected =
          i === 0
            ? `expected sum ≈ ${groupOrder}`
            : 'expected sum ≈ 0'
        lines.push(
          `row ${i}: sum = ${sumRe}${typeof sumIm === 'number' && Math.abs(sumIm) > 1e-9 ? ` + ${sumIm}i` : ''} (${expected})`,
        )
      }
      return lines
    }

    case 'row-orthogonality':
    case 'column-orthogonality': {
      const maxDev = details.maxDeviation
      const lines: string[] = []
      if (typeof maxDev === 'number') {
        lines.push(`max deviation from expected Gram entries: ${maxDev.toExponential(3)}`)
      }
      if (typeof details.groupOrder === 'number') {
        lines.push(`|G| at this q = ${details.groupOrder}`)
      }
      const badPairs = details.badPairs
      if (Array.isArray(badPairs)) {
        for (const pair of badPairs) {
          if (!isRecord(pair)) {
            continue
          }
          const ip =
            pair.ip ??
            (typeof pair.ipRe === 'number'
              ? `${pair.ipRe}${typeof pair.ipIm === 'number' ? ` + ${pair.ipIm}i` : ''}`
              : '?')
          lines.push(
            `⟨${pair.a}, ${pair.b}⟩ = ${ip}, expected ${pair.expected}`,
          )
        }
      }
      return lines
    }

    case 'duplicate-irrep': {
      const pairs = details.duplicatePairs
      if (!Array.isArray(pairs)) {
        return []
      }
      return pairs
        .filter(isRecord)
        .map((p) =>
          typeof p.ratio === 'string' || typeof p.ratio === 'number'
            ? `rows ${p.a} and ${p.b} nearly proportional (${p.ratio})`
            : `rows ${p.a} and ${p.b} are nearly proportional`,
        )
    }

    case 'norm-identity': {
      const groupOrder = details.groupOrder
      const badRows = details.badRows
      if (!Array.isArray(badRows)) {
        return []
      }
      return badRows
        .filter(isRecord)
        .map((r) => {
          const expected =
            typeof groupOrder === 'number' ? ` (expected ${groupOrder})` : ''
          return `slice ${r.key}: ‖χ‖² sum = ${r.normSum}${expected}`
        })
    }

    case 'degree-sum': {
      const sumSq = details.sumSq
      const groupOrder = details.groupOrder
      if (sumSq != null && groupOrder != null) {
        return [`∑ dim² = ${sumSq}, expected |G| = ${groupOrder}`]
      }
      return []
    }

    case 'theta-sum': {
      const sum = details.sum
      if (typeof sum === 'string') {
        return [`∑ θ(c·x) = ${sum}, expected 0`]
      }
      const sumRe = details.sumRe
      const sumIm = details.sumIm
      if (typeof sumRe === 'number') {
        return [
          `∑ θ(c·x) = ${sumRe}${typeof sumIm === 'number' ? ` + ${sumIm}i` : ''}, expected 0`,
        ]
      }
      return []
    }

    case 'conjugacy': {
      const sumAtQ = details.sumAtQ
      const groupOrderAtQ = details.groupOrderAtQ
      if (typeof sumAtQ === 'number' && typeof groupOrderAtQ === 'number') {
        return [`∑ n_j|C_j| = ${sumAtQ}, |G| = ${groupOrderAtQ}`]
      }
      return []
    }

    default:
      return []
  }
}

function formatGeneric(details: unknown): string[] {
  if (typeof details === 'string') {
    return [details]
  }
  if (isRecord(details)) {
    const violations = stringList(details.violations)
    if (violations.length > 0) {
      return violations
    }
    const issues = stringList(details.issues)
    if (issues.length > 0) {
      return issues
    }
  }
  return []
}

export function formatCheckFailureLines(
  checkId: string,
  details?: unknown,
  message?: string,
): string[] {
  const lines: string[] = []
  if (message) {
    lines.push(message)
  }
  lines.push(...formatByCheckId(checkId, details))
  if (lines.length === 0) {
    lines.push(...formatGeneric(details))
  }
  if (lines.length === 0 && details !== undefined) {
    try {
      const text = JSON.stringify(details, null, 0)
      if (text && text !== '{}') {
        lines.push(text.length > 400 ? `${text.slice(0, 400)}…` : text)
      }
    } catch {
      lines.push(String(details))
    }
  }
  return truncate(lines)
}

export function hasFailureDetails(
  details?: unknown,
  message?: string,
): boolean {
  return formatCheckFailureLines('', details, message).length > 0
}

type CheckFailureDetailsProps = {
  checkId: string
  details?: unknown
  message?: string
}

export function CheckFailureDetails({
  checkId,
  details,
  message,
}: CheckFailureDetailsProps) {
  const lines = formatCheckFailureLines(checkId, details, message)
  if (lines.length === 0) {
    return null
  }

  return (
    <ul className="mt-1.5 list-inside list-disc space-y-0.5 border-t border-red-100 pt-1.5 text-xs text-red-900">
      {lines.map((line) => (
        <li key={line} className="break-all font-mono leading-snug">
          {line}
        </li>
      ))}
    </ul>
  )
}

type CheckResultDetailsProps = {
  checkId: string
  result: {
    passes: boolean
    perQ?: PerQResult[]
    details?: unknown
  }
}

export function CheckResultDetails({ checkId, result }: CheckResultDetailsProps) {
  if (result.passes) {
    return null
  }

  if (result.perQ?.length) {
    return (
      <div className="space-y-2">
        {result.perQ.map((row) => (
          <div
            key={row.q}
            className={`rounded border px-2 py-1.5 text-xs ${
              row.passes
                ? 'border-slate-100 bg-slate-50'
                : 'border-red-200 bg-red-50/60'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-800">
                <span className="font-medium">q = {row.q}</span>
              </span>
              <span
                className={
                  row.passes
                    ? 'text-emerald-700'
                    : 'font-medium text-red-800'
                }
              >
                {row.passes ? 'Pass' : 'Fail'}
              </span>
            </div>
            {!row.passes && (
              <CheckFailureDetails
                checkId={checkId}
                details={row.details}
                message={row.message}
              />
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="rounded border border-red-200 bg-red-50/60 px-2 py-1.5 text-xs">
      <CheckFailureDetails checkId={checkId} details={result.details} />
    </div>
  )
}
