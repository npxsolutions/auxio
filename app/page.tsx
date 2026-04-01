'use client'

import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: '#ffffff', color: '#191919', minHeight: '100vh' }}>

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e8e8e5', padding: '0 48px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em' }}>Auxio</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <a href="#how-it-works" style={{ fontSize: '14px', color: '#787774', textDecoration: 'none', fontWeight: 500 }}>How it works</a>
          <a href="#pricing" style={{ fontSize: '14px', color: '#787774', textDecoration: 'none', fontWeight: 500 }}>Pricing</a>
          <button onClick={() => router.push('/login')} style={{ background: 'transparent', border: 'none', color: '#787774', fontSize: '14px', fontWeight: 500, cursor: 'pointer', padding: '8px 16px' }}>Sign in</button>
          <button onClick={() => router.push('/signup')} style={{ background: '#191919', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', padding: '8px 18px' }}>Start free →</button>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ padding: '96px 48px 80px', maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f0f7ff', border: '1px solid #c7dff7', borderRadius: '100px', padding: '6px 14px', fontSize: '13px', color: '#2383e2', marginBottom: '32px', fontWeight: 500 }}>
          <div style={{ width: '6px', height: '6px', background: '#2383e2', borderRadius: '50%' }}></div>
          Multi-channel feed management — without the agency bill
        </div>

        <h1 style={{ fontSize: '64px', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.0, marginBottom: '24px' }}>
          List once.<br />
          <span style={{ color: '#2383e2' }}>Sell everywhere.</span>
        </h1>

        <p style={{ fontSize: '20px', color: '#787774', maxWidth: '600px', margin: '0 auto 40px', lineHeight: 1.6, fontWeight: 400 }}>
          Connect Shopify, eBay and Amazon. Manage all your product listings from one place. Publish to every channel in one click — no CSV exports, no copy-paste, no agency needed.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '20px' }}>
          <button onClick={() => router.push('/signup')} style={{ background: '#191919', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 600, cursor: 'pointer', padding: '14px 32px' }}>
            Start free trial →
          </button>
          <button onClick={() => router.push('/dashboard')} style={{ background: 'transparent', color: '#191919', border: '1.5px solid #e8e8e5', borderRadius: '8px', fontSize: '16px', fontWeight: 500, cursor: 'pointer', padding: '14px 28px' }}>
            See a demo
          </button>
        </div>
        <p style={{ fontSize: '13px', color: '#9b9b98' }}>No credit card required · 7-day free trial · Setup in 2 minutes</p>

        {/* Channel logos */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '32px', marginTop: '56px', paddingTop: '48px', borderTop: '1px solid #e8e8e5' }}>
          <span style={{ fontSize: '12px', color: '#9b9b98', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Works with</span>
          {[
            { label: 'Shopify', color: '#96BF48', icon: '🛍️' },
            { label: 'eBay', color: '#E53238', icon: '🛒' },
            { label: 'Amazon', color: '#FF9900', icon: '📦' },
          ].map(ch => (
            <div key={ch.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 18px', border: '1px solid #e8e8e5', borderRadius: '8px' }}>
              <span style={{ fontSize: '16px' }}>{ch.icon}</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#191919' }}>{ch.label}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 18px', border: '1px dashed #e8e8e5', borderRadius: '8px' }}>
            <span style={{ fontSize: '13px', color: '#9b9b98' }}>+ more coming</span>
          </div>
        </div>
      </div>

      {/* PROBLEM */}
      <div style={{ background: '#f7f7f5', borderTop: '1px solid #e8e8e5', borderBottom: '1px solid #e8e8e5', padding: '80px 48px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#c9372c', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>The problem</div>
          <h2 style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '16px', lineHeight: 1.1 }}>
            Managing listings across channels<br />is a full-time job
          </h2>
          <p style={{ fontSize: '17px', color: '#787774', marginBottom: '56px', lineHeight: 1.6 }}>
            Every channel has different requirements. eBay wants keyword-rich titles. Amazon needs bullet points. Shopify wants your brand story. Getting it right on all three means hours of copy-paste, manual exports, and constant updates.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', textAlign: 'left' }}>
            {[
              {
                icon: '⏱',
                title: 'Hours wasted on manual updates',
                desc: 'One product change means updating Shopify, then eBay, then Amazon. Separately. Manually. Every. Time.',
              },
              {
                icon: '❌',
                title: 'Listings rejected for wrong reasons',
                desc: 'Wrong category, missing attributes, title too long. You only find out after you\'ve already published — if you\'re lucky.',
              },
              {
                icon: '💸',
                title: 'Enterprise tools cost thousands',
                desc: 'Feedonomics and ChannelAdvisor charge £1,000+/month and require onboarding specialists. Built for enterprise, not sellers.',
              },
            ].map(p => (
              <div key={p.title} style={{ background: 'white', border: '1px solid #e8e8e5', borderRadius: '12px', padding: '24px' }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>{p.icon}</div>
                <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', lineHeight: 1.3 }}>{p.title}</div>
                <div style={{ fontSize: '14px', color: '#787774', lineHeight: 1.6 }}>{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SOLUTION */}
      <div style={{ padding: '80px 48px', maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f7b6c', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>The solution</div>
        <h2 style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '16px' }}>
          One place for all your product data
        </h2>
        <p style={{ fontSize: '17px', color: '#787774', maxWidth: '640px', margin: '0 auto 56px', lineHeight: 1.6 }}>
          Auxio sits between your products and your channels. Create a listing once. Let Auxio format it correctly for each platform and push it live — with AI-optimised titles, descriptions, and attributes per channel.
        </p>

        {/* Flow diagram */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0', marginBottom: '64px', flexWrap: 'wrap' }}>
          {[
            { label: 'Your products', sub: 'CSV, Shopify, manual', bg: '#f7f7f5', border: '#e8e8e5' },
            null,
            { label: 'Auxio', sub: 'normalise · optimise · validate', bg: '#191919', border: '#191919', light: true },
            null,
            { label: 'Every channel', sub: 'eBay · Amazon · Shopify', bg: '#f0f7ff', border: '#c7dff7' },
          ].map((item, i) =>
            item === null ? (
              <div key={i} style={{ fontSize: '20px', color: '#9b9b98', margin: '0 8px' }}>→</div>
            ) : (
              <div key={i} style={{ background: item.bg, border: `1.5px solid ${item.border}`, borderRadius: '12px', padding: '20px 32px', textAlign: 'center', minWidth: '180px' }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: item.light ? 'white' : '#191919', marginBottom: '4px' }}>{item.label}</div>
                <div style={{ fontSize: '12px', color: item.light ? '#888' : '#9b9b98' }}>{item.sub}</div>
              </div>
            )
          )}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div id="how-it-works" style={{ background: '#f7f7f5', borderTop: '1px solid #e8e8e5', borderBottom: '1px solid #e8e8e5', padding: '80px 48px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#2383e2', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', textAlign: 'center' }}>How it works</div>
          <h2 style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '48px', textAlign: 'center' }}>Up and running in minutes</h2>

          {[
            {
              step: '01',
              title: 'Connect your channels',
              desc: 'Link Shopify, eBay and Amazon with OAuth. Your existing products and orders sync automatically. Takes under 2 minutes.',
              color: '#2383e2',
            },
            {
              step: '02',
              title: 'Create or import your listings',
              desc: 'Add products manually, import via CSV, or pull directly from your Shopify store. All your product data in one place.',
              color: '#0f7b6c',
            },
            {
              step: '03',
              title: 'Let AI optimise per channel',
              desc: 'Auxio rewrites your title and description for each platform — keyword-rich for eBay, bullet-point format for Amazon, brand-forward for Shopify.',
              color: '#7c3aed',
            },
            {
              step: '04',
              title: 'Publish everywhere in one click',
              desc: 'Hit publish and Auxio pushes the listing to every selected channel simultaneously. Feed health scoring catches issues before they go live.',
              color: '#d9730d',
            },
          ].map(item => (
            <div key={item.step} style={{ display: 'flex', gap: '28px', marginBottom: '28px', padding: '28px', background: 'white', borderRadius: '12px', border: '1px solid #e8e8e5', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: item.color, minWidth: '28px', paddingTop: '2px' }}>{item.step}</div>
              <div>
                <div style={{ fontSize: '17px', fontWeight: 600, marginBottom: '8px' }}>{item.title}</div>
                <div style={{ fontSize: '14px', color: '#787774', lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <div style={{ padding: '80px 48px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#2383e2', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', textAlign: 'center' }}>Features</div>
        <h2 style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '48px', textAlign: 'center' }}>Everything you need to scale across channels</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {[
            {
              icon: '🔁',
              title: 'One-click multi-channel publish',
              desc: 'Push any listing to Shopify, eBay, and Amazon simultaneously. No duplicate data entry.',
            },
            {
              icon: '🤖',
              title: 'AI listing optimisation',
              desc: 'Channel-specific titles, descriptions and keywords generated automatically. Passes eBay\'s 80-char title limit every time.',
            },
            {
              icon: '✅',
              title: 'Feed health scoring',
              desc: 'Instantly see what\'s blocking a listing per channel — missing images, wrong category, title too long — before it goes live.',
            },
            {
              icon: '📥',
              title: 'CSV bulk import',
              desc: 'Upload your full product catalogue in minutes. Auxio maps columns automatically and handles 25+ field name variations.',
            },
            {
              icon: '📊',
              title: 'Real profit dashboard',
              desc: 'True profit per order after every fee, shipping cost and ad spend. Know which channels and products actually make money.',
            },
            {
              icon: '📦',
              title: 'Inventory management',
              desc: 'Track stock levels, lead times and reorder points across all channels. Get alerts before you run out.',
            },
          ].map(f => (
            <div key={f.title} style={{ border: '1px solid #e8e8e5', borderRadius: '12px', padding: '28px 24px', background: '#fff' }}>
              <div style={{ fontSize: '28px', marginBottom: '14px' }}>{f.icon}</div>
              <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', lineHeight: 1.3 }}>{f.title}</div>
              <div style={{ fontSize: '14px', color: '#787774', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* VS COMPETITORS */}
      <div style={{ background: '#191919', padding: '80px 48px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#444', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Why Auxio</div>
          <h2 style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '-0.03em', color: 'white', marginBottom: '48px' }}>
            Built for sellers, not enterprise IT teams
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: '#333', borderRadius: '12px', overflow: 'hidden', marginBottom: '48px' }}>
            {/* Header row */}
            <div style={{ background: '#191919', padding: '16px', fontSize: '12px', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em' }}></div>
            <div style={{ background: '#191919', padding: '16px', fontSize: '13px', fontWeight: 700, color: '#888', textAlign: 'center' }}>Feedonomics / ChannelAdvisor</div>
            <div style={{ background: '#1a2744', padding: '16px', fontSize: '13px', fontWeight: 700, color: '#2383e2', textAlign: 'center' }}>Auxio</div>

            {[
              { label: 'Setup time', them: '2–4 weeks with onboarding', us: '2 minutes, self-serve' },
              { label: 'Price', them: '£1,000–£5,000/month', us: 'From £79/month' },
              { label: 'Contract', them: 'Annual contract required', us: 'Month to month' },
              { label: 'Who runs it', them: 'Needs a dedicated team', us: 'You — no agency needed' },
              { label: 'AI optimisation', them: 'Manual rules only', us: 'Built-in per-channel AI' },
              { label: 'Profit tracking', them: 'Not included', us: 'Included on all plans' },
            ].map((row, i) => (
              <>
                <div key={`l${i}`} style={{ background: '#191919', padding: '14px 16px', fontSize: '13px', fontWeight: 600, color: '#888' }}>{row.label}</div>
                <div key={`t${i}`} style={{ background: '#191919', padding: '14px 16px', fontSize: '13px', color: '#555', textAlign: 'center' }}>{row.them}</div>
                <div key={`u${i}`} style={{ background: '#1a2744', padding: '14px 16px', fontSize: '13px', color: '#7eb8f7', textAlign: 'center', fontWeight: 500 }}>{row.us}</div>
              </>
            ))}
          </div>
        </div>
      </div>

      {/* STATS */}
      <div style={{ background: '#f7f7f5', borderBottom: '1px solid #e8e8e5', padding: '64px 48px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', textAlign: 'center' }}>
            {[
              { value: '2 mins', label: 'Average setup time to first published listing' },
              { value: '3 channels', label: 'Managed from one dashboard, simultaneously' },
              { value: '10×', label: 'Faster than managing channels manually' },
              { value: '£79/mo', label: 'Starting price — fraction of Feedonomics cost' },
            ].map(stat => (
              <div key={stat.value}>
                <div style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '-0.03em', color: '#191919', marginBottom: '8px' }}>{stat.value}</div>
                <div style={{ fontSize: '13px', color: '#787774', lineHeight: 1.5 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PRICING */}
      <div id="pricing" style={{ padding: '80px 48px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#2383e2', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', textAlign: 'center' }}>Pricing</div>
        <h2 style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '8px', textAlign: 'center' }}>Simple, transparent pricing</h2>
        <p style={{ fontSize: '16px', color: '#787774', marginBottom: '48px', textAlign: 'center' }}>7-day free trial on all plans. No credit card required.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {[
            {
              name: 'Starter',
              price: '79',
              desc: 'Solo seller on 1 channel',
              features: ['1 channel', 'Up to 500 listings', 'CSV import', 'Feed health scoring', 'Profit dashboard'],
              popular: false,
            },
            {
              name: 'Growth',
              price: '199',
              desc: 'Selling across 3 channels',
              features: ['3 channels', 'Unlimited listings', 'AI listing optimisation', 'AI insights & chat', 'PPC intelligence', 'Bulk publishing'],
              popular: true,
            },
            {
              name: 'Scale',
              price: '599',
              desc: 'High volume, full automation',
              features: ['5 channels', 'Everything in Growth', 'Autopilot AI agent', 'Real-time sync', 'Full ML suite', 'Priority support'],
              popular: false,
            },
            {
              name: 'Enterprise',
              price: '1,500',
              desc: 'Agencies & large operations',
              features: ['Unlimited channels', 'Custom integrations', 'Dedicated manager', 'SLA guarantee', 'API access', 'White-label option'],
              popular: false,
            },
          ].map(plan => (
            <div key={plan.name} style={{ border: plan.popular ? '2px solid #2383e2' : '1px solid #e8e8e5', borderRadius: '12px', padding: '28px 24px', position: 'relative', background: '#fff' }}>
              {plan.popular && (
                <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#2383e2', color: 'white', fontSize: '11px', fontWeight: 600, padding: '3px 12px', borderRadius: '100px', whiteSpace: 'nowrap' }}>Most popular</div>
              )}
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>{plan.name}</div>
              <div style={{ fontSize: '12px', color: '#9b9b98', marginBottom: '16px' }}>{plan.desc}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
                <span style={{ fontSize: '16px', fontWeight: 600 }}>£</span>
                <span style={{ fontSize: '36px', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>{plan.price}</span>
                <span style={{ fontSize: '13px', color: '#9b9b98' }}>/mo</span>
              </div>
              <div style={{ fontSize: '12px', color: '#0f7b6c', fontWeight: 500, marginBottom: '20px' }}>✓ 7-day free trial</div>
              <ul style={{ listStyle: 'none', marginBottom: '24px', padding: 0 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ fontSize: '13px', color: '#787774', padding: '4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#0f7b6c', fontWeight: 600 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <button onClick={() => router.push('/signup')} style={{ width: '100%', background: plan.popular ? '#2383e2' : 'transparent', color: plan.popular ? 'white' : '#191919', border: plan.popular ? 'none' : '1.5px solid #e8e8e5', borderRadius: '6px', padding: '10px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                Start free trial
              </button>
            </div>
          ))}
        </div>

        {/* Founding member banner */}
        <div style={{ marginTop: '24px', background: '#191919', borderRadius: '10px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '20px' }}>🎉</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'white', marginBottom: '2px' }}>Founding member pricing — first 50 customers only</div>
            <div style={{ fontSize: '13px', color: '#666' }}>Starter £49 · Growth £129 · Scale £399 · Locked in forever</div>
          </div>
          <button onClick={() => router.push('/signup')} style={{ background: 'white', color: '#191919', border: 'none', borderRadius: '6px', padding: '10px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
            Claim founding rate →
          </button>
        </div>
      </div>

      {/* OBJECTIONS */}
      <div style={{ background: '#f7f7f5', borderTop: '1px solid #e8e8e5', borderBottom: '1px solid #e8e8e5', padding: '80px 48px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '40px', textAlign: 'center' }}>Common questions</h2>
          {[
            {
              q: 'How is this different from Feedonomics?',
              a: 'Feedonomics is built for enterprise teams with dedicated onboarding, annual contracts, and £1,000+/month price tags. Auxio is self-serve — connect your channels, import your products, and publish in under 10 minutes. No specialists required.',
            },
            {
              q: 'What if I already have listings on eBay and Amazon?',
              a: 'Existing listings stay live. Auxio doesn\'t touch what\'s already there. You create new listings through Auxio and it manages those going forward. You can migrate at your own pace.',
            },
            {
              q: 'Do I need technical knowledge to set this up?',
              a: 'No. Channel connections use standard OAuth — click Connect, log in to your account, done. Listing creation is a simple form. CSV import handles bulk uploads. No API keys, no developer needed.',
            },
            {
              q: 'What happens when I cancel?',
              a: 'Your listings stay live on all channels — we don\'t delete anything. You just lose access to Auxio\'s management dashboard. Month-to-month, cancel any time.',
            },
          ].map(item => (
            <div key={item.q} style={{ borderBottom: '1px solid #e8e8e5', padding: '24px 0' }}>
              <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '10px' }}>{item.q}</div>
              <div style={{ fontSize: '14px', color: '#787774', lineHeight: 1.7 }}>{item.a}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: '#191919', padding: '96px 48px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '48px', fontWeight: 700, color: 'white', letterSpacing: '-0.03em', marginBottom: '16px', lineHeight: 1.1 }}>
          Stop managing channels.<br />Start scaling them.
        </h2>
        <p style={{ fontSize: '18px', color: '#888', marginBottom: '36px', lineHeight: 1.6 }}>
          Connect Shopify, eBay and Amazon in one place.<br />Publish listings everywhere in one click.
        </p>
        <button onClick={() => router.push('/signup')} style={{ background: '#2383e2', color: 'white', border: 'none', borderRadius: '8px', fontSize: '17px', fontWeight: 600, cursor: 'pointer', padding: '16px 36px', fontFamily: 'inherit' }}>
          Start your free 7-day trial →
        </button>
        <p style={{ fontSize: '13px', color: '#555', marginTop: '16px' }}>No credit card required · Cancel any time</p>
      </div>

      {/* FOOTER */}
      <footer style={{ background: '#f7f7f5', borderTop: '1px solid #e8e8e5', padding: '32px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '15px', fontWeight: 700 }}>Auxio</div>
        <div style={{ display: 'flex', gap: '24px' }}>
          {['Privacy Policy', 'Terms of Service', 'Contact'].map(link => (
            <a key={link} href="#" style={{ fontSize: '13px', color: '#9b9b98', textDecoration: 'none' }}>{link}</a>
          ))}
        </div>
        <div style={{ fontSize: '13px', color: '#9b9b98' }}>© 2026 NPX Solutions Ltd</div>
      </footer>

    </div>
  )
}
