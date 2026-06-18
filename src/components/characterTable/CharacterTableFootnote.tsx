import type { ReactNode } from 'react'
import type { TableType } from '../../types/characterTable'
import {
  ANDRE_CELL_LATEX,
  ANDRE_COROLLARY_51_LATEX,
  ANDRE_ED_PRIME_LATEX,
  ANDRE_RD_PRIME_LATEX,
} from '../../math/andreNotation'
import { MathCell } from '../MathCell'

const ANDRE_PAPER_URL = 'https://doi.org/10.1006/jabr.2001.8734'

type CharacterTableFootnoteProps = {
  tableType?: TableType
}

function FootnoteTerm({ latex, children }: { latex: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(3.5rem,auto)_1fr] gap-x-3 gap-y-1 border-b border-slate-100 py-2.5 last:border-b-0">
      <div className="pt-0.5 font-medium text-slate-700">
        <MathCell latex={latex} className="[&_.katex]:text-sm" />
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
        <FootnoteTerm latex={ANDRE_CELL_LATEX}>
          <div className="space-y-2">
            <p>
              Evaluate Cor.&nbsp;5.1 for the current slice: build basic subsets{' '}
              <M latex="D" /> (character row) and <M latex="D^{\prime}" /> (class column)
              from the arc diagrams, then apply the formula below.
            </p>
            <p>
              In the table, Greek letters such as <M latex="\alpha" />,{' '}
              <M latex="\beta" />, <M latex="\gamma" /> (rows) and Latin letters such as{' '}
              <M latex="a" />, <M latex="b" />, <M latex="c" /> (columns) are{' '}
              <em>arc labels</em> — names for coordinates <M latex="(i,j)" /> on the
              diagram. They are not symbols in Cor.&nbsp;5.1 itself; on each slice the
              label&apos;s value becomes a field element{' '}
              <M latex="\phi_{ij}" /> or <M latex="x_{ij}" /> in the product.
            </p>
            <p>
              <M latex="R(D^{\prime})" /> is the set of <M latex="D^{\prime}" />
              -regular roots: pairs <M latex="(i,j)" /> for which no root of{' '}
              <M latex="D^{\prime}" /> lies strictly between <M latex="i" /> and{' '}
              <M latex="j" /> (no <M latex="(i,k)\in D^{\prime}" /> or{' '}
              <M latex="(k,j)\in D^{\prime}" /> with <M latex="i<k<j" />).
            </p>
            <p>
              The exponent <M latex="e(D,D^{\prime})" /> counts how many roots in{' '}
              <M latex="Sc^{\ast}(D)" /> are also <M latex="D^{\prime}" />-regular: for each{' '}
              <M latex="(i,j)\in D" />, take column roots <M latex="(a,j)" /> with{' '}
              <M latex="i<a<j" />, then intersect with <M latex="R(D^{\prime})" /> and count.
              So <M latex="q^{e(D,D^{\prime})}" /> is a power of <M latex="q" />, not a θ-factor.
            </p>
            <p className="text-slate-500">
              <a
                href={ANDRE_PAPER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 underline decoration-blue-200 underline-offset-2 hover:decoration-blue-500"
              >
                André (2001)
              </a>
              , Cor.&nbsp;5.1:
            </p>
            <div className="overflow-x-auto rounded-md bg-slate-50 px-2 py-2">
              <MathCell
                displayMode
                latex={ANDRE_COROLLARY_51_LATEX}
                className="[&_.katex]:text-[13px]"
              />
            </div>
            <div className="overflow-x-auto text-slate-500">
              <MathCell
                displayMode
                latex={ANDRE_RD_PRIME_LATEX}
                className="[&_.katex]:text-[11px]"
              />
            </div>
            <div className="overflow-x-auto text-slate-500">
              <MathCell
                displayMode
                latex={ANDRE_ED_PRIME_LATEX}
                className="[&_.katex]:text-[11px]"
              />
            </div>
          </div>
        </FootnoteTerm>

        <FootnoteTerm latex="\\theta">
          <p>
            Nontrivial additive character on <M latex="\mathbb{F}_q" />,{' '}
            <M latex="\theta(x)=e^{2\pi i x/q}" />. In cells, <M latex="\theta(\alpha a)" />{' '}
            means <M latex="\theta(\alpha\cdot a)" /> after substituting slice values (
            <M latex="\alpha" /> here is an arc label, not a constant).
          </p>
        </FootnoteTerm>

        <FootnoteTerm latex="\\delta">
          <p>
            Kronecker delta on slice equalities — <M latex="1" /> if the subscript equality
            holds, <M latex="0" /> otherwise.
          </p>
        </FootnoteTerm>

        <FootnoteTerm latex="q">
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
