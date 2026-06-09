import { useEffect, useRef } from 'react'
import { INTERACTIVE_CELL_CURSOR } from '../tableCellStyles'

export type HeaderMenuItem = {
  id: string
  label: string
  disabled?: boolean
  variant?: 'default' | 'danger'
  onSelect: () => void
}

type HeaderMenuProps = {
  items: HeaderMenuItem[]
  onClose: () => void
  align?: 'left' | 'right'
}

export function HeaderMenu({
  items,
  onClose,
  align = 'right',
}: HeaderMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
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
  }, [onClose])

  return (
    <div
      ref={ref}
      className={`absolute top-full z-[var(--z-dropdown)] mt-0.5 min-w-[10rem] rounded-md border border-slate-200 bg-white py-1 shadow-lg ${
        align === 'right' ? 'right-0' : 'left-0'
      }`}
      role="menu"
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="menuitem"
          disabled={item.disabled}
          onClick={() => {
            item.onSelect()
            onClose()
          }}
          className={`block w-full px-3 py-1.5 text-left text-xs disabled:opacity-40 ${
            item.variant === 'danger'
              ? 'text-red-700 hover:bg-red-50'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

type SheetColumnHeaderProps = {
  colIndex: number
  selected: boolean
  menuOpen: boolean
  onSelect: () => void
  onToggleMenu: () => void
  onCloseMenu: () => void
  menuItems: HeaderMenuItem[]
}

export function SheetColumnHeader({
  colIndex,
  selected,
  menuOpen,
  onSelect,
  onToggleMenu,
  onCloseMenu,
  menuItems,
}: SheetColumnHeaderProps) {
  return (
    <th
      className={`sheet-col-header sticky top-0 z-[var(--z-sticky-corner)] border border-slate-300 p-0 ${
        selected
          ? 'bg-sky-600 text-white'
          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
      }`}
    >
      <div className="relative flex h-6 w-full items-stretch">
        <button
          type="button"
          onClick={onSelect}
          className={`min-w-0 flex-1 text-center text-[11px] font-medium tabular-nums ${INTERACTIVE_CELL_CURSOR} ${
            selected ? 'text-white' : 'text-slate-500'
          }`}
          title={`Column ${colIndex}`}
        >
          {colIndex}
        </button>
        {selected && (
          <div className="relative flex shrink-0 items-stretch border-l border-sky-500/40">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onToggleMenu()
              }}
              className="flex w-4 items-center justify-center text-[10px] text-white hover:bg-sky-700"
              title="Column actions"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              ▾
            </button>
            {menuOpen && (
              <HeaderMenu items={menuItems} onClose={onCloseMenu} align="right" />
            )}
          </div>
        )}
      </div>
    </th>
  )
}

type SheetRowHeaderProps = {
  rowIndex: number
  selected: boolean
  menuOpen: boolean
  onSelect: () => void
  onToggleMenu: () => void
  onCloseMenu: () => void
  menuItems: HeaderMenuItem[]
}

export function SheetRowHeader({
  rowIndex,
  selected,
  menuOpen,
  onSelect,
  onToggleMenu,
  onCloseMenu,
  menuItems,
}: SheetRowHeaderProps) {
  return (
    <th
      className={`sheet-row-header sticky left-0 z-[var(--z-sticky-corner)] border border-slate-300 p-0 ${
        selected
          ? 'bg-sky-600 text-white'
          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
      }`}
    >
      <div className="relative flex h-full w-full flex-col items-stretch">
        <button
          type="button"
          onClick={onSelect}
          className={`flex min-h-[1.5rem] flex-1 items-center justify-center text-[11px] font-medium tabular-nums ${INTERACTIVE_CELL_CURSOR} ${
            selected ? 'text-white' : 'text-slate-500'
          }`}
          title={`Row ${rowIndex}`}
        >
          {rowIndex}
        </button>
        {selected && (
          <div className="relative border-t border-sky-500/40">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onToggleMenu()
              }}
              className="flex h-4 w-full items-center justify-center text-[10px] text-white hover:bg-sky-700"
              title="Row actions"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              ▸
            </button>
            {menuOpen && (
              <HeaderMenu items={menuItems} onClose={onCloseMenu} align="left" />
            )}
          </div>
        )}
      </div>
    </th>
  )
}

export function SheetCornerHeader() {
  return (
    <th
      className="sheet-corner-header sticky left-0 top-0 z-[var(--z-sticky-corner)] h-6 border border-slate-300 bg-slate-100 p-0"
      aria-hidden
    />
  )
}

export function SheetRowCorner() {
  return (
    <th
      className="sheet-row-header sticky left-0 z-[var(--z-sticky-corner)] border border-slate-300 bg-slate-100 p-0"
      aria-hidden
    />
  )
}
