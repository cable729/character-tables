import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { DEFAULT_CHECK_Q_VALUES, type SageCheckScope } from '../../checks/registry'
import {
  defaultSelectedQ,
  intersectSelectedQ,
} from '../../checks/sageRunPlan'
import {
  clampConsoleHeight,
  CONSOLE_DEFAULT_HEIGHT,
  CONSOLE_STORAGE_KEY,
} from './constants'
import { parseQValuesInput } from './parseQValues'

type ConsolePrefs = {
  expanded: boolean
  panelHeight: number
  qPoolInput: string
  selectedQ: number[]
  checkScope: SageCheckScope
}

function loadConsolePrefs(): ConsolePrefs {
  const defaults: ConsolePrefs = {
    expanded: false,
    panelHeight: CONSOLE_DEFAULT_HEIGHT,
    qPoolInput: DEFAULT_CHECK_Q_VALUES.join(', '),
    selectedQ: [2, 3],
    checkScope: 'verifier',
  }
  try {
    const raw = sessionStorage.getItem(CONSOLE_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ConsolePrefs>
      const qPoolInput =
        typeof parsed.qPoolInput === 'string'
          ? parsed.qPoolInput
          : defaults.qPoolInput
      const pool = parseQValuesInput(qPoolInput)
      const selectedQ = Array.isArray(parsed.selectedQ)
        ? intersectSelectedQ(pool, parsed.selectedQ)
        : defaultSelectedQ(pool)
      const legacyScopeRaw = (parsed as { checkScope?: string }).checkScope
      const legacyScope: SageCheckScope =
        legacyScopeRaw === 'all' || legacyScopeRaw === 'diagnostics'
          ? 'diagnostics'
          : legacyScopeRaw === 'quick'
            ? 'verifier'
            : 'verifier'
      return {
        expanded: Boolean(parsed.expanded),
        panelHeight: clampConsoleHeight(
          typeof parsed.panelHeight === 'number'
            ? parsed.panelHeight
            : CONSOLE_DEFAULT_HEIGHT,
        ),
        qPoolInput,
        selectedQ:
          selectedQ.length > 0 ? selectedQ : defaultSelectedQ(pool),
        checkScope: legacyScope,
      }
    }
  } catch {
    // ignore invalid storage
  }
  return defaults
}

export function useSessionPrefs() {
  const initialPrefs = useMemo(() => loadConsolePrefs(), [])
  const [expanded, setExpanded] = useState(initialPrefs.expanded)
  const [panelHeight, setPanelHeight] = useState(initialPrefs.panelHeight)
  const [qPoolInput, setQPoolInput] = useState(initialPrefs.qPoolInput)
  const [selectedQ, setSelectedQ] = useState<number[]>(initialPrefs.selectedQ)
  const [checkScope, setCheckScope] = useState<SageCheckScope>(
    initialPrefs.checkScope,
  )

  const qPool = useMemo(() => parseQValuesInput(qPoolInput), [qPoolInput])
  const qList = useMemo(
    () => intersectSelectedQ(qPool, selectedQ),
    [qPool, selectedQ],
  )

  useEffect(() => {
    setSelectedQ((prev) => {
      const next = intersectSelectedQ(qPool, prev)
      return next.length > 0 ? next : defaultSelectedQ(qPool)
    })
  }, [qPool])

  useEffect(() => {
    sessionStorage.setItem(
      CONSOLE_STORAGE_KEY,
      JSON.stringify({
        expanded,
        panelHeight,
        qPoolInput,
        selectedQ,
        checkScope,
      }),
    )
  }, [expanded, panelHeight, qPoolInput, selectedQ, checkScope])

  const toggleSelectedQ = useCallback(
    (q: number): void => {
      setSelectedQ((prev) => {
        const set = new Set(prev)
        if (set.has(q)) {
          set.delete(q)
        } else {
          set.add(q)
        }
        const next = intersectSelectedQ(qPool, [...set])
        return next.length > 0 ? next : defaultSelectedQ(qPool)
      })
    },
    [qPool],
  )

  const handleResizeStart = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      e.preventDefault()
      const startY = e.clientY
      const startHeight = panelHeight

      const onMove = (ev: PointerEvent) => {
        ev.preventDefault()
        const delta = startY - ev.clientY
        setPanelHeight(clampConsoleHeight(startHeight + delta))
      }
      const onUp = () => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
      }
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [panelHeight],
  )

  return {
    expanded,
    setExpanded,
    panelHeight,
    qPoolInput,
    setQPoolInput,
    checkScope,
    setCheckScope,
    qPool,
    qList,
    toggleSelectedQ,
    handleResizeStart,
  }
}
