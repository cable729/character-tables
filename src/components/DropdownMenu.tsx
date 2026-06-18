import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export const DROPDOWN_NESTED_ATTR = 'data-dropdown-nested'

type DropdownMenuProps = {
  open: boolean
  onClose: () => void
  anchorRef: React.RefObject<HTMLElement | null>
  children: ReactNode
  className?: string
  align?: 'start' | 'end'
  nested?: boolean
}

function isInsideNestedDropdown(target: Node) {
  return (
    target instanceof Element &&
    target.closest(`[${DROPDOWN_NESTED_ATTR}]`) !== null
  )
}

export function DropdownMenu({
  open,
  onClose,
  anchorRef,
  children,
  className = 'min-w-40 rounded border border-slate-200 bg-white py-1 shadow-lg',
  align = 'start',
  nested = false,
}: DropdownMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        menuRef.current?.contains(target) ||
        anchorRef.current?.contains(target) ||
        isInsideNestedDropdown(target)
      ) {
        return
      }
      onClose()
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose, anchorRef])

  if (!open) {
    return null
  }

  const anchor = anchorRef.current
  const rect = anchor?.getBoundingClientRect()
  const top = rect ? rect.bottom + 4 : 0
  const left = rect ? (align === 'end' ? rect.right : rect.left) : 0

  return createPortal(
    <div
      ref={menuRef}
      className={className}
      {...(nested ? { [DROPDOWN_NESTED_ATTR]: '' } : {})}
      style={{
        position: 'fixed',
        top,
        left,
        transform: align === 'end' ? 'translateX(-100%)' : undefined,
        zIndex: nested ? 'var(--z-dropdown-nested)' : 'var(--z-dropdown)',
      }}
      role="menu"
    >
      {children}
    </div>,
    document.body,
  )
}
