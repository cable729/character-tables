import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CharacterTable } from '../types/characterTable'
import { parseTableYaml, tableToYaml } from '../schema/yamlTable'
import { ut4Example, ut4Yaml } from '../data/ut4Example'

const STORAGE_KEY = 'character-table-v4'

export const defaultTable: CharacterTable = ut4Example

type TableStore = {
  table: CharacterTable
  showEditor: boolean
  editorText: string
  editorError: string | null

  setTable: (table: CharacterTable) => void
  setShowEditor: (show: boolean) => void
  setEditorText: (text: string) => void
  applyEditor: () => boolean
  loadExample: (table: CharacterTable, yaml?: string) => void
}

export const useTableStore = create<TableStore>()(
  persist(
    (set, get) => ({
      table: defaultTable,
      showEditor: false,
      editorText: ut4Yaml.trim(),
      editorError: null,

      setTable: (table) =>
        set({ table, editorText: tableToYaml(table), editorError: null }),

      setShowEditor: (showEditor) => set({ showEditor }),

      setEditorText: (editorText) => set({ editorText, editorError: null }),

      applyEditor: () => {
        try {
          const table = parseTableYaml(get().editorText)
          set({ table, editorError: null })
          return true
        } catch (err) {
          set({
            editorError: err instanceof Error ? err.message : String(err),
          })
          return false
        }
      },

      loadExample: (table, yaml) =>
        set({
          table,
          editorText: yaml?.trim() ?? tableToYaml(table),
          editorError: null,
        }),
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        table: state.table,
        editorText: state.editorText,
      }),
    },
  ),
)
