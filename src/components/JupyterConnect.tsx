import { useEffect, useRef } from 'react'
import {
  JUPYTER_URL_PASTE_EXAMPLE,
  JUPYTER_URL_PASTE_HELP,
} from '../jupyter/configSnippet'
import { loadStoredJupyterPasteUrl } from '../jupyter/detect'
import { useJupyterStore } from '../store/jupyterStore'
import type { JupyterConnectionStatus } from '../jupyter/types'

const STATUS_DOT: Record<JupyterConnectionStatus, string> = {
  disconnected: 'bg-slate-400',
  connecting: 'bg-amber-400 animate-pulse',
  connected: 'bg-emerald-500',
  auth_failed: 'bg-red-500',
  server_unreachable: 'bg-red-500',
  kernel_missing: 'bg-orange-500',
  error: 'bg-red-500',
}

export function JupyterConnect() {
  const status = useJupyterStore((s) => s.status)
  const statusMessage = useJupyterStore((s) => s.statusMessage)
  const jupyterUrl = useJupyterStore((s) => s.jupyterUrl)
  const showManualForm = useJupyterStore((s) => s.showManualForm)
  const lastTestResult = useJupyterStore((s) => s.lastTestResult)
  const tryReconnect = useJupyterStore((s) => s.tryReconnect)
  const connectManual = useJupyterStore((s) => s.connectManual)
  const connectFromClipboard = useJupyterStore((s) => s.connectFromClipboard)
  const disconnect = useJupyterStore((s) => s.disconnect)
  const testSage = useJupyterStore((s) => s.testSage)
  const setManualFormOpen = useJupyterStore((s) => s.setManualFormOpen)
  const setJupyterUrl = useJupyterStore((s) => s.setJupyterUrl)
  const jupyterConfigSnippet = useJupyterStore((s) => s.jupyterConfigSnippet)

  const bootstrapped = useRef(false)

  useEffect(() => {
    if (bootstrapped.current) return
    bootstrapped.current = true

    const stored = loadStoredJupyterPasteUrl()
    if (stored) {
      setJupyterUrl(stored)
    }
    void tryReconnect()
  }, [tryReconnect, setJupyterUrl])

  const isConnected = status === 'connected'
  const isConnecting = status === 'connecting'

  return (
    <div className="relative flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <span
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700"
          title={statusMessage}
        >
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[status]}`}
            aria-hidden
          />
          <span className="max-w-[20rem] truncate">{statusMessage}</span>
        </span>

        {!isConnected && (
          <button
            type="button"
            disabled={isConnecting}
            onClick={() => void tryReconnect()}
            className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {isConnecting ? 'Connecting…' : 'Reconnect'}
          </button>
        )}

        <button
          type="button"
          onClick={() => setManualFormOpen(!showManualForm)}
          className="rounded bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
        >
          {showManualForm ? 'Hide settings' : 'Server settings'}
        </button>

        {isConnected && (
          <>
            <button
              type="button"
              onClick={() => void testSage()}
              className="rounded bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              Test Sage
            </button>
            <button
              type="button"
              onClick={() => void disconnect()}
              className="rounded bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              Disconnect
            </button>
          </>
        )}
      </div>

      {showManualForm && (
        <div className="w-full min-w-[300px] max-w-lg rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
          <p className="mb-2 text-xs text-slate-600">
            <strong>Step 1 (once):</strong> add the Jupyter config below to{' '}
            <code className="text-[10px]">~/.jupyter/jupyter_server_config.py</code>{' '}
            (no leading dot) and restart Sage/Jupyter.
          </p>
          <label className="mb-3 block text-xs font-medium text-slate-700">
            Jupyter config (copy → ~/.jupyter/jupyter_server_config.py)
            <textarea
              readOnly
              rows={11}
              value={jupyterConfigSnippet}
              className="mt-1 w-full rounded border border-amber-200 bg-amber-50 px-2 py-1.5 font-mono text-[10px] leading-relaxed text-slate-800"
              onFocus={(e) => e.target.select()}
            />
          </label>
          <p className="mb-2 text-xs text-slate-600">
            <strong>Step 2:</strong> run{' '}
            <code className="rounded bg-slate-100 px-1 text-[10px]">
              jupyter server list
            </code>{' '}
            — {JUPYTER_URL_PASTE_HELP}
          </p>
          <label className="mb-3 block text-xs font-medium text-slate-700">
            Jupyter URL
            <input
              type="text"
              value={jupyterUrl}
              onChange={(e) => setJupyterUrl(e.target.value)}
              placeholder={JUPYTER_URL_PASTE_EXAMPLE}
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm font-mono"
            />
          </label>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={isConnecting}
              onClick={() => void connectManual()}
              className="w-full rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              Connect
            </button>
            <button
              type="button"
              disabled={isConnecting}
              onClick={() => void connectFromClipboard()}
              className="w-full rounded bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-60"
            >
              Paste from clipboard
            </button>
          </div>
        </div>
      )}

      {lastTestResult && (
        <pre
          className={`max-w-md overflow-x-auto rounded border p-2 text-left text-xs ${
            lastTestResult.success
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-red-200 bg-red-50 text-red-900'
          }`}
        >
          {lastTestResult.success
            ? lastTestResult.stdout || '(ok, no stdout)'
            : lastTestResult.error ?? lastTestResult.stderr}
        </pre>
      )}
    </div>
  )
}
