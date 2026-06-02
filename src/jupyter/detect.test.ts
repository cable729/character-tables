import { describe, expect, it } from 'vitest'
import {
  formatJupyterUrlForDisplay,
  normalizeBaseUrl,
  parseJupyterConnectionInput,
} from './detect'

describe('normalizeBaseUrl', () => {
  it('adds trailing slash', () => {
    expect(normalizeBaseUrl('http://localhost:8888')).toBe(
      'http://localhost:8888/',
    )
  })
})

describe('parseJupyterConnectionInput', () => {
  it('extracts origin and token from Lab URL', () => {
    const config = parseJupyterConnectionInput(
      'http://localhost:8888/lab/tree/foo.ipynb?token=abc123',
    )
    expect(config.baseUrl).toBe('http://localhost:8888/')
    expect(config.token).toBe('abc123')
  })

  it('parses jupyter server list output', () => {
    const config = parseJupyterConnectionInput(
      'http://localhost:8888/?token=abc :: /home/user',
    )
    expect(config.baseUrl).toBe('http://localhost:8888/')
    expect(config.token).toBe('abc')
  })
})

describe('formatJupyterUrlForDisplay', () => {
  it('rebuilds URL with token', () => {
    expect(
      formatJupyterUrlForDisplay({
        baseUrl: 'http://localhost:8888/',
        token: 'abc',
      }),
    ).toBe('http://localhost:8888/?token=abc')
  })
})
