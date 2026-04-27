import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Best Linnworks Alternative for Global Sellers (2026) — Honest Comparison',
  description: 'Looking for a Linnworks alternative? Linnworks starts at $549/mo and requires a 40-day onboarding project. Palvento gives you more features — including AI and true P&L — from $149/mo, live today. Built for sellers worldwide.',
  keywords: ['Linnworks alternative', 'cheaper than Linnworks', 'Linnworks alternative 2026', 'Linnworks vs Palvento', 'best Linnworks replacement', 'global multichannel inventory management', 'international ecommerce operations platform'],
}

export default function BlogPostPage() {
  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#fff', color: '#0b0f1a' }}>

      <nav style={{ borderBottom: '1px solid #e2e8f0', padding: '0 48px', height: '58px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontWeight: 700, fontSize: '15px', color: '#0b0f1a', textDecoration: 'none' }}>Palvento</Link>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/blog" style={{ fontSize: '13px', color: '#64748b', textDecoration: 'none', padding: '7px 14px' }}>← All guides</Link>
          <Link href="/signup" style={{ padding: '7px 16px', borderRadius: '7px', background: '#e8863f', fontSize: '13px', color: '#fff', textDecoration: 'none', fontWeight: 600 }}>Start free →</Link>
        </div>
      </nav>

      <article style={{ maxWidth: '760px', margin: '0 auto', padding: '64px 48px 96px' }}>
        <div style={{ marginBottom: '32px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#e8863f', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Guide · 2026</span>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15, marginTop: '12px', marginBottom: '20px' }}>
            The Best Linnworks Alternative for Global Sellers in 2026
          </h1>
          <p style={{ fontSize: '18px', color: '#475569', lineHeight: 1.7 }}>
            Linnworks has been the go-to multichannel platform for sellers worldwide for over 15 years. But at $549+/month, a 40-day average onboarding time, and no built-in AI or profit tracking, more sellers are looking for an alternative that delivers more for less. Here's what's actually worth switching to.
          </p>
          <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: '#94a3b8', marginTop: '16px' }}>
            <span>April 2026</span><span>·</span><span>9 min read</span>
          </div>
        </div>

        {[
          {
            h: 'Why sellers leave Linnworks',
            body: `Linnworks is a mature, capable platform. It processes $9B+ GMV annually and has a large global customer base. But the reasons sellers look for alternatives are consistent:\n\n• Price: $549/mo minimum, rising to $1,000+/mo for scale plans. For sellers doing $25k–$120k/month GMV, that's a meaningful cost.\n• Onboarding: Linnworks takes an average of 40 days to implement. That's 40 days before you see a single benefit.\n• No free trial: You have to request a demo and get a custom quote before you can even try the product.\n• No AI features: Linnworks launched "Spotlight AI" in 2024 but it's limited to identifying manual tasks. There's no AI listing writer, no demand forecasting AI, no autonomous agent.\n• Profit tracking gap: Linnworks tracks orders and inventory well, but doesn't calculate true net profit after marketplace fees, COGS, postage, and sales tax/VAT.\n• Pricing anxiety: Linnworks prices on order volume — so as you grow, your bill grows with you.`,
          },
          {
            h: 'What to look for in a Linnworks alternative',
            body: `Before switching, be clear on what you actually need. The best Linnworks replacement for your business depends on your scale and complexity:\n\n• If you're doing under $60k/month GMV and want self-serve: you want something like Palvento — full features, self-serve setup, transparent pricing from $149/mo (billed in USD, GBP, EUR, AUD or CAD).\n• If you're doing over $600k/month and need warehouse management: Linnworks is still strong here, especially post-SkuVault acquisition. Brightpearl and ChannelAdvisor are also worth evaluating.\n• If you primarily need listing sync and order routing and sell mainly in Central/Eastern Europe: Baselinker is a cheaper regional option, but offers much less depth on analytics and automation.\n\nFor most sellers in the $25k–$600k/month GMV range — and especially those who want AI, true profit visibility, and procurement management — Palvento is the strongest alternative.`,
          },
          {
            h: 'Palvento vs Linnworks: the real differences',
            body: `Here's what the comparison looks like side by side:\n\n• Price: Palvento from $149/mo vs Linnworks $549+/mo. That's roughly a $5,880/year minimum saving.\n• Setup: Palvento is self-serve and live in under 10 minutes. Linnworks takes 40 days average with a dedicated implementation specialist.\n• AI: Palvento includes an AI listing optimiser, an autonomous AI agent with autopilot mode, and demand forecasting. Linnworks has basic task automation, no AI listing writer.\n• Profit tracking: Palvento calculates true net profit after all fees, COGS, postage, and sales tax/VAT. Linnworks shows order revenue but not true margin.\n• Procurement: Both support purchase orders and supplier management. Palvento's forecasting module calculates reorder quantities automatically from 90-day sales velocity.\n• Developer API: Both offer API access. Palvento includes webhooks on Growth and above. Linnworks charges for API access as an add-on.\n• Free trial: Palvento offers 14 days free, no card required. Linnworks offers demos only.`,
          },
          {
            h: 'The switching process: what to expect',
            body: `Switching from Linnworks is less painful than most people expect:\n\n1. Export your product catalogue from Linnworks (CSV export is straightforward)\n2. Connect your channels to Palvento via OAuth — takes 2–3 minutes per channel\n3. Your orders, inventory, and listings populate automatically\n4. Import your supplier and product cost data\n5. Set up your repricing rules and feed rules to match your existing logic\n\nMost sellers are fully operational within a day. The main complexity is replicating any custom feed rules or repricing logic you've built in Linnworks — Palvento's rules engine is comparable, so it's mostly a copy-and-rebuild exercise.`,
          },
        ].map(({ h, body }) => (
          <div key={h} style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '14px' }}>{h}</h2>
            {body.split('\n\n').map((para, i) => (
              para.startsWith('•') ? (
                <ul key={i} style={{ paddingLeft: '24px', margin: '0 0 14px' }}>
                  {para.split('\n').filter(l => l.startsWith('•')).map((line, j) => (
                    <li key={j} style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, marginBottom: '4px' }}>{line.replace('• ', '')}</li>
                  ))}
                </ul>
              ) : para.match(/^\d\./) ? (
                <ol key={i} style={{ paddingLeft: '24px', margin: '0 0 14px' }}>
                  {para.split('\n').filter(l => l.match(/^\d\./)).map((line, j) => (
                    <li key={j} style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, marginBottom: '4px' }}>{line.replace(/^\d\.\s/, '')}</li>
                  ))}
                </ol>
              ) : (
                <p key={i} style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>{para}</p>
              )
            ))}
          </div>
        ))}

        <div style={{ background: '#ede9fe', borderRadius: '10px', padding: '24px', marginTop: '24px', marginBottom: '48px' }}>
          <strong style={{ display: 'block', marginBottom: '8px', fontSize: '16px' }}>Switch from Linnworks in a day</strong>
          <p style={{ fontSize: '14px', color: '#4c1d95', margin: '0 0 16px', lineHeight: 1.6 }}>14-day free trial. No credit card. Live in under 10 minutes — not 40 days.</p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link href="/signup" style={{ display: 'inline-block', padding: '10px 24px', borderRadius: '7px', background: '#e8863f', color: '#fff', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>Start free trial →</Link>
            <Link href="/vs/linnworks" style={{ display: 'inline-block', padding: '10px 24px', borderRadius: '7px', background: 'white', color: '#e8863f', fontSize: '14px', fontWeight: 600, textDecoration: 'none', border: '1px solid #c4b5fd' }}>Full comparison →</Link>
          </div>
        </div>
      </article>
    </div>
  )
}
