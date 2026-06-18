import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { inferGroupSpec } from '../groups/groupSpec'
import { fillMissingExpansionCounts } from '../schema/fillMissingExpansionCounts'
import { isSupercharacterTable } from '../schema/tableSchema'
import { useTableStore } from '../store/tableStore'
import { GroupPicker } from './GroupPicker'
import { JupyterSettingsSection } from './settings/JupyterSettingsSection'

type SettingsDrawerProps = {
  open: boolean
  onClose: () => void
}

function SettingsSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="border-b border-slate-200 py-4 last:border-b-0">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      {children}
    </section>
  )
}

export function SettingsDrawer({ open, onClose }: SettingsDrawerProps) {
  const project = useTableStore((s) => s.project)
  const table = useTableStore((s) => s.table)
  const setTable = useTableStore((s) => s.setTable)
  const setProjectGroup = useTableStore((s) => s.setProjectGroup)

  const groupSpec = inferGroupSpec(table)
  const superTable = isSupercharacterTable(table)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[var(--z-modal)] flex justify-end">
      <button
        type="button"
        aria-label="Close settings"
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />
      <aside
        className="relative flex h-full w-full max-w-md flex-col bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-base font-semibold text-slate-900">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4">
          {project.readonly && (
            <p className="border-b border-slate-200 py-4 text-sm text-slate-600">
              The active project is read-only. Use <strong>Make a copy</strong>{' '}
              in the header to edit group or table type settings.
            </p>
          )}

          <SettingsSection title="Group">
            <GroupPicker
              key={project.id}
              initialSpec={groupSpec}
              actionLabel="Apply"
              onSubmit={(spec) => {
                if (project.readonly) return
                setProjectGroup(spec)
              }}
            />
          </SettingsSection>

          <SettingsSection title="Table type">
            <fieldset
              className="flex flex-col gap-2 text-sm"
              disabled={project.readonly}
            >
              <legend className="sr-only">Table type</legend>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="table-type"
                  checked={!superTable}
                  disabled={project.readonly}
                  onChange={() => {
                    if (!superTable || project.readonly) return
                    setTable(fillMissingExpansionCounts({ ...table, tableType: 'character' }))
                  }}
                />
                <span>Character table</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="table-type"
                  checked={superTable}
                  disabled={project.readonly}
                  onChange={() => {
                    if (superTable || project.readonly) return
                    setTable({ ...table, tableType: 'supercharacter' })
                  }}
                />
                <span>Supercharacter table</span>
              </label>
            </fieldset>
          </SettingsSection>

          <SettingsSection title="Sage / Jupyter">
            <JupyterSettingsSection />
          </SettingsSection>
        </div>
      </aside>
    </div>,
    document.body,
  )
}
