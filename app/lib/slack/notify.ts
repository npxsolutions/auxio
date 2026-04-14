// Slack incoming-webhook notification helper.
// Fire-and-forget by convention: callers should use `void notifySlack(...)` so
// response paths are never blocked by Slack latency or outages.
//
// Setup: create one incoming-webhook app per channel at https://api.slack.com/apps
// and populate the matching env var. If the env var is missing we log a warning
// and return — the app continues to work without Slack.

export type SlackChannel =
  | 'partnerships'
  | 'affiliates'
  | 'changelog'
  | 'demos'
  | 'errors'
  | 'sales'

const ENV_BY_CHANNEL: Record<SlackChannel, string> = {
  partnerships: 'SLACK_WEBHOOK_PARTNERSHIPS',
  affiliates:   'SLACK_WEBHOOK_AFFILIATES',
  changelog:    'SLACK_WEBHOOK_CHANGELOG',
  demos:        'SLACK_WEBHOOK_DEMOS',
  errors:       'SLACK_WEBHOOK_ERRORS',
  sales:        'SLACK_WEBHOOK_SALES',
}

export interface NotifySlackArgs {
  channel: SlackChannel
  text: string
  blocks?: unknown[]
}

export async function notifySlack(args: NotifySlackArgs): Promise<void> {
  const { channel, text, blocks } = args
  const envVar = ENV_BY_CHANNEL[channel]
  const url = process.env[envVar]

  if (!url) {
    console.warn(`[lib/slack:notify] ${envVar} not set — skipping ${channel} notification`)
    return
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(blocks ? { text, blocks } : { text }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(`[lib/slack:notify] ${channel} webhook ${res.status}: ${body}`)
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[lib/slack:notify] ${channel} fetch failed: ${message}`)
  }
}
