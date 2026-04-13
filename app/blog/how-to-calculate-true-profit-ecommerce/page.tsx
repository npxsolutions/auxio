import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'How to Calculate True Ecommerce Profit (Not Just Revenue) — UK Seller Guide',
  description: 'Most ecommerce sellers overestimate their profit by 15–30% because they don\'t account for all fees. Here\'s the complete formula for calculating true net profit per order — with worked examples for eBay, Amazon, and Shopify.',
  keywords: ['ecommerce profit calculation UK', 'how to calculate ecommerce profit', 'eBay profit calculator', 'Amazon profit calculator', 'true profit ecommerce', 'net margin ecommerce UK', 'profit after fees ecommerce'],
}

const TABLE_ROWS = [
  { label: 'Selling price', example: '£25.00', notes: 'What the buyer paid' },
  { label: 'eBay final value fee (12.9%)', example: '–£3.23', notes: 'Varies by category' },
  { label: 'eBay international fee (1.65%)', example: '–£0.41', notes: 'If buyer is outside UK' },
  { label: 'PayPal/payment processing (1.9% + £0.30)', example: '–£0.78', notes: 'Or Stripe/Klarna fees' },
  { label: 'Cost of goods (COGS)', example: '–£8.00', notes: 'What you paid the supplier' },
  { label: 'Postage (Royal Mail tracked)', example: '–£3.40', notes: 'Your actual shipping cost' },
  { label: 'Packaging materials', example: '–£0.45', notes: 'Bag, bubble wrap, label' },
  { label: 'VAT (20% of profit if VAT registered)', example: '–£1.79', notes: 'If you\'re VAT registered' },
  { label: 'Advertising (PPC allocated per order)', example: '–£0.80', notes: 'If you run eBay/Amazon ads' },
  { label: 'True net profit', example: '£6.14', notes: '24.5% net margin' },
]

export default function BlogPostPage() {
  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#fff', color: '#0f172a' }}>

      <nav style={{ borderBottom: '1px solid #e2e8f0', padding: '0 48px', height: '58px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a', textDecoration: 'none' }}>Auxio</Link>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/blog" style={{ fontSize: '13px', color: '#64748b', textDecoration: 'none', padding: '7px 14px' }}>← All guides</Link>
          <Link href="/signup" style={{ padding: '7px 16px', borderRadius: '7px', background: '#5b52f5', fontSize: '13px', color: '#fff', textDecoration: 'none', fontWeight: 600 }}>Start free →</Link>
        </div>
      </nav>

      <article style={{ maxWidth: '760px', margin: '0 auto', padding: '64px 48px 96px' }}>
        <div style={{ marginBottom: '32px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#5b52f5', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Seller Guide · 2026</span>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15, marginTop: '12px', marginBottom: '20px' }}>
            How to Calculate True Ecommerce Profit (Not Just Revenue)
          </h1>
          <p style={{ fontSize: '18px', color: '#475569', lineHeight: 1.7 }}>
            Most ecommerce sellers think they're more profitable than they are. That's because revenue is easy to see — it shows up as the order total in your dashboard. True profit is harder to calculate because it requires tracking seven or eight separate cost components per order. Here's the complete formula, with worked examples for eBay, Amazon, and Shopify.
          </p>
          <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: '#94a3b8', marginTop: '16px' }}>
            <span>April 2026</span><span>·</span><span>10 min read</span>
          </div>
        </div>

        <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '16px' }}>The true profit formula</h2>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px 24px', marginBottom: '32px', fontFamily: 'monospace', fontSize: '14px', lineHeight: 2, color: '#334155' }}>
          <div>True Profit = Selling Price</div>
          <div style={{ paddingLeft: '24px' }}>− Marketplace fees (FVF, referral fee, category fee)</div>
          <div style={{ paddingLeft: '24px' }}>− Payment processing fees</div>
          <div style={{ paddingLeft: '24px' }}>− Cost of goods (COGS)</div>
          <div style={{ paddingLeft: '24px' }}>− Postage &amp; fulfilment cost</div>
          <div style={{ paddingLeft: '24px' }}>− Packaging materials</div>
          <div style={{ paddingLeft: '24px' }}>− Advertising spend (allocated per unit)</div>
          <div style={{ paddingLeft: '24px' }}>− VAT liability (if VAT registered)</div>
          <div style={{ fontWeight: 700, color: '#059669', marginTop: '8px' }}>= Net profit per order</div>
        </div>

        <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '16px' }}>Worked example: £25 item on eBay</h2>
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', marginBottom: '32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', background: '#f8fafc', padding: '10px 16px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', gap: '12px', borderBottom: '1px solid #e2e8f0' }}>
            <span>Line item</span><span style={{ textAlign: 'right' }}>Amount</span><span>Notes</span>
          </div>
          {TABLE_ROWS.map((row, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', padding: '10px 16px', borderBottom: i < TABLE_ROWS.length - 1 ? '1px solid #f1f5f9' : 'none', gap: '12px', alignItems: 'center', background: row.label === 'True net profit' ? '#f0fdf4' : 'white' }}>
              <span style={{ fontSize: '14px', color: '#334155', fontWeight: row.label === 'True net profit' ? 700 : 400 }}>{row.label}</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: row.example.startsWith('–') ? '#dc2626' : '#059669', textAlign: 'right', whiteSpace: 'nowrap' }}>{row.example}</span>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>{row.notes}</span>
            </div>
          ))}
        </div>

        {[
          { h: 'The fees that catch sellers out', body: `The costs most sellers forget or undercount:\n\n• International buyer surcharge: eBay charges an additional 1.65% when the buyer is outside the UK. If 20% of your eBay sales are to EU buyers, this adds up fast.\n• Promotional listing fees: eBay's Promoted Listings can add 5–15% of the sale price. Track this per SKU, not as a blended average.\n• Returns cost: A 5% return rate means 1 in 20 items needs to be re-posted or refunded. This rarely appears in profit calculations.\n• FBA fulfilment fees (Amazon): FBA fees include pick, pack, weight handling, and monthly storage. A heavy item in oversized can cost £5–£8 to fulfil through FBA — before the referral fee.\n• Duty and import costs: If you import from China or other non-UK countries, import duty and shipping from supplier needs to be in your COGS — not treated as a one-off.` },
          { h: 'Amazon vs eBay: the fee difference', body: `Amazon and eBay have different fee structures, which means the same product can have a very different margin on each platform:\n\n• eBay: Final value fee (8–15% depending on category) + payment processing (approx 2%) + any promotional fees. Total: typically 10–17% of selling price.\n• Amazon FBM (seller-fulfilled): Referral fee (6–15% depending on category) + no FBA fee. Total: typically 7–16% of selling price.\n• Amazon FBA: Referral fee + FBA fulfilment fee (£3–£10 depending on size/weight) + storage fee. Total: typically 20–35% of selling price for standard items.\n\nThe implication: a product with a 30% gross margin sold on FBA may have only a 10–15% net margin after all Amazon fees. This is why sellers often discover their FBA margins are far lower than their eBay margins for the same product.` },
          { h: 'How to track this automatically', body: `Manually calculating this per order is impractical at scale. The right approach is:\n\n1. Use a platform that ingests your actual marketplace fee data (not estimated rates) from eBay and Amazon reporting APIs\n2. Set a cost price (COGS) for every SKU in your system\n3. Connect your shipping carrier to pull actual postage costs per order\n4. Set your advertising spend as a percentage or fixed amount per SKU based on your campaign data\n\nPlatforms like Auxio do this automatically — pulling in actual fees from channel APIs, calculating true net profit per order, and surfacing your real margin by channel, SKU, and month. The goal is to know your real P&L in 30 seconds, not 30 minutes.` },
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
          <strong style={{ display: 'block', marginBottom: '8px', fontSize: '16px' }}>See your true profit in 10 minutes</strong>
          <p style={{ fontSize: '14px', color: '#4c1d95', margin: '0 0 16px', lineHeight: 1.6 }}>Auxio pulls in real fee data from your channels and calculates true net profit automatically. Most sellers discover their margin is 15–30% lower than they thought — and know exactly which listings to fix.</p>
          <Link href="/signup" style={{ display: 'inline-block', padding: '10px 24px', borderRadius: '7px', background: '#5b52f5', color: '#fff', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>Start free trial →</Link>
        </div>

        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '32px' }}>
          <strong style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '12px' }}>Related guides</strong>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Link href="/blog/multichannel-inventory-management-software-uk" style={{ fontSize: '14px', color: '#5b52f5', textDecoration: 'none' }}>Best multichannel inventory management software for UK sellers →</Link>
            <Link href="/blog/what-is-a-commerce-operations-platform" style={{ fontSize: '14px', color: '#5b52f5', textDecoration: 'none' }}>What is a Commerce Operations Platform? →</Link>
          </div>
        </div>
      </article>
    </div>
  )
}
