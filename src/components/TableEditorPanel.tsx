import CodeMirror from '@uiw/react-codemirror'
import { yaml } from '@codemirror/lang-yaml'
import { useTableStore } from '../store/tableStore'

export function TableEditorPanel() {
  const editorText = useTableStore((s) => s.editorText)
  const editorError = useTableStore((s) => s.editorError)
  const setEditorText = useTableStore((s) => s.setEditorText)
  const applyEditor = useTableStore((s) => s.applyEditor)
  const importYaml = useTableStore((s) => s.importYaml)
  const exportSnapshotYaml = useTableStore((s) => s.exportSnapshotYaml)
  const exportProjectYaml = useTableStore((s) => s.exportProjectYaml)
  const table = useTableStore((s) => s.table)

  const handleExportSnapshot = () => {
    const text = exportSnapshotYaml()
    const blob = new Blob([text], { type: 'text/yaml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const name = (table.group ?? table.title ?? 'character-table')
      .replace(/[^\w.-]+/g, '-')
      .toLowerCase()
    a.download = `${name}.yaml`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportProject = () => {
    const text = exportProjectYaml()
    const blob = new Blob([text], { type: 'text/yaml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const name = (table.group ?? table.title ?? 'character-table')
      .replace(/[^\w.-]+/g, '-')
      .toLowerCase()
    a.download = `${name}-project.yaml`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.yaml,.yml,text/yaml'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      const text = await file.text()
      importYaml(text)
    }
    input.click()
  }

  return (
    <div className="flex h-full flex-col rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
        <h2 className="text-sm font-semibold text-slate-800">Table (YAML)</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleImport}
            className="rounded bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
          >
            Import
          </button>
          <button
            type="button"
            onClick={handleExportSnapshot}
            className="rounded bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
          >
            Export snapshot
          </button>
          <button
            type="button"
            onClick={handleExportProject}
            className="rounded bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
          >
            Export project
          </button>
          <button
            type="button"
            onClick={applyEditor}
            className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
          >
            Apply
          </button>
        </div>
      </div>

      {editorError && (
        <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
          {editorError}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-hidden">
        <CodeMirror
          value={editorText}
          height="100%"
          extensions={[yaml()]}
          onChange={(value) => setEditorText(value)}
          className="h-full text-sm [&_.cm-editor]:h-full [&_.cm-scroller]:overflow-auto"
        />
      </div>
    </div>
  )
}
