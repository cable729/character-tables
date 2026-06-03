import { useEffect, useRef, useState } from 'react'
import { MathCell } from './MathCell'

type EditableCellProps = {
  latex: string
  compact?: boolean
  isEditing: boolean
  onStartEdit: () => void
  onCommit: (value: string) => void
  onCancel: () => void
}

export function EditableCell({
  latex,
  compact = false,
  isEditing,
  onStartEdit,
  onCommit,
  onCancel,
}: EditableCellProps) {
  const [draft, setDraft] = useState(latex)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing) {
      setDraft(latex)
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing, latex])

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => onCommit(draft)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            onCommit(draft)
          } else if (e.key === 'Escape') {
            e.preventDefault()
            onCancel()
          }
        }}
        className="w-full min-w-[3rem] rounded border border-sky-400 bg-white px-1 py-0.5 font-mono text-xs text-slate-900 outline-none ring-1 ring-sky-200"
      />
    )
  }

  return (
    <button
      type="button"
      onDoubleClick={onStartEdit}
      className="w-full cursor-text rounded text-center hover:bg-sky-50/80 focus:outline-none focus:ring-2 focus:ring-sky-300"
      title="Double-click to edit"
    >
      <MathCell latex={latex} compact={compact} />
    </button>
  )
}
