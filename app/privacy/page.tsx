import Link from 'next/link'

export default function PrivacyPolicy() {
  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#ffffff', color: '#0f172a' }}>

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e8e8e5', padding: '0 48px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #e8863f, #e8863f)', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '13px' }}>A</div>
          <span style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a', letterSpacing: '-0.01em' }}>Palvento</span>
        </Link>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/login" style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#374151', textDecoration: 'none', fontWeight: 500 }}>Log in</Link>
          <Link href="/signup" style={{ padding: '8px 16px', borderRadius: '8px', background: '#0f172a', fontSize: '13px', color: 'white', textDecoration: 'none', fontWeight: 500 }}>Start free →</Link>
        </div>
      </nav>

    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '100px 48px 80px' }}>
      <h1 style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px', color: '#0f172a' }}>Privacy Policy</h1>
      <p style={{ color: '#64748b', marginBottom: '48px', fontSize: '14px' }}>Last updated: 1 April 2026</p>

      <p style={{ marginBottom: '32px' }}>
        Palvento ("we", "our", "us") is operated by NPX Solutions. This policy explains what data we collect, why we collect it, and how we use it. If you have questions, contact us at <a href="mailto:info@npx-solutions.com" style={{ color: '#191919' }}>info@npx-solutions.com</a>.
      </p>

      {/* Your rights — surfaces DSAR endpoints + security page for GDPR fulfilment. */}
      <section style={{ marginBottom: '40px', padding: '20px 22px', background: '#f8f7f3', border: '1px solid #e8e8e5', borderRadius: '10px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0, marginBottom: '8px', letterSpacing: '-0.01em' }}>Your rights</h2>
        <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.7, margin: 0, marginBottom: '14px' }}>
          Exercise your GDPR rights in one click. No forms, no waiting.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <Link href="/settings#privacy" style={{ fontSize: '13px', padding: '8px 14px', background: '#0f172a', color: 'white', borderRadius: '7px', textDecoration: 'none', fontWeight: 500 }}>Export my data →</Link>
          <Link href="/settings#privacy" style={{ fontSize: '13px', padding: '8px 14px', background: 'white', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '7px', textDecoration: 'none', fontWeight: 500 }}>Delete my account →</Link>
          <Link href="/security" style={{ fontSize: '13px', padding: '8px 14px', background: 'white', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '7px', textDecoration: 'none', fontWeight: 500 }}>Security overview →</Link>
        </div>
      </section>

      <Section title="1. Who we are">
        <p>Palvento is a multi-channel product listing management platform that connects ecommerce sellers with marketplaces including Shopify, eBay, and Amazon. We are based in the United Kingdom.</p>
      </Section>

      <Section title="2. Data we collect">
        <p><strong>Account data</strong> — your name, email address, and password when you create an account.</p>
        <p><strong>Channel credentials</strong> — OAuth tokens for Shopify, eBay, and Amazon that you authorise when connecting a sales channel. These are stored encrypted and used only to manage your listings on your behalf.</p>
        <p><strong>Product and listing data</strong> — titles, descriptions, prices, images, and inventory levels that you enter or import into Palvento.</p>
        <p><strong>Transaction data</strong> — order and sales data pulled from your connected channels to generate performance reporting.</p>
        <p><strong>Usage data</strong> — pages visited, features used, and actions taken within the Palvento dashboard, collected to improve the product.</p>
        <p><strong>Payment data</strong> — billing is processed by Stripe. We do not store your card details. Stripe's privacy policy applies to payment processing.</p>
      </Section>

      <Section title="3. How we use your data">
        <ul style={{ paddingLeft: '20px' }}>
          <li>To operate the Palvento service — publish listings, sync inventory, and generate AI-optimised content on your behalf</li>
          <li>To send transactional emails — account confirmations, alerts, and billing receipts</li>
          <li>To provide customer support</li>
          <li>To improve the product based on usage patterns</li>
          <li>To comply with legal obligations</li>
        </ul>
        <p>We do not sell your data to third parties. We do not use your product or sales data to train AI models without your explicit consent.</p>
      </Section>

      <Section title="4. Third-party services">
        <p>Palvento integrates with the following third-party services, each governed by their own privacy policies:</p>
        <ul style={{ paddingLeft: '20px' }}>
          <li><strong>Supabase</strong> — database and authentication</li>
          <li><strong>Stripe</strong> — payment processing</li>
          <li><strong>Anthropic</strong> — AI content generation (listing titles and descriptions)</li>
          <li><strong>eBay</strong> — marketplace integration via eBay OAuth</li>
          <li><strong>Shopify</strong> — marketplace integration via Shopify OAuth</li>
          <li><strong>Amazon</strong> — marketplace integration via Amazon SP-API</li>
          <li><strong>Vercel</strong> — hosting and infrastructure</li>
        </ul>
      </Section>

      <Section title="5. eBay data use">
        <p>When you connect your eBay account, Palvento requests access to manage your inventory, listings, and fulfilment data. This access is used solely to:</p>
        <ul style={{ paddingLeft: '20px' }}>
          <li>Create, update, and publish product listings on your behalf</li>
          <li>Read your inventory levels and order data for reporting</li>
          <li>Sync price and quantity changes across channels</li>
        </ul>
        <p>We do not share your eBay data with any third party outside of the services listed in Section 4. When you disconnect eBay or delete your account, your eBay tokens are deleted from our systems immediately.</p>
      </Section>

      <Section title="6. Data retention">
        <p>We retain your account data for as long as your account is active. If you delete your account, we delete your personal data within 30 days, except where retention is required by law (e.g. billing records for 7 years under  law).</p>
        <p>Channel OAuth tokens are deleted immediately when you disconnect a channel or delete your account.</p>
      </Section>

      <Section title="7. Your rights (GDPR)">
        <p>If you are based in the  or EEA, you have the right to:</p>
        <ul style={{ paddingLeft: '20px' }}>
          <li>Access the personal data we hold about you</li>
          <li>Correct inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Object to or restrict how we process your data</li>
          <li>Data portability — receive your data in a machine-readable format</li>
        </ul>
        <p>To exercise any of these rights, email <a href="mailto:info@npx-solutions.com" style={{ color: '#191919' }}>info@npx-solutions.com</a>. We will respond within 30 days.</p>
      </Section>

      <Section title="8. Cookies">
        <p>Palvento uses session cookies for authentication (managed by Supabase) and no third-party tracking cookies. We do not use advertising cookies or cross-site tracking.</p>
      </Section>

      <Section title="9. Security">
        <p>We use industry-standard security practices including encrypted storage of credentials, HTTPS for all data in transit, and role-based access controls. OAuth tokens are stored encrypted at rest.</p>
      </Section>

      <Section title="10. Changes to this policy">
        <p>We may update this policy from time to time. We will notify you by email if we make material changes. Continued use of Palvento after changes are posted constitutes acceptance.</p>
      </Section>

      <Section title="11. Contact">
        <p>
          NPX Solutions<br />
          United Kingdom<br />
          <a href="mailto:info@npx-solutions.com" style={{ color: '#e8863f', textDecoration: 'none' }}>info@npx-solutions.com</a>
        </p>
      </Section>
    </div>

      <footer style={{ background: '#0f172a', padding: '32px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>© 2026 Palvento. All rights reserved.</span>
        <div style={{ display: 'flex', gap: '24px' }}>
          {[['Privacy', '/privacy'], ['Terms', '/terms'], ['Features', '/features'], ['Pricing', '/pricing']].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>{l}</Link>
          ))}
        </div>
      </footer>

      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } p { margin-bottom: 12px; }`}</style>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '40px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '12px', marginTop: 0, letterSpacing: '-0.01em' }}>{title}</h2>
      <div style={{ fontSize: '15px', color: '#374151', lineHeight: 1.8 }}>{children}</div>
    </section>
  )
}
