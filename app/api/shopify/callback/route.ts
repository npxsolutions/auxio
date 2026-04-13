import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getPostHogClient } from '../../../lib/posthog'

const getAdminSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code  = searchParams.get('code')
  const shop  = searchParams.get('shop')
  const state = searchParams.get('state')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://auxio-lkqv.vercel.app'

  if (!code || !shop) {
    return NextResponse.redirect(new URL('/onboarding?error=missing_params', request.url))
  }

  const cookieStore = await cookies()

  // Check if user is already logged in
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user: existingUser } } = await supabase.auth.getUser()

  // CSRF: validate nonce — skip if user is already logged in (custom app install flow)
  const nonce = cookieStore.get('shopify_oauth_nonce')?.value
  const csrfValid = nonce && nonce === state
  console.log(`Shopify callback — shop: ${shop}, csrf: ${csrfValid ? 'ok' : 'SKIP'}, loggedIn: ${!!existingUser}`)

  if (!csrfValid && !existingUser) {
    return NextResponse.redirect(new URL('/onboarding?error=invalid_state', request.url))
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id:     process.env.SHOPIFY_CLIENT_ID,
        client_secret: process.env.SHOPIFY_CLIENT_SECRET,
        code,
      }),
    })

    if (!tokenRes.ok) {
      const err = await tokenRes.text()
      console.error('Shopify token exchange failed:', err)
      return NextResponse.redirect(new URL('/onboarding?error=token_exchange_failed', request.url))
    }

    const { access_token } = await tokenRes.json()
    console.log(`Shopify token obtained for ${shop}`)

    // Get shop details
    const shopRes = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
      headers: { 'X-Shopify-Access-Token': access_token },
    })
    const shopData = shopRes.ok ? await shopRes.json() : { shop: { name: shop } }
    const shopEmail = shopData.shop?.email
    const shopName  = shopData.shop?.name || shop

    let userId: string

    if (existingUser) {
      // Already logged in — save channel using their session
      userId = existingUser.id

      const { error: upsertErr } = await supabase.from('channels').upsert({
        user_id:      userId,
        type:         'shopify',
        active:       true,
        access_token,
        shop_name:    shopName,
        shop_domain:  shop,
        connected_at: new Date().toISOString(),
      }, { onConflict: 'user_id,type' })

      if (upsertErr) {
        console.error('Channel upsert error:', upsertErr)
        return NextResponse.redirect(new URL('/onboarding?error=save_failed', request.url))
      }

      console.log(`Channel saved for user ${userId}`)

      // Track channel connected event
      const ph = getPostHogClient()
      if (ph) {
        ph.capture({ distinctId: userId, event: 'channel_connected', properties: { channel: 'shopify', shop } })
        await ph.shutdown()
      }

      // Mark onboarding complete
      await supabase.auth.updateUser({ data: { onboarding_complete: true } })

    } else if (shopEmail) {
      // Not logged in — find or create account
      const adminSupabase = getAdminSupabase()
      const { data: found } = await adminSupabase.auth.admin.listUsers()
      const match = found?.users?.find(u => u.email === shopEmail)

      if (match) {
        userId = match.id
      } else {
        const { data: created, error: createErr } = await adminSupabase.auth.admin.createUser({
          email: shopEmail,
          email_confirm: true,
          user_metadata: { shop_name: shopName, onboarding_complete: false },
        })
        if (createErr || !created.user) {
          console.error('Account creation error:', createErr)
          return NextResponse.redirect(new URL('/onboarding?error=account_creation_failed', request.url))
        }
        userId = created.user.id
      }

      const { error: upsertErr } = await adminSupabase.from('channels').upsert({
        user_id:      userId,
        type:         'shopify',
        active:       true,
        access_token,
        shop_name:    shopName,
        shop_domain:  shop,
        connected_at: new Date().toISOString(),
      }, { onConflict: 'user_id,type' })

      if (upsertErr) console.error('Channel upsert error (admin):', upsertErr)

      await adminSupabase.auth.admin.updateUserById(userId, {
        user_metadata: { onboarding_complete: true },
      })

      // Auto sign-in via magic link
      const { data: linkData } = await adminSupabase.auth.admin.generateLink({
        type: 'magiclink',
        email: shopEmail,
      })
      const sessionToken = linkData?.properties?.hashed_token
      if (sessionToken) {
        const magicUrl = `${appUrl}/api/auth/confirm?token_hash=${sessionToken}&type=magiclink&next=/onboarding?step=3`
        return NextResponse.redirect(new URL(magicUrl, request.url))
      }
    } else {
      return NextResponse.redirect(new URL('/login?hint=shopify', request.url))
    }

    // Register webhooks (fire-and-forget)
    const webhooks = [
      { topic: 'app/uninstalled',        address: `${appUrl}/api/shopify/webhooks/app-uninstalled` },
      { topic: 'customers/data_request', address: `${appUrl}/api/shopify/webhooks/customers-data-request` },
      { topic: 'customers/redact',       address: `${appUrl}/api/shopify/webhooks/customers-redact` },
      { topic: 'shop/redact',            address: `${appUrl}/api/shopify/webhooks/shop-redact` },
      { topic: 'orders/create',          address: `${appUrl}/api/webhooks/shopify/orders` },
      { topic: 'orders/paid',            address: `${appUrl}/api/webhooks/shopify/orders` },
      { topic: 'orders/updated',         address: `${appUrl}/api/webhooks/shopify/orders` },
      { topic: 'orders/cancelled',       address: `${appUrl}/api/webhooks/shopify/orders` },
      { topic: 'orders/refunded',        address: `${appUrl}/api/webhooks/shopify/orders` },
    ]
    Promise.all(webhooks.map(wh =>
      fetch(`https://${shop}/admin/api/2024-01/webhooks.json`, {
        method: 'POST',
        headers: { 'X-Shopify-Access-Token': access_token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhook: { topic: wh.topic, address: wh.address, format: 'json' } }),
      })
        .then(async r => console.log(`Shopify webhook register [${wh.topic}]:`, r.status))
        .catch(err => console.error(`Shopify webhook register [${wh.topic}] failed:`, err))
    )).catch(() => {})

    // Kick off initial sync
    fetch(`${appUrl}/api/shopify/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    }).catch(() => {})

    const response = NextResponse.redirect(new URL('/onboarding?step=3', request.url))
    response.cookies.delete('shopify_oauth_nonce')
    return response

  } catch (error: any) {
    console.error('Shopify OAuth callback error:', error)
    return NextResponse.redirect(new URL('/onboarding?error=unexpected', request.url))
  }
}
