import katex from 'katex'

/** Render LaTeX to HTML via KaTeX (more reliable than react-katex on React 19). */
export function renderLatex(latex: string, displayMode = false): string {
  return katex.renderToString(latex, {
    throwOnError: false,
    displayMode,
    strict: 'ignore',
  })
}
