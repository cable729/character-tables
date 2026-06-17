import { create } from 'zustand'
import { probeJupyterServerDetailed } from '../jupyter/connection'
import {
  loadStoredJupyterConfig,
  loadStoredJupyterPasteUrl,
  parseJupyterConnectionInput,
  probeFailureMessage,
  saveJupyterConfig,
} from '../jupyter/detect'
import { jupyterServerConfigSnippet } from '../jupyter/origin'
import { jupyterSession } from '../jupyter/client'
import { sageLibRevision } from '../sage/sageLibModules'
import type {
  JupyterConnectionStatus,
  SageExecuteResult,
} from '../jupyter/types'

interface JupyterState {
  status: JupyterConnectionStatus
  statusMessage: string
  jupyterUrl: string
  sageKernelName: string | null
  lastTestResult: SageExecuteResult | null
  showManualForm: boolean
  jupyterConfigSnippet: string

  setManualFormOpen: (open: boolean) => void
  setJupyterUrl: (url: string) => void
  tryReconnect: () => Promise<void>
  connectManual: () => Promise<void>
  connectFromClipboard: () => Promise<void>
  disconnect: () => Promise<void>
  testSage: () => Promise<void>
  executeSage: (code: string) => Promise<SageExecuteResult>
  cancelSageExecution: () => Promise<void>
}

function mapConnectError(err: unknown): {
  status: JupyterConnectionStatus
  message: string
} {
  const msg = err instanceof Error ? err.message : String(err)
  if (msg === 'KERNEL_MISSING') {
    return {
      status: 'kernel_missing',
      message:
        'Jupyter is reachable but no Sage/SageMath kernel spec was found. Install a Sage kernel and restart Jupyter.',
    }
  }
  if (/401|403|unauthorized|forbidden/i.test(msg)) {
    return {
      status: 'auth_failed',
      message:
        'Authentication failed. Paste the full URL from `jupyter server list` (includes ?token=…).',
    }
  }
  return { status: 'error', message: msg || 'Connection failed.' }
}

async function validateAndConnect(
  pasteUrl: string,
  set: (partial: Partial<JupyterState>) => void,
): Promise<void> {
  const config = parseJupyterConnectionInput(pasteUrl)

  if (!config.baseUrl) {
    set({
      status: 'error',
      statusMessage:
        'Enter the full URL from `jupyter server list` (http://localhost:8888/…?token=…).',
      showManualForm: true,
    })
    return
  }

  if (!config.token) {
    set({
      status: 'auth_failed',
      statusMessage:
        'No token in URL. Paste the full line from `jupyter server list` (must include ?token=…).',
      showManualForm: true,
    })
    return
  }

  set({ status: 'connecting', statusMessage: 'Connecting…', lastTestResult: null })

  const probe = await probeJupyterServerDetailed(config)
  if (!probe.ok) {
    const mapped = probeFailureMessage(probe, config)
    set({
      status: mapped.status,
      statusMessage: mapped.message,
      showManualForm: true,
      jupyterConfigSnippet: jupyterServerConfigSnippet(),
    })
    return
  }

  try {
    await jupyterSession.connect(config)
    saveJupyterConfig(config, pasteUrl)
    set({
      status: 'connected',
      statusMessage: `Connected (${jupyterSession.kernelSpecName})`,
      jupyterUrl: pasteUrl.trim(),
      sageKernelName: jupyterSession.kernelSpecName,
      showManualForm: false,
    })
  } catch (err) {
    const mapped = mapConnectError(err)
    set({
      status: mapped.status,
      statusMessage: mapped.message,
      showManualForm: true,
    })
  }
}

export const useJupyterStore = create<JupyterState>((set, get) => ({
  status: 'disconnected',
  statusMessage:
    'Paste the full URL from `jupyter server list`, then click Connect.',
  jupyterUrl: '',
  sageKernelName: null,
  lastTestResult: null,
  showManualForm: false,
  jupyterConfigSnippet: jupyterServerConfigSnippet(),

  setManualFormOpen: (open) => set({ showManualForm: open }),
  setJupyterUrl: (url) => set({ jupyterUrl: url }),

  tryReconnect: async () => {
    const stored = loadStoredJupyterConfig()
    if (stored) {
      const pasteUrl = loadStoredJupyterPasteUrl() ?? get().jupyterUrl
      await validateAndConnect(pasteUrl, set)
      return
    }
    const { jupyterUrl } = get()
    if (jupyterUrl.includes('token=')) {
      await validateAndConnect(jupyterUrl, set)
      return
    }
    set({
      status: 'auth_failed',
      statusMessage:
        'Paste the full URL from `jupyter server list`, then click Connect.',
    })
  },

  connectManual: async () => {
    await validateAndConnect(get().jupyterUrl, set)
  },

  connectFromClipboard: async () => {
    try {
      const text = await navigator.clipboard.readText()
      set({ jupyterUrl: text.trim() })
      await validateAndConnect(text.trim(), set)
    } catch {
      set({
        status: 'error',
        statusMessage: 'Could not read clipboard. Paste the URL manually.',
        showManualForm: true,
      })
    }
  },

  disconnect: async () => {
    await jupyterSession.disconnect()
    set({
      status: 'disconnected',
      statusMessage: 'Disconnected',
      sageKernelName: null,
      lastTestResult: null,
    })
  },

  testSage: async () => {
    const { status } = get()
    if (status !== 'connected') {
      set({ statusMessage: 'Connect to Jupyter before testing Sage.' })
      return
    }
    set({ statusMessage: 'Running test…' })
    const result = await jupyterSession.testSage()
    set({
      lastTestResult: result,
      statusMessage: result.success
        ? `Test OK: ${result.stdout.trim() || '(no output)'}`
        : `Test failed: ${result.error ?? result.stderr}`,
    })
  },

  executeSage: async (code) => {
    const { status } = get()
    if (status !== 'connected') {
      return {
        stdout: '',
        stderr: '',
        error: 'Connect to a local Jupyter Sage kernel first.',
        success: false,
      }
    }
    return jupyterSession.execute(code, { sageLibRevision: sageLibRevision() })
  },

  cancelSageExecution: async () => {
    await jupyterSession.interrupt()
  },
}))
