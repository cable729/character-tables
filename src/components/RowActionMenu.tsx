import { useRef, type KeyboardEvent } from 'react'
import { DropdownMenu } from './DropdownMenu'

type RowActionMenuProps = {
  label: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onRename: () => void
  onDelete?: () => void
  deleteLabel?: string
}

function stopMenuEvent(e: { stopPropagation: () => void }) {
  e.stopPropagation()
}

export function RowActionMenu({
  label,
  open,
  onOpenChange,
  onRename,
  onDelete,
  deleteLabel = 'Delete',
}: RowActionMenuProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Actions for ${label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onMouseDown={stopMenuEvent}
        onClick={(e) => {
          stopMenuEvent(e)
          onOpenChange(!open)
        }}
        className="shrink-0 rounded px-1.5 py-1 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700"
      >
        ⋮
      </button>
      <DropdownMenu
        open={open}
        onClose={() => onOpenChange(false)}
        anchorRef={buttonRef}
        align="end"
        nested
        className="min-w-32 rounded border border-slate-200 bg-white py-1 shadow-lg"
      >
        <button
          type="button"
          onMouseDown={stopMenuEvent}
          onClick={(e) => {
            stopMenuEvent(e)
            onOpenChange(false)
            onRename()
          }}
          className="block w-full px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-100"
        >
          Rename
        </button>
        {onDelete && (
          <button
            type="button"
            onMouseDown={stopMenuEvent}
            onClick={(e) => {
              stopMenuEvent(e)
              onOpenChange(false)
              onDelete()
            }}
            className="block w-full px-3 py-1.5 text-left text-sm text-red-700 hover:bg-red-50"
          >
            {deleteLabel}
          </button>
        )}
      </DropdownMenu>
    </>
  )
}

type InlineRenameFieldProps = {
  value: string
  onChange: (value: string) => void
  onSave: () => void
  onCancel: () => void
  className?: string
}

export function InlineRenameField({
  value,
  onChange,
  onSave,
  onCancel,
  className = '',
}: InlineRenameFieldProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      onMouseDown={stopMenuEvent}
      onClick={stopMenuEvent}
      onBlur={onSave}
      autoFocus
      className={`min-w-0 flex-1 rounded border border-slate-300 px-2 py-1 text-sm ${className}`.trim()}
    />
  )
}
