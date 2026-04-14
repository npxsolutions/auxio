'use client'

import Link from 'next/link'
import { useState } from 'react'

const NAV = [
  { label: 'Features',     href: '/features' },
  { label: 'Integrations', href: '/integrations' },
  { label: 'Pricing',      href: '/pricing' },
  { label: 'Blog',          href: '/blog' },
  { label: 'About',        href: '/about' },
]

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', company: '', channels: '', message: '', type: 'demo' })
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    // Simulate — replace with real endpoint
    await new Promise(r => setTimeout(r, 1000))
    setSent(true)
    setSending(false)
  }

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#ffffff', color: '#0f172a' }}>

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e8e8e5', padding: '0 48px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #5b52f5, #7c6af7)', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '13px' }}>A</div>
          <span style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a', letterSpacing: '-0.01em' }}>Meridia</span>
        </Link>
        <div style={{ display: 'flex', gap: '32px' }}>
          {NAV.map(n => (
            <Link key={n.href} href={n.href} style={{ fontSize: '14px', color: '#64748b', textDecoration: 'none' }}>{n.label}</Link>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/login" style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#374151', textDecoration: 'none', fontWeight: 500 }}>Log in</Link>
          <Link href="/signup" style={{ padding: '8px 16px', borderRadius: '8px', background: '#0f172a', fontSize: '13px', color: 'white', textDecoration: 'none', fontWeight: 500 }}>Start free →</Link>
        </div>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '120px 48px 80px', display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '80px', alignItems: 'start' }}>

        {/* Left: Info */}
        <div>
          <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '20px', background: 'rgba(91,82,245,0.08)', border: '1px solid rgba(91,82,245,0.15)', fontSize: '12px', color: '#5b52f5', fontWeight: 600, marginBottom: '20px', letterSpacing: '0.02em' }}>
            GET IN TOUCH
          </div>
          <h1 style={{ fontSize: '44px', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '20px', color: '#0f172a' }}>
            Let's talk about your operation
          </h1>
          <p style={{ fontSize: '16px', color: '#64748b', lineHeight: 1.7, marginBottom: '40px' }}>
            Whether you want a demo, have questions about Enterprise pricing, or want to request an integration — drop us a message and we'll get back to you within one business day.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {[
              { icon: '📩', title: 'General enquiries', desc: 'hello@auxio.io' },
              { icon: '🏢', title: 'Enterprise sales', desc: 'enterprise@auxio.io' },
              { icon: '🛠️', title: 'Technical support', desc: 'support@auxio.io' },
            ].map(c => (
              <div key={c.title} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>{c.icon}</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>{c.title}</div>
                  <div style={{ fontSize: '13px', color: '#5b52f5' }}>{c.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '40px', padding: '20px', background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.15)', borderRadius: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#d97706', marginBottom: '6px' }}>🔥 Founding member spots</div>
            <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>27 of 50 founding member spots still available at up to 40% off. No code needed — just sign up and the discount applies automatically.</div>
            <Link href="/signup" style={{ display: 'inline-block', marginTop: '12px', fontSize: '13px', fontWeight: 600, color: '#d97706', textDecoration: 'none' }}>Claim your spot →</Link>
          </div>
        </div>

        {/* Right: Form */}
        <div style={{ background: 'white', border: '1px solid #e8e8e5', borderRadius: '16px', padding: '40px' }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
              <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Message received</h3>
              <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.6 }}>We'll be in touch within one business day. In the meantime, feel free to start your free trial.</p>
              <Link href="/signup" style={{ display: 'inline-block', marginTop: '24px', padding: '12px 24px', borderRadius: '8px', background: 'linear-gradient(135deg, #5b52f5, #7c6af7)', color: 'white', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>Start free trial →</Link>
            </div>
          ) : (
            <form onSubmit={submit}>
              {/* Type toggle */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                {[['demo', 'Book a demo'], ['question', 'Ask a question'], ['enterprise', 'Enterprise']].map(([v, l]) => (
                  <button key={v} type="button" onClick={() => setForm(f => ({ ...f, type: v }))} style={{ padding: '8px 14px', borderRadius: '8px', border: `1px solid ${form.type === v ? '#5b52f5' : '#e2e8f0'}`, background: form.type === v ? 'rgba(91,82,245,0.08)' : 'white', color: form.type === v ? '#5b52f5' : '#64748b', fontSize: '13px', fontWeight: form.type === v ? 600 : 400, cursor: 'pointer', flex: 1 }}>
                    {l}
                  </button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                {[['name', 'Your name', 'text'], ['email', 'Work email', 'email']].map(([field, ph, type]) => (
                  <div key={field}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px', textTransform: 'capitalize' }}>{field === 'email' ? 'Email' : 'Name'}</label>
                    <input
                      type={type}
                      required
                      placeholder={ph}
                      value={(form as any)[field]}
                      onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#0f172a', outline: 'none', background: 'white' }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Company (optional)</label>
                <input
                  type="text"
                  placeholder="Your business name"
                  value={form.company}
                  onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#0f172a', outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Which channels do you sell on?</label>
                <input
                  type="text"
                  placeholder="e.g. eBay, Amazon, Shopify"
                  value={form.channels}
                  onChange={e => setForm(f => ({ ...f, channels: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#0f172a', outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Message</label>
                <textarea
                  required
                  rows={4}
                  placeholder={form.type === 'demo' ? "Tell us about your current setup and what you're looking to improve…" : form.type === 'enterprise' ? "Tell us about your catalogue size, channel count, and any specific requirements…" : "What would you like to know?"}
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#0f172a', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                style={{ width: '100%', padding: '14px', borderRadius: '8px', background: 'linear-gradient(135deg, #5b52f5, #7c6af7)', color: 'white', fontSize: '15px', fontWeight: 600, border: 'none', cursor: sending ? 'wait' : 'pointer', opacity: sending ? 0.7 : 1 }}
              >
                {sending ? 'Sending…' : form.type === 'demo' ? 'Book demo →' : 'Send message →'}
              </button>

              <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', marginTop: '12px' }}>We typically reply within 1 business day.</p>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: '#0f172a', padding: '32px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>© 2026 Meridia. All rights reserved.</span>
        <div style={{ display: 'flex', gap: '24px' }}>
          {[['Privacy', '/privacy'], ['Terms', '/terms'], ['Features', '/features'], ['Pricing', '/pricing'], ['Login', '/login']].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>{l}</Link>
          ))}
        </div>
      </footer>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder, textarea::placeholder { color: #94a3b8; }
        input:focus, textarea:focus { border-color: #5b52f5 !important; box-shadow: 0 0 0 3px rgba(91,82,245,0.1); }
      `}</style>
    </div>
  )
}
