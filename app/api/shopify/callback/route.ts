import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

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

  if (!code || !shop) {
    return NextResponse.redirect(new URL('/onboarding?error=missing_params', request.url))
  }

  // CSRF: validate nonce
  const cookieStore = await cookies()
  const nonce = cookieStore.get('shopify_oauth_nonce')?.value
  if (!nonce || nonce !== state) {
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
      return NextResponse.redirect(new URL('/onboarding?error=token_exchange_failed', request.url))
    }

    const { access_token } = await tokenRes.json()

    // Get shop details (includes owner email)
    const shopRes = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
      headers: { 'X-Shopify-Access-Token': access_token },
    })
    const shopData = shopRes.ok ? await shopRes.json() : { shop: { name: shop } }
    const shopEmail = shopData.shop?.email
    const shopName  = shopData.shop?.name || shop

    const adminSupabase = getAdminSupabase()

    // Check if user is already logged in
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )
    const { data: { user: existingUser } } = await supabase.auth.getUser()

    let userId: string
    let sessionToken: string | null = null

    if (existingUser) {
      // Already logged in — use their account
      userId = existingUser.id
    } else if (shopEmail) {
      // Not logged in — find or create account from shop email
      const { data: found } = await adminSupabase.auth.admin.listUsers()
      const match = found?.users?.find(u => u.email === shopEmail)

      if (match) {
        userId = match.id
      } else {
        // Create new account — no password, they'll use magic link later
        const { data: created, error: createErr } = await adminSupabase.auth.admin.createUser({
          email: shopEmail,
          email_confirm: true,
          user_metadata: { shop_name: shopName, onboarding_complete: false },
        })
        if (createErr || !created.user) {
          return NextResponse.redirect(new URL('/onboarding?error=account_creation_failed', request.url))
        }
        userId = created.user.id
      }

      // Generate a magic link to auto-sign them in
      const { data: linkData } = await adminSupabase.auth.admin.generateLink({
        type: 'magiclink',
        email: shopEmail,
      })
      sessionToken = linkData?.properties?.hashed_token ?? null
    } else {
      // No email from Shopify and not logged in — send to login
      return NextResponse.redirect(new URL('/login?hint=shopify', request.url))
    }

    // Store channel
    await adminSupabase.from('channels').upsert({
      user_id:      userId,
      type:         'shopify',
      active:       true,
      access_token,
      shop_name:    shopName,
      shop_domain:  shop,
      connected_at: new Date().toISOString(),
    }, { onConflict: 'user_id,type' })

    // Mark onboarding complete
    await adminSupabase.auth.admin.updateUserById(userId, {
      user_metadata: { onboarding_complete: true },
    })

    // Register mandatory webhooks (fire-and-forget)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://auxio-lkqv.vercel.app'
    const webhooks = [
      { topic: 'app/uninstalled',        address: `${appUrl}/api/shopify/webhooks/app-uninstalled` },
      { topic: 'customers/data_request', address: `${appUrl}/api/shopify/webhooks/customers-data-request` },
      { topic: 'customers/redact',       address: `${appUrl}/api/shopify/webhooks/customers-redact` },
      { topic: 'shop/redact',            address: `${appUrl}/api/shopify/webhooks/shop-redact` },
    ]
    Promise.all(webhooks.map(wh =>
      fetch(`https://${shop}/admin/api/2024-01/webhooks.json`, {
        method: 'POST',
        headers: { 'X-Shopify-Access-Token': access_token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhook: { topic: wh.topic, address: wh.address, format: 'json' } }),
      }).catch(() => {})
    )).catch(() => {})

    // Kick off initial sync
    fetch(`${appUrl}/api/shopify/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    }).catch(() => {})

    const response = NextResponse.redirect(new URL('/onboarding?step=3', request.url))
    response.cookies.delete('shopify_oauth_nonce')

    // If we created/found a user via Shopify, redirect through magic link to auto-sign them in
    if (!existingUser && sessionToken) {
      const magicUrl = `${appUrl}/api/auth/confirm?token_hash=${sessionToken}&type=magiclink&next=/onboarding?step=3`
      return NextResponse.redirect(new URL(magicUrl, request.url))
    }

    return response

  } catch (error: any) {
    console.error('Shopify OAuth callback error:', error)
    return NextResponse.redirect(new URL('/onboarding?error=unexpected', request.url))
  }
}
