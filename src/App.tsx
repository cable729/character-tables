import { useEffect } from 'react'
import { CharacterTableView } from './components/CharacterTableView'
import { JupyterConnect } from './components/JupyterConnect'
import { SageChecksPanel } from './components/SageChecksPanel'
import { TableEditorPanel } from './components/TableEditorPanel'
import { MathCell } from './components/MathCell'
import { useTableStore } from './store/tableStore'
import { ut4Example, ut4Yaml } from './data/ut4Example'

function App() {
  const table = useTableStore((s) => s.table)
  const showEditor = useTableStore((s) => s.showEditor)
  const setShowEditor = useTableStore((s) => s.setShowEditor)
  const loadExample = useTableStore((s) => s.loadExample)

  useEffect(() => {
    const stored = localStorage.getItem('character-table-v5')
    if (!stored) {
      loadExample(ut4Example, ut4Yaml)
    }
  }, [loadExample])

  const subtitleLatex = table.group ?? table.title ?? ''

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Character Tables
            </h1>
            {subtitleLatex && (
              <p className="mt-1 text-base text-slate-800">
                <MathCell latex={subtitleLatex} />
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-start justify-end gap-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => loadExample(ut4Example, ut4Yaml)}
                className="rounded bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                Load UT₄ example
              </button>
              <button
                type="button"
                onClick={() => setShowEditor(!showEditor)}
                className={`rounded px-3 py-1.5 text-sm font-medium transition ${
                  showEditor
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {showEditor ? 'Hide editor' : 'Edit table'}
              </button>
            </div>
            <JupyterConnect />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 overflow-hidden p-4">
        <div
          className={`grid min-h-0 flex-1 gap-4 ${
            showEditor ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
          }`}
        >
          <div className="min-h-0 overflow-auto">
            <CharacterTableView table={table} />
          </div>

          {showEditor && (
            <div className="min-h-[300px] lg:min-h-0">
              <TableEditorPanel />
            </div>
          )}
        </div>

        <div className="max-h-[45vh] min-h-[200px] shrink-0 overflow-auto">
          <SageChecksPanel table={table} />
        </div>
      </main>
    </div>
  )
}

export default App
