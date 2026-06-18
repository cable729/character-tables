type ReadonlyProjectBannerProps = {
  onMakeCopy: () => void
}

export function ReadonlyProjectBanner({ onMakeCopy }: ReadonlyProjectBannerProps) {
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-amber-950">
          This is a prepackaged project (read-only). Make a copy to edit.
        </p>
        <button
          type="button"
          onClick={onMakeCopy}
          className="shrink-0 rounded bg-amber-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-800"
        >
          Make a copy
        </button>
      </div>
    </div>
  )
}
