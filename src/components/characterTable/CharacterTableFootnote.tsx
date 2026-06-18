import type { ReactNode } from 'react'
import type { TableType } from '../../types/characterTable'
import { MathCell } from '../MathCell'

type CharacterTableFootnoteProps = {
  tableType?: TableType
}

function FootnoteTerm({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(3.5rem,auto)_1fr] gap-x-3 gap-y-1 border-b border-slate-100 py-2.5 last:border-b-0">
      <div className="pt-0.5 font-medium text-slate-700">
        <code className="text-sm font-semibold text-slate-700">{label}</code>
      </div>
      <div className="min-w-0 text-xs leading-relaxed text-slate-600">{children}</div>
    </div>
  )
}

/** Short inline math fragment (not a full sentence). */
function M({ latex }: { latex: string }) {
  return <MathCell latex={latex} className="inline [&_.katex]:text-[11px]" />
}

export function CharacterTableFootnote({ tableType }: CharacterTableFootnoteProps) {
  if (tableType === 'supercharacter') {
    return null
  }

  return (
    <footer className="mt-4 max-w-2xl border-t border-slate-200 pt-4 text-sm text-slate-600">
      <h3 className="mb-2 text-sm font-semibold text-slate-800">
        Cell Notation and Formulas
      </h3>

      <div className="divide-y divide-slate-100">
        <FootnoteTerm label="\theta">
          <p>
            Nontrivial additive character on <M latex="\mathbb{F}_q" />,{' '}
            <M latex="\theta(x)=e^{2\pi i x/q}" />. In cells, <M latex="\theta(\alpha a)" />{' '}
            means <M latex="\theta(\alpha\cdot a)" /> after substituting slice values (
            <M latex="\alpha" /> here is an arc label, not a constant).
          </p>
        </FootnoteTerm>

        <FootnoteTerm label="\delta">
          <p>
            Kronecker delta on slice equalities — <M latex="1" /> if the subscript equality
            holds, <M latex="0" /> otherwise.
          </p>
        </FootnoteTerm>

        <FootnoteTerm label="q">
          <p>
            Field size and class-size polynomials (<M latex="q^k" />,{' '}
            <M latex="(q-1)" />
            ). Column headers show <M latex="|C_j|" />, the weights in orthogonality sums.
          </p>
        </FootnoteTerm>
      </div>

      <p className="mt-3 border-t border-slate-100 pt-3 text-xs leading-relaxed text-slate-500">
        Orthogonality uses <M latex="\sum_{x\in\mathbb{F}_q}\theta(cx)=0" /> for{' '}
        <M latex="c\neq 0" />, hence <M latex="\sum_{a=1}^{q-1}\theta(ca)=-1" /> since{' '}
        <M latex="\theta(0)=1" />.
      </p>
    </footer>
  )
}
