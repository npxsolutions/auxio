// Thin fetch wrapper used by channel clients. Adds a 30s timeout, retries 5xx
// and 429 responses with exponential backoff, and surfaces HTTP status on the
// error object so outer rate-limit wrappers can react. Logs with a consistent
// [sync:http] prefix.

export interface SyncHttpOptions extends RequestInit {
  timeoutMs?: number
  retries?: number
  label?: string
}

export class SyncHttpError extends Error {
  status: number
  body: string
  constructor(status: number, body: string, message?: string) {
    super(message || `HTTP ${status}`)
    this.status = status
    this.body = body
  }
}

export async function syncFetch(url: string, opts: SyncHttpOptions = {}): Promise<Response> {
  const { timeoutMs = 30_000, retries = 2, label = 'syncFetch', ...init } = opts
  let attempt = 0
  const start = Date.now()
  while (true) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(url, { ...init, signal: controller.signal })
      clearTimeout(timer)
      if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
        if (attempt < retries) {
          const delay = 300 * Math.pow(2, attempt) + Math.random() * 200
          await new Promise(r => setTimeout(r, delay))
          attempt++
          continue
        }
        const body = await res.text().catch(() => '')
        console.error(`[sync:http] ${label} ${res.status} after ${Date.now() - start}ms`)
        throw new SyncHttpError(res.status, body)
      }
      return res
    } catch (err: unknown) {
      clearTimeout(timer)
      if (err instanceof SyncHttpError) throw err
      if (attempt < retries) {
        const delay = 300 * Math.pow(2, attempt) + Math.random() * 200
        await new Promise(r => setTimeout(r, delay))
        attempt++
        continue
      }
      console.error(`[sync:http] ${label} network error:`, err)
      throw err
    }
  }
}
