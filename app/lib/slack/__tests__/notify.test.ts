import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { notifySlack } from '../notify'

const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

beforeEach(() => {
  warnSpy.mockClear()
  errSpy.mockClear()
  // Wipe all SLACK_WEBHOOK_* env vars for a clean slate.
  for (const k of Object.keys(process.env)) {
    if (k.startsWith('SLACK_WEBHOOK_')) delete process.env[k]
  }
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('slack/notify', () => {
  it('warns and skips when the channel env var is missing', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await notifySlack({ channel: 'errors', text: 'hi' })
    expect(fetchMock).not.toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalled()
    expect(String(warnSpy.mock.calls[0][0])).toContain('SLACK_WEBHOOK_ERRORS')
  })

  it('POSTs to configured webhook URL with a JSON text body', async () => {
    process.env.SLACK_WEBHOOK_SALES = 'https://hooks.slack.test/ABC'
    const fetchMock = vi.fn(async () => ({ ok: true, status: 200, text: async () => '' }))
    vi.stubGlobal('fetch', fetchMock)
    await notifySlack({ channel: 'sales', text: 'deal closed' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const call = (fetchMock.mock.calls as unknown as any[][])[0]
    expect(call[0]).toBe('https://hooks.slack.test/ABC')
    expect(call[1].method).toBe('POST')
    expect(JSON.parse(call[1].body as string)).toEqual({ text: 'deal closed' })
  })

  it('includes blocks in the payload when provided', async () => {
    process.env.SLACK_WEBHOOK_CHANGELOG = 'https://hooks.slack.test/X'
    const fetchMock = vi.fn(async () => ({ ok: true, status: 200, text: async () => '' }))
    vi.stubGlobal('fetch', fetchMock)
    await notifySlack({ channel: 'changelog', text: 'shipped', blocks: [{ type: 'section' }] })
    const body = JSON.parse(((fetchMock.mock.calls as unknown as any[][])[0][1]).body as string)
    expect(body).toEqual({ text: 'shipped', blocks: [{ type: 'section' }] })
  })

  it('logs an error but does not throw when webhook returns non-ok', async () => {
    process.env.SLACK_WEBHOOK_ERRORS = 'https://hooks.slack.test/ERR'
    const fetchMock = vi.fn(async () => ({ ok: false, status: 500, text: async () => 'bad' }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(notifySlack({ channel: 'errors', text: 'x' })).resolves.toBeUndefined()
    expect(errSpy).toHaveBeenCalled()
  })

  it('logs an error but does not throw when fetch rejects', async () => {
    process.env.SLACK_WEBHOOK_DEMOS = 'https://hooks.slack.test/D'
    const fetchMock = vi.fn(async () => { throw new Error('network down') })
    vi.stubGlobal('fetch', fetchMock)
    await expect(notifySlack({ channel: 'demos', text: 'x' })).resolves.toBeUndefined()
    expect(errSpy).toHaveBeenCalled()
  })
})
