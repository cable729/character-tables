import { useEffect, useRef, useState } from 'react'
import { MathCell } from './MathCell'

type EditableCellProps = {
  latex: string
  compact?: boolean
  isEditing: boolean
  onStartEdit: () => void
  onCommit: (value: string) => void
  onCancel: () => void
  title?: string
  maxLines?: 1 | 2
  columnWidthPx?: number
}

export function EditableCell({
  latex,
  compact = false,
  isEditing,
  onStartEdit,
  onCommit,
  onCancel,
  title,
  maxLines = 2,
  columnWidthPx,
}: EditableCellProps) {
  const [draft, setDraft] = useState(latex)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isEditing) {
      setDraft(latex)
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing, latex])

  const displayTitle =
    title ?? (latex.trim() ? `${latex} — click to edit` : 'Click to edit')

  if (isEditing) {
    return (
      <textarea
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => onCommit(draft.trimEnd())}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            onCommit(draft.trimEnd())
          } else if (e.key === 'Escape') {
            e.preventDefault()
            onCancel()
          }
        }}
        className="absolute inset-0 z-10 box-border h-full w-full resize-none overflow-auto border-0 bg-white px-1 py-0.5 text-left font-mono text-xs leading-snug break-all text-slate-900 outline-none"
      />
    )
  }

  return (
    <div
      role="button"
      tabIndex={-1}
      title={displayTitle}
      onClick={(e) => {
        e.stopPropagation()
        onStartEdit()
      }}
      className="absolute inset-0 flex cursor-pointer items-center justify-center overflow-visible px-0.5"
    >
      <MathCell
        latex={latex}
        compact={compact}
        maxLines={maxLines}
        columnWidthPx={columnWidthPx}
        className="pointer-events-none"
      />
    </div>
  )
}
