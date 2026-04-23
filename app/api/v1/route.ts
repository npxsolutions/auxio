import { NextResponse } from 'next/server'

// Public API info endpoint — /api/v1/
export async function GET(request: Request) {
  try {
    return NextResponse.json({
      api:     'Palvento API',
      version: 'v1',
      status:  'live',
      endpoints: {
        'GET /api/v1/listings':       'List your product listings',
        'GET /api/v1/orders':         'List your orders',
        'GET /api/v1/profit/summary': 'Profit summary across all channels',
        'GET /api/v1/channels':       'List your connected channels',
        'GET /api/v1/inventory':      'Current inventory levels',
      },
      auth:       'Authorization: Bearer <supabase-access-token | api-key>',
      organization: 'Optional X-Organization-Id header selects which org to query; defaults to your personal org.',
      rate_limit: '1000 requests / hour',
    })
  } catch (err) {
    console.error('[api/v1] error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
