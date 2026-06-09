import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

type DropdownMenuProps = {
  open: boolean
  onClose: () => void
  anchorRef: React.RefObject<HTMLElement | null>
  children: ReactNode
  className?: string
}

export function DropdownMenu({
  open,
  onClose,
  anchorRef,
  children,
  className = 'min-w-40 rounded border border-slate-200 bg-white py-1 shadow-lg',
}: DropdownMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        menuRef.current?.contains(target) ||
        anchorRef.current?.contains(target)
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
  const left = rect ? rect.left : 0

  return createPortal(
    <div
      ref={menuRef}
      className={className}
      style={{
        position: 'fixed',
        top,
        left,
        zIndex: 'var(--z-dropdown)',
      }}
      role="menu"
    >
      {children}
    </div>,
    document.body,
  )
}
