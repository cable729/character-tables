/**
 * Global stacking order. Keep table sticky headers at or below `stickyCorner`.
 * Modals and portaled overlays must use `modal` or higher.
 */
export const Z = {
  sticky: 20,
  stickyHeader: 30,
  stickyCorner: 40,
  dropdown: 50,
  fab: 60,
  modal: 100,
} as const

export type ZLayer = (typeof Z)[keyof typeof Z]
