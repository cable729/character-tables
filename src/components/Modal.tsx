import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

type ModalProps = {
  open: boolean
  onClose: () => void
  children: ReactNode
  /** Applied to the panel (not the backdrop). */
  panelClassName?: string
  title?: string
  titleId?: string
  /** Backdrop click closes the modal when true (default). */
  closeOnBackdrop?: boolean
}

const defaultPanelClass =
  'w-full max-w-md rounded-lg border border-slate-200 bg-white p-4 shadow-xl'

export function Modal({
  open,
  onClose,
  children,
  panelClassName = defaultPanelClass,
  title,
  titleId = 'modal-title',
  closeOnBackdrop = true,
}: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) {
    return null
  }

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/30 p-4"
      style={{ zIndex: 'var(--z-modal)' }}
      onMouseDown={closeOnBackdrop ? onClose : undefined}
      role="presentation"
    >
      <div
        className={panelClassName}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {title && (
          <h2
            id={titleId}
            className="mb-3 text-base font-semibold text-slate-900"
          >
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>,
    document.body,
  )
}
