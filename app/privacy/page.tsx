export default function PrivacyPolicy() {
  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '64px 24px', fontFamily: 'system-ui, sans-serif', color: '#191919', lineHeight: 1.7 }}>
      <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>Privacy Policy</h1>
      <p style={{ color: '#787774', marginBottom: '48px', fontSize: '14px' }}>Last updated: 1 April 2026</p>

      <p style={{ marginBottom: '32px' }}>
        Auxio ("we", "our", "us") is operated by NPX Solutions. This policy explains what data we collect, why we collect it, and how we use it. If you have questions, contact us at <a href="mailto:info@npx-solutions.com" style={{ color: '#191919' }}>info@npx-solutions.com</a>.
      </p>

      <Section title="1. Who we are">
        <p>Auxio is a multi-channel product listing management platform that connects ecommerce sellers with marketplaces including Shopify, eBay, and Amazon. We are based in the United Kingdom.</p>
      </Section>

      <Section title="2. Data we collect">
        <p><strong>Account data</strong> — your name, email address, and password when you create an account.</p>
        <p><strong>Channel credentials</strong> — OAuth tokens for Shopify, eBay, and Amazon that you authorise when connecting a sales channel. These are stored encrypted and used only to manage your listings on your behalf.</p>
        <p><strong>Product and listing data</strong> — titles, descriptions, prices, images, and inventory levels that you enter or import into Auxio.</p>
        <p><strong>Transaction data</strong> — order and sales data pulled from your connected channels to generate performance reporting.</p>
        <p><strong>Usage data</strong> — pages visited, features used, and actions taken within the Auxio dashboard, collected to improve the product.</p>
        <p><strong>Payment data</strong> — billing is processed by Stripe. We do not store your card details. Stripe's privacy policy applies to payment processing.</p>
      </Section>

      <Section title="3. How we use your data">
        <ul style={{ paddingLeft: '20px' }}>
          <li>To operate the Auxio service — publish listings, sync inventory, and generate AI-optimised content on your behalf</li>
          <li>To send transactional emails — account confirmations, alerts, and billing receipts</li>
          <li>To provide customer support</li>
          <li>To improve the product based on usage patterns</li>
          <li>To comply with legal obligations</li>
        </ul>
        <p>We do not sell your data to third parties. We do not use your product or sales data to train AI models without your explicit consent.</p>
      </Section>

      <Section title="4. Third-party services">
        <p>Auxio integrates with the following third-party services, each governed by their own privacy policies:</p>
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
        <p>When you connect your eBay account, Auxio requests access to manage your inventory, listings, and fulfilment data. This access is used solely to:</p>
        <ul style={{ paddingLeft: '20px' }}>
          <li>Create, update, and publish product listings on your behalf</li>
          <li>Read your inventory levels and order data for reporting</li>
          <li>Sync price and quantity changes across channels</li>
        </ul>
        <p>We do not share your eBay data with any third party outside of the services listed in Section 4. When you disconnect eBay or delete your account, your eBay tokens are deleted from our systems immediately.</p>
      </Section>

      <Section title="6. Data retention">
        <p>We retain your account data for as long as your account is active. If you delete your account, we delete your personal data within 30 days, except where retention is required by law (e.g. billing records for 7 years under UK law).</p>
        <p>Channel OAuth tokens are deleted immediately when you disconnect a channel or delete your account.</p>
      </Section>

      <Section title="7. Your rights (UK GDPR)">
        <p>If you are based in the UK or EEA, you have the right to:</p>
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
        <p>Auxio uses session cookies for authentication (managed by Supabase) and no third-party tracking cookies. We do not use advertising cookies or cross-site tracking.</p>
      </Section>

      <Section title="9. Security">
        <p>We use industry-standard security practices including encrypted storage of credentials, HTTPS for all data in transit, and role-based access controls. OAuth tokens are stored encrypted at rest.</p>
      </Section>

      <Section title="10. Changes to this policy">
        <p>We may update this policy from time to time. We will notify you by email if we make material changes. Continued use of Auxio after changes are posted constitutes acceptance.</p>
      </Section>

      <Section title="11. Contact">
        <p>
          NPX Solutions<br />
          United Kingdom<br />
          <a href="mailto:info@npx-solutions.com" style={{ color: '#191919' }}>info@npx-solutions.com</a>
        </p>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '40px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px', marginTop: 0 }}>{title}</h2>
      <div style={{ fontSize: '15px', color: '#3d3d3a' }}>{children}</div>
    </section>
  )
}
