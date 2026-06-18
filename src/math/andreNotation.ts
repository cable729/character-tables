/** LaTeX written in matrix cells; KaTeX renders this as André (see `KATEX_ANDRE_MACRO`). */
export const ANDRE_CELL_LATEX = '\\andre'

export const KATEX_ANDRE_MACRO = {
  '\\andre': '\\operatorname{André}',
} as const

/** André (2001) Corollary 5.1 — character on a class representative. */
export const ANDRE_COROLLARY_51_LATEX =
  '\\xi_D(\\phi)\\!\\left(e_{D^{\\prime}}(\\phi^{\\prime})\\right)=' +
  '\\begin{cases}' +
  'q^{e(D,D^{\\prime})}\\displaystyle\\prod_{(i,j)\\in D}\\theta(\\phi_{ij}x_{ij}) & D\\subseteq R(D^{\\prime}),\\\\' +
  '0 & \\mathrm{otherwise}' +
  '\\end{cases}'

/** D′-regular roots (André §5). */
export const ANDRE_RD_PRIME_LATEX =
  'R(D^{\\prime})=\\bigl\\{(i,j):\\ \\nexists\\, k,\\ i<k<j,\\ ' +
  '((i,k)\\in D^{\\prime}\\ \\lor\\ (k,j)\\in D^{\\prime})\\bigr\\}'

/** Sc*(D) and exponent e(D,D′) = |Sc*(D) ∩ R(D′)| (André §5). */
export const ANDRE_ED_PRIME_LATEX =
  'Sc^{\\ast}(D)=\\bigcup_{(i,j)\\in D}\\{(a,j):\\ i<a<j\\},\\qquad ' +
  'e(D,D^{\\prime})=\\bigl|Sc^{\\ast}(D)\\cap R(D^{\\prime})\\bigr|'
