import { useState } from 'react'
import { ProjectControls } from './ProjectControls'
import { SageChecksPanel } from './SageChecksPanel'
import { SplitHeaderPanel } from './SplitHeaderPanel'
import { HistoryControls } from './HistoryControls'

type AppSidebarProps = {
  table: import('../types/characterTable').CharacterTable
}

export function AppSidebar({ table }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  if (collapsed) {
    return (
      <aside className="flex w-10 shrink-0 flex-col border-r border-slate-200 bg-slate-50">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          title="Expand sidebar"
          className="p-2 text-slate-600 hover:bg-slate-100"
        >
          ›
        </button>
      </aside>
    )
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col gap-3 overflow-y-auto border-r border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Tools
        </span>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          title="Collapse sidebar"
          className="rounded px-1 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
        >
          ‹
        </button>
      </div>
      <ProjectControls />
      <HistoryControls />
      <SplitHeaderPanel />
      <SageChecksPanel table={table} />
    </aside>
  )
}
