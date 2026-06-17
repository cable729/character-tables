import { KernelManager, KernelMessage } from '@jupyterlab/services'
import type { Kernel } from '@jupyterlab/services'
import { makeServerSettings } from './connection'
import { findSageKernelSpecName } from './sageKernel'
import {
  formatJupyterError,
  formatSageOutput,
} from './formatSageKernelError'
import type { JupyterServerConfig, SageExecuteResult } from './types'

export { makeServerSettings } from './connection'

export class JupyterSageSession {
  private kernelManager: KernelManager | null = null
  private kernel: Kernel.IKernelConnection | null = null
  private sageSpecName: string | null = null
  private loadedSageLibRevision: string | null = null
  private executeGeneration = 0
  private activeFuture: Kernel.IShellFuture<
    KernelMessage.IExecuteRequestMsg,
    KernelMessage.IExecuteReplyMsg
  > | null = null

  get isConnected(): boolean {
    return this.kernel !== null && this.kernel.status !== 'dead'
  }

  get kernelSpecName(): string | null {
    return this.sageSpecName
  }

  async connect(config: JupyterServerConfig): Promise<void> {
    await this.disconnect()

    const serverSettings = makeServerSettings(config)
    const sageName = await findSageKernelSpecName(serverSettings)
    if (!sageName) {
      throw new Error('KERNEL_MISSING')
    }

    this.kernelManager = new KernelManager({ serverSettings })
    this.sageSpecName = sageName
    this.kernel = await this.kernelManager.startNew({ name: sageName })
    await this.kernel.info
    this.loadedSageLibRevision = null
  }

  async disconnect(): Promise<void> {
    if (this.kernel) {
      try {
        await this.kernel.shutdown()
      } catch {
        this.kernel.dispose()
      }
      this.kernel = null
    }
    if (this.kernelManager) {
      this.kernelManager.dispose()
      this.kernelManager = null
    }
    this.sageSpecName = null
    this.loadedSageLibRevision = null
  }

  /** Restart the Sage kernel (clears all in-kernel state). */
  async restartKernel(): Promise<void> {
    if (!this.kernel) {
      return
    }
    this.executeGeneration++
    if (this.activeFuture) {
      try {
        this.activeFuture.dispose()
      } catch {
        // ignore
      }
      this.activeFuture = null
    }
    await this.kernel.restart()
    await this.kernel.info
    this.loadedSageLibRevision = null
  }

  async interrupt(): Promise<void> {
    this.executeGeneration++
    if (this.activeFuture) {
      try {
        this.activeFuture.dispose()
      } catch {
        // ignore
      }
      this.activeFuture = null
    }
    if (this.kernel) {
      try {
        await this.kernel.interrupt()
      } catch {
        // ignore
      }
    }
  }

  async execute(
    code: string,
    options?: { timeoutMs?: number; sageLibRevision?: string },
  ): Promise<SageExecuteResult> {
    if (!this.kernel) {
      return {
        stdout: '',
        stderr: '',
        error: 'Not connected to a Sage kernel.',
        success: false,
      }
    }

    const rev = options?.sageLibRevision
    if (
      rev &&
      this.loadedSageLibRevision !== null &&
      this.loadedSageLibRevision !== rev
    ) {
      await this.restartKernel()
    }
    if (rev) {
      this.loadedSageLibRevision = rev
    }

    const generation = ++this.executeGeneration
    let stdout = ''
    let stderr = ''
    let error: string | null = null

    const future = this.kernel.requestExecute({ code })
    this.activeFuture = future

    future.onIOPub = (msg) => {
      if (KernelMessage.isStreamMsg(msg)) {
        if (msg.content.name === 'stdout') {
          stdout += msg.content.text
        } else if (msg.content.name === 'stderr') {
          stderr += msg.content.text
        }
      } else if (KernelMessage.isExecuteResultMsg(msg)) {
        const data = msg.content.data
        if (typeof data['text/plain'] === 'string') {
          stdout += data['text/plain']
        } else {
          stdout += JSON.stringify(data) + '\n'
        }
      } else if (KernelMessage.isErrorMsg(msg)) {
        error = formatJupyterError(msg.content)
      }
    }

    const timeoutMs = options?.timeoutMs ?? 20 * 60 * 1000

    try {
      const reply = await Promise.race([
        future.done,
        new Promise<null>((_, reject) => {
          setTimeout(
            () =>
              reject(
                new Error(
                  `Sage execution timed out after ${Math.round(timeoutMs / 1000)}s. Large expanded tables can take several minutes.`,
                ),
              ),
            timeoutMs,
          )
        }),
      ])
      if (reply && reply.content.status === 'error') {
        error = error ?? formatJupyterError(reply.content)
      }
    } catch (err) {
      error = err instanceof Error ? err.message : String(err)
    } finally {
      if (this.activeFuture === future) {
        this.activeFuture = null
      }
    }

    if (generation !== this.executeGeneration) {
      return {
        stdout: formatSageOutput(stdout),
        stderr: formatSageOutput(stderr),
        error: 'Cancelled',
        success: false,
        cancelled: true,
      }
    }

    return {
      stdout: formatSageOutput(stdout),
      stderr: formatSageOutput(stderr),
      error,
      success: error === null,
    }
  }

  async testSage(): Promise<SageExecuteResult> {
    return this.execute('print(factor(12))')
  }
}

export const jupyterSession = new JupyterSageSession()
