import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CharacterTable, GroupSpec, HeaderSpec } from '../types/characterTable'
import {
  createDefaultCatalog,
  type ProjectCatalog,
} from '../types/projectCatalog'
import type { TableEditOp } from '../types/tableEditOp'
import { createCatalogActions } from './catalogActions'
import { createCheckpointActions } from './checkpointActions'
import { createHistoryActions } from './historyActions'
import { createTableEditActions } from './tableEditActions'
import { createYamlActions } from './yamlActions'
import {
  activeDerivedState,
  migrateCatalog,
  type TableStoreState,
} from './storeHelpers'

const STORAGE_KEY = 'character-table-v7'
const LEGACY_STORAGE_KEY = 'character-table-v6'

export const defaultCatalog: ProjectCatalog = createDefaultCatalog()

type TableStore = TableStoreState & {
  setTable: (table: CharacterTable) => void
  dispatchOp: (op: TableEditOp) => void
  undo: () => void
  redo: () => void
  saveActiveCheckpoint: () => void
  saveCheckpointAs: (name: string) => void
  saveCheckpoint: (name: string) => void
  loadCheckpoint: (id: string, options?: { discardDirty?: boolean }) => boolean
  deleteCheckpoint: (id: string) => void
  renameCheckpoint: (id: string, name: string) => void
  setCompactMath: (compact: boolean) => void
  importYaml: (text: string) => void
  exportSnapshotYaml: () => string
  exportProjectYaml: () => string
  applySplitBelowLabel: (args: {
    axis: 'rows' | 'columns'
    sourceId: string
    belowLabel: string
  }) => void
  applyCombineHeaders: (args: {
    axis: 'rows' | 'columns'
    sourceIds: string[]
    method: 'sum' | 'identical'
  }) => { axis: 'rows' | 'columns'; index: number } | undefined
  insertRow: (index: number, position: 'above' | 'below') => void
  removeRows: (indices: number[]) => void
  insertColumn: (index: number, position: 'before' | 'after') => void
  removeColumns: (indices: number[]) => void
  setRowHeader: (index: number, after: HeaderSpec) => void
  setColumnHeader: (index: number, after: HeaderSpec) => void
  setActiveProject: (projectId: string) => void
  createProjectFromPreset: (presetId: string) => void
  createProjectFromGroup: (spec: GroupSpec) => void
  setProjectGroup: (spec: GroupSpec) => void
  setGroupOrder: (groupOrder: string) => void
  duplicateActiveProject: () => void
  copyReadonlyProject: () => void
  deleteActiveProject: () => void
  deleteProject: (projectId: string) => void
  renameActiveProject: (title: string) => void
  renameProject: (projectId: string, title: string) => void
}

export const useTableStore = create<TableStore>()(
  persist(
    (set, get) => ({
      catalog: defaultCatalog,
      ...activeDerivedState(defaultCatalog),
      editorError: null,

      ...createHistoryActions(set, get),
      ...createCheckpointActions(set, get),
      ...createYamlActions(set, get),
      ...createTableEditActions(set, get),
      ...createCatalogActions(set, get),
    }),
    {
      name: STORAGE_KEY,
      version: 2,
      migrate: (persisted, version) => {
        const state = persisted as Record<string, unknown>
        if (state.catalog) {
          let catalog = state.catalog as ProjectCatalog
          if (version < 2) {
            catalog = migrateCatalog(catalog)
          } else {
            catalog = migrateCatalog(catalog)
          }
          return {
            catalog,
            ...activeDerivedState(catalog),
            editorError: null,
          }
        }
        return persisted
      },
      partialize: (state) => ({
        catalog: state.catalog,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.catalog) {
          state.catalog = migrateCatalog(state.catalog)
          Object.assign(state, activeDerivedState(state.catalog))
        }
      },
    },
  ),
)

/** Migrate legacy v6 localStorage if v7 is empty on first load. */
export function migrateLegacyStorageIfNeeded(): void {
  if (localStorage.getItem(STORAGE_KEY)) {
    return
  }
  const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)
  if (!legacy) {
    return
  }
  try {
    const parsed = JSON.parse(legacy) as {
      state?: { catalog?: ProjectCatalog }
      version?: number
    }
    const catalog = parsed.state?.catalog
    if (!catalog) {
      return
    }
    const migrated = migrateCatalog(catalog)
    const payload = {
      state: { catalog: migrated },
      version: 2,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // ignore corrupt legacy storage
  }
}
