import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CharacterTable } from '../types/characterTable'
import { parseTableYaml, tableToYaml } from '../schema/yamlTable'
import blankYaml from '../examples/blank-ut-template.yaml?raw'

const STORAGE_KEY = 'character-table-v3'

export const defaultTable: CharacterTable = parseTableYaml(blankYaml)

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
      editorText: blankYaml.trim(),
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
