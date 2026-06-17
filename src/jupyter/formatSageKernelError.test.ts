import { describe, expect, it } from 'vitest'
import {
  formatJupyterError,
  formatSageOutput,
  stripAnsi,
} from './formatSageKernelError'

describe('stripAnsi', () => {
  it('removes IPython SGR sequences', () => {
    const raw =
      '\u001b[0;31mNameError\u001b[0m: name \u001b[38;5;124mG\u001b[0m is not defined'
    expect(stripAnsi(raw)).toBe('NameError: name G is not defined')
  })
})

describe('formatJupyterError', () => {
  it('joins stripped traceback lines with newlines', () => {
    const formatted = formatJupyterError({
      traceback: [
        '\u001b[0;31m---------------------------------------------------------------------------\u001b[0m',
        '\u001b[0;31mNameError\u001b[0m Traceback (most recent call last)',
        'Cell \u001b[0;32mIn[1], line 1029\u001b[0m',
        '\u001b[0;31mNameError\u001b[0m: name \'G\' is not defined',
      ],
    })
    expect(formatted).toContain('---------------------------------------------------------------------------')
    expect(formatted).toContain('NameError Traceback')
    expect(formatted).toContain('Cell In[1], line 1029')
    expect(formatted).toContain("NameError: name 'G' is not defined")
    expect(formatted).not.toMatch(/\u001b\[[0-9;]*m/)
  })

  it('falls back to ename and evalue when traceback is empty', () => {
    expect(
      formatJupyterError({
        ename: 'NameError',
        evalue: "name 'G' is not defined",
      }),
    ).toBe("NameError: name 'G' is not defined")
  })
})

describe('formatSageOutput', () => {
  it('strips ANSI from stream text', () => {
    expect(formatSageOutput('\u001b[1;32mok\u001b[0m\n')).toBe('ok\n')
  })
})
