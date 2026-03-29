'use client'

import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: '#ffffff', color: '#191919', minHeight: '100vh' }}>

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e8e8e5', padding: '0 48px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em' }}>Auxio</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => router.push('/login')} style={{ background: 'transparent', border: 'none', color: '#787774', fontSize: '14px', fontWeight: 500, cursor: 'pointer', padding: '8px 16px' }}>Sign in</button>
          <button onClick={() => router.push('/signup')} style={{ background: '#191919', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', padding: '8px 18px' }}>Start free trial</button>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ padding: '100px 48px 80px', maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f7f7f5', border: '1px solid #e8e8e5', borderRadius: '100px', padding: '6px 14px', fontSize: '13px', color: '#787774', marginBottom: '32px', fontWeight: 500 }}>
          <div style={{ width: '6px', height: '6px', background: '#0f7b6c', borderRadius: '50%' }}></div>
          Built by an active eBay seller
        </div>

        <h1 style={{ fontSize: '58px', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: '24px' }}>
          Your bank lends your £1<br />
          deposit out <span style={{ color: '#2383e2' }}>9 times.</span><br />
          <span style={{ fontSize: '42px', color: '#787774', fontWeight: 500 }}>Auxio returns £9.40 for every<br />£1 you pay. Every month.</span>
        </h1>

        <p style={{ fontSize: '18px', color: '#787774', maxWidth: '560px', margin: '0 auto 40px', lineHeight: 1.6 }}>
          The AI operating system that sits in the middle of every eCommerce transaction and multiplies your profit. Like fractional reserve banking — for your store.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
          <button onClick={() => router.push('/signup')} style={{ background: '#191919', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 500, cursor: 'pointer', padding: '14px 28px' }}>
            Start 7-day free trial →
          </button>
          <button onClick={() => router.push('/dashboard')} style={{ background: 'transparent', color: '#191919', border: '1.5px solid #e8e8e5', borderRadius: '8px', fontSize: '16px', fontWeight: 500, cursor: 'pointer', padding: '14px 28px' }}>
            View demo
          </button>
        </div>
        <p style={{ fontSize: '13px', color: '#9b9b98' }}>No credit card required · 7-day free trial · Setup in 2 minutes</p>
      </div>

      {/* THE EQUATION */}
      <div style={{ background: '#191919', padding: '60px 48px', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#444', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '24px' }}>The Auxio Value Equation</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '32px' }}>
            {[
              { label: 'You pay', value: '£199/mo' },
              { op: '×' },
              { label: 'Leverage ratio', value: '9.4×' },
              { op: '=' },
              { label: 'Value returned', value: '£1,870', highlight: true },
            ].map((item: any, i) => item.op ? (
              <div key={i} style={{ fontSize: '28px', color: '#333', fontWeight: 300 }}>{item.op}</div>
            ) : (
              <div key={i} style={{ background: item.highlight ? '#2383e2' : '#1a1a1a', border: `1px solid ${item.highlight ? '#2383e2' : '#333'}`, borderRadius: '8px', padding: '16px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: item.highlight ? 'rgba(255,255,255,0.7)' : '#555', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>{item.label}</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'white' }}>{item.value}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '16px', color: '#888', lineHeight: 1.6 }}>
            Banks multiply deposits through lending. Auxio multiplies your eCommerce capital through intelligence.<br />
            <strong style={{ color: '#ccc' }}>Same principle. Applied to your eBay, Amazon and Shopify store.</strong>
          </p>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div style={{ padding: '80px 48px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#2383e2', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>How it works</div>
        <h2 style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '48px' }}>The 5 layers of intelligence</h2>

        {[
          { num: '01', title: 'Transaction Capture', desc: 'Every order flows through Auxio. True profit calculated automatically — sale price minus every fee, every ad cost, every shipping cost, every supplier cost. Real numbers. Not estimates.', color: '#0f7b6c' },
          { num: '02', title: 'Margin Intelligence', desc: 'ML analyses 90 days of your transactions against 847 network sellers. Finds which products are above benchmark, which are below, which need repricing. Signals per product: Scale, Hold, Optimise, Review, Exit.', color: '#2383e2' },
          { num: '03', title: 'PPC Intelligence', desc: 'Connects every keyword to true profit — not just ACOS. Harvests winners into exact match. Negatives losers permanently. Adjusts bids daily using ML. Average saving: £621/month in eliminated waste.', color: '#7c3aed' },
          { num: '04', title: 'Velocity Engine', desc: 'Predicts stockouts before they happen. Calculates reorder point, reorder quantity and days until stockout per product. Alerts you in time to reorder. Prevents the algorithm burying your listing.', color: '#d9730d' },
          { num: '05', title: 'Claude AI Agent', desc: 'Reads all ML outputs. Generates daily briefing. Answers questions about your store in plain English. Takes actions automatically in autopilot mode. Explains everything in plain English.', color: '#c9372c' },
        ].map((layer) => (
          <div key={layer.num} style={{ display: 'flex', gap: '32px', marginBottom: '32px', padding: '28px', background: '#f7f7f5', borderRadius: '12px', border: '1px solid #e8e8e5', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: layer.color, minWidth: '32px' }}>{layer.num}</div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>{layer.title}</div>
              <div style={{ fontSize: '14px', color: '#787774', lineHeight: 1.6 }}>{layer.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* PROOF NUMBERS */}
      <div style={{ background: '#f7f7f5', borderTop: '1px solid #e8e8e5', borderBottom: '1px solid #e8e8e5', padding: '60px 48px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
            {[
              { value: '£621', label: 'Average PPC waste eliminated per seller per month' },
              { value: '9.4×', label: 'Average leverage ratio — value returned per £1 paid' },
              { value: '22%', label: 'Average true margin after Auxio optimisation' },
              { value: '2 mins', label: 'Time to connect your first channel and see real data' },
            ].map((stat) => (
              <div key={stat.value} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '-0.03em', color: '#191919', marginBottom: '8px' }}>{stat.value}</div>
                <div style={{ fontSize: '13px', color: '#787774', lineHeight: 1.5 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PRICING */}
      <div style={{ padding: '80px 48px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#2383e2', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Pricing</div>
        <h2 style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '8px' }}>Simple, transparent pricing</h2>
        <p style={{ fontSize: '16px', color: '#787774', marginBottom: '48px' }}>7-day free trial on all plans. No credit card required.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {[
            { name: 'Starter', price: '79', desc: 'Solo eBay seller', features: ['1 channel', 'True profit dashboard', 'Up to 500 listings', 'Inventory alerts'], ai: false, popular: false },
            { name: 'Growth', price: '199', desc: 'Growing multichannel seller', features: ['3 channels', 'Unlimited listings', 'AI insights daily', 'AI agent (co-pilot)', 'AI chat', 'PPC intelligence'], ai: true, popular: true },
            { name: 'Scale', price: '599', desc: 'High volume operation', features: ['5 channels', 'Real-time AI insights', 'AI agent (autopilot)', 'Full ML suite', 'Priority support'], ai: true, popular: false },
            { name: 'Enterprise', price: '1,500', desc: 'Agencies and large teams', features: ['Unlimited channels', 'Custom integrations', 'Dedicated manager', 'SLA guarantee', 'API access'], ai: true, popular: false },
          ].map((plan) => (
            <div key={plan.name} style={{ border: plan.popular ? '2px solid #2383e2' : '1px solid #e8e8e5', borderRadius: '12px', padding: '28px 24px', position: 'relative', background: '#fff' }}>
              {plan.popular && <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#2383e2', color: 'white', fontSize: '11px', fontWeight: 600, padding: '3px 12px', borderRadius: '100px', whiteSpace: 'nowrap' }}>Most popular</div>}
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>{plan.name}</div>
              <div style={{ fontSize: '12px', color: '#9b9b98', marginBottom: '16px' }}>{plan.desc}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
                <span style={{ fontSize: '16px', fontWeight: 600 }}>£</span>
                <span style={{ fontSize: '36px', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>{plan.price}</span>
                <span style={{ fontSize: '13px', color: '#9b9b98' }}>/mo</span>
              </div>
              <div style={{ fontSize: '12px', color: '#0f7b6c', fontWeight: 500, marginBottom: '20px' }}>✓ 7-day free trial</div>
              <ul style={{ listStyle: 'none', marginBottom: '24px' }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ fontSize: '13px', color: '#787774', padding: '4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#0f7b6c', fontWeight: 600 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <button onClick={() => router.push('/signup')} style={{ width: '100%', background: plan.popular ? '#2383e2' : 'transparent', color: plan.popular ? 'white' : '#191919', border: plan.popular ? 'none' : '1.5px solid #e8e8e5', borderRadius: '6px', padding: '10px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
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
            <div style={{ fontSize: '13px', color: '#666' }}>Starter £49 · Growth £129 · Scale £399 · Locked forever</div>
          </div>
          <button onClick={() => router.push('/signup')} style={{ background: 'white', color: '#191919', border: 'none', borderRadius: '6px', padding: '10px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Claim founding rate →
          </button>
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: '#191919', padding: '80px 48px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '44px', fontWeight: 700, color: 'white', letterSpacing: '-0.03em', marginBottom: '16px' }}>
          Start knowing your real profit
        </h2>
        <p style={{ fontSize: '18px', color: '#888', marginBottom: '36px' }}>7-day free trial · No credit card · Setup in 2 minutes</p>
        <button onClick={() => router.push('/signup')} style={{ background: '#2383e2', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 500, cursor: 'pointer', padding: '14px 32px' }}>
          Start free trial →
        </button>
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
