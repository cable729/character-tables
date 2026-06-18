import type { ReactNode } from 'react'
import { MathCell } from '../MathCell'

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

function M({ latex }: { latex: string }) {
  return <MathCell latex={latex} className="inline [&_.katex]:text-[11px]" />
}

export function CellNotationContent() {
  return (
    <div className="text-sm text-slate-600">
      <div className="divide-y divide-slate-100">
        <FootnoteTerm label="\theta">
          <p>
            Nontrivial additive character on <M latex="\mathbb{F}_q" />,{' '}
            <M latex="\theta(x)=e^{2\pi i x/q}" />. In cells, <M latex="\theta(\alpha a)" />{' '}
            means <M latex="\theta(\alpha\cdot a)" /> after substituting slice values (
            <M latex="\alpha" /> here is an arc label, not a constant).
          </p>
          <p className="mt-1.5">
            Bracket notation <M latex="\theta([a_1,a_2,\ldots,a_k])" /> sums over{' '}
            <M latex="t\in\mathbb{F}_q" />:
          </p>
          <p className="mt-1">
            <M latex="\theta([a_1,\ldots,a_k])=\sum_{t\in\mathbb{F}_q}\theta(a_1 t+a_2 t^2+\cdots+a_k t^k)" />
          </p>
          <p className="mt-1.5 text-slate-500">
            Use the simple form for <M latex="UT_n" /> tables; bracket notation for{' '}
            <M latex="UT_n^{(k)}" />.
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
    </div>
  )
}
