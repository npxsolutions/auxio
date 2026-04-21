import Link from 'next/link'

export default function TermsPage() {
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
        <h1 style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px', color: '#0f172a' }}>Terms of Service</h1>
        <p style={{ color: '#64748b', marginBottom: '48px', fontSize: '14px' }}>Last updated: 9 April 2026</p>

        <p style={{ fontSize: '15px', color: '#374151', lineHeight: 1.8, marginBottom: '32px' }}>
          These Terms of Service ("Terms") govern your use of Palvento, operated by NPX Solutions ("we", "our", "us"). By creating an account or using the Palvento platform, you agree to these Terms. If you do not agree, do not use the service.
        </p>

        <Section title="1. The service">
          <p>Palvento is a multi-channel product listing management and analytics platform. We provide tools to create, manage, and publish product listings across multiple sales channels, track profit and performance, and generate AI-assisted insights.</p>
          <p>We reserve the right to modify, suspend, or discontinue any part of the service at any time with reasonable notice to users.</p>
        </Section>

        <Section title="2. Accounts">
          <p>You must be at least 18 years old and operate a legitimate business to create an Palvento account. You are responsible for maintaining the security of your account credentials and for all activity that occurs under your account.</p>
          <p>You must provide accurate information when registering. We may terminate accounts that provide false information or violate these Terms.</p>
        </Section>

        <Section title="3. Subscriptions and billing">
          <p>Palvento offers paid subscription plans (Starter, Growth, Scale) and an Enterprise plan with custom pricing. Prices are shown inclusive of VAT where applicable.</p>
          <p><strong>Free trial</strong> — new accounts receive a 14-day free trial. No card is required to start. At the end of the trial, you must subscribe to continue using paid features.</p>
          <p><strong>Founding member pricing</strong> — accounts that subscribe during the founding member period receive the discounted rate for the lifetime of their subscription, as long as it remains active and is not downgraded below the founding tier.</p>
          <p><strong>Billing</strong> — subscriptions are billed monthly or annually in advance. All payments are processed by Stripe. We do not store your card details.</p>
          <p><strong>Refunds</strong> — we do not offer refunds for partial months. If you cancel, your subscription remains active until the end of the current billing period. Annual plans cancelled within 14 days of renewal are eligible for a pro-rata refund of unused months.</p>
          <p><strong>Price changes</strong> — we will give at least 30 days' notice of price increases. Founding member rates are protected as described above.</p>
        </Section>

        <Section title="4. Acceptable use">
          <p>You agree not to use Palvento to:</p>
          <ul>
            <li>Violate any applicable law or regulation</li>
            <li>List counterfeit, stolen, or prohibited goods on any marketplace</li>
            <li>Infringe the intellectual property rights of others</li>
            <li>Attempt to gain unauthorised access to our systems or other users' accounts</li>
            <li>Resell or sublicense access to Palvento without our written permission</li>
            <li>Use automated scripts to scrape or abuse our APIs beyond normal product usage</li>
            <li>Use AI-generated listing content in ways that violate marketplace policies</li>
          </ul>
          <p>Violation of these rules may result in immediate account suspension without refund.</p>
        </Section>

        <Section title="5. Channel integrations">
          <p>By connecting a third-party channel (eBay, Amazon, Shopify, etc.), you authorise Palvento to act on your behalf to manage listings, inventory, and fulfilment data within that channel. You are solely responsible for compliance with each channel's own terms of service.</p>
          <p>We are not responsible for actions taken by marketplace platforms, including listing removals, account restrictions, or policy enforcement decisions made by those platforms.</p>
        </Section>

        <Section title="6. AI-generated content">
          <p>Palvento uses AI to generate listing titles, descriptions, and recommendations. You are responsible for reviewing and approving AI-generated content before publishing. We do not guarantee that AI-generated content will comply with any particular marketplace's listing policies, be free of errors, or achieve any particular commercial outcome.</p>
          <p>AI-generated content is provided as a tool, not as professional or legal advice.</p>
        </Section>

        <Section title="7. Intellectual property">
          <p>You retain ownership of all product data, images, and content you upload to Palvento. By using the service, you grant us a limited licence to process, store, and display that content solely for the purpose of providing the Palvento service.</p>
          <p>The Palvento platform, software, branding, and documentation are owned by NPX Solutions. You may not copy, modify, or distribute them without our written consent.</p>
        </Section>

        <Section title="8. Data and privacy">
          <p>Our use of your data is governed by our <Link href="/privacy" style={{ color: '#e8863f', textDecoration: 'none' }}>Privacy Policy</Link>, which forms part of these Terms. By using Palvento, you consent to the data practices described there.</p>
        </Section>

        <Section title="9. Limitation of liability">
          <p>To the maximum extent permitted by law, NPX Solutions shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising from your use of or inability to use Palvento.</p>
          <p>Our total liability for any claim arising from your use of Palvento shall not exceed the total fees you paid to us in the 3 months preceding the claim.</p>
          <p>Nothing in these Terms limits liability for death or personal injury caused by our negligence, fraud, or any liability that cannot be excluded by  law.</p>
        </Section>

        <Section title="10. Warranties">
          <p>Palvento is provided "as is" and "as available". We do not warrant that the service will be uninterrupted, error-free, or secure. We make no warranties about the accuracy of AI-generated content or the performance of any sales channel integration.</p>
          <p>We aim for 99.5% uptime but do not offer a formal SLA on plans below Enterprise.</p>
        </Section>

        <Section title="11. Termination">
          <p>You may cancel your account at any time from the billing settings page. We may terminate or suspend your account with 30 days' notice, or immediately for material breach of these Terms.</p>
          <p>Upon termination, we will delete your data within 30 days, except where retention is required by law.</p>
        </Section>

        <Section title="12. Governing law">
          <p>These Terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>
        </Section>

        <Section title="13. Changes to these terms">
          <p>We may update these Terms from time to time. We will notify you by email at least 14 days before material changes take effect. Continued use of Palvento after changes take effect constitutes acceptance of the new Terms.</p>
        </Section>

        <Section title="14. Contact">
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

      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } p { margin-bottom: 14px; } ul { padding-left: 20px; margin-bottom: 14px; } ul li { margin-bottom: 6px; font-size: 15px; color: #374151; line-height: 1.7; }`}</style>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '40px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '14px', marginTop: 0, letterSpacing: '-0.01em' }}>{title}</h2>
      <div style={{ fontSize: '15px', color: '#374151', lineHeight: 1.8 }}>{children}</div>
    </section>
  )
}
