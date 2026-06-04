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
}

export function EditableCell({
  latex,
  compact = false,
  isEditing,
  onStartEdit,
  onCommit,
  onCancel,
  title = 'Click to edit',
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
        className="absolute inset-0 z-10 box-border h-full w-full border-0 bg-white px-1 text-center font-mono text-xs leading-none text-slate-900 outline-none"
      />
    )
  }

  return (
    <div
      role="button"
      tabIndex={-1}
      title={title}
      onClick={(e) => {
        e.stopPropagation()
        onStartEdit()
      }}
      className="absolute inset-0 flex cursor-pointer items-center justify-center overflow-hidden"
    >
      <MathCell
        latex={latex}
        compact={compact}
        className="pointer-events-none max-w-full"
      />
    </div>
  )
}
