import { Zap } from 'lucide-react';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer style={{
      background: '#000000',
      borderTop: '1px solid transparent',
      borderImage: 'linear-gradient(90deg, transparent, rgba(255, 255, 255,0.3), transparent) 1',
      marginTop: 'auto',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '3rem 1.5rem 2rem' }}>
        {/* Top row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2.5rem', marginBottom: '2.5rem' }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <img
                src="/vippro-logo.png?v=4"
                alt="VipPro"
                style={{
                  width: 34, height: 34, borderRadius: '50%',
                  objectFit: 'cover',
                }}
              />
              <span style={{ color: '#fff', fontWeight: 800, fontSize: '1rem' }}>
                VipPro <span className="gradient-text">Boosts</span>
              </span>
            </div>
            <p style={{ color: '#9A9A9E', fontSize: '0.85rem', lineHeight: 1.6, maxWidth: 240 }}>
              Premium Discord boosts, Nitro tokens, and Discord accounts. Fast delivery, real accounts.
            </p>
            <p style={{ color: '#6a6a6e', fontSize: '0.8rem', marginTop: '0.6rem' }}>
              Part of the <a href="https://sessionguardvip.cc" target="_blank" rel="noopener noreferrer" style={{ color: '#FFFFFF', textDecoration: 'none' }}>VipPro</a> family.
            </p>
          </div>

          {/* Products */}
          <div>
            <h4 style={{ color: '#fff', fontWeight: 700, marginBottom: '1rem', fontSize: '0.9rem' }}>Products</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {['Server Boost - 1 Month', 'Nitro Tokens', 'Discord Tokens'].map((p) => (
                <li key={p}>
                  <a href="/#products" style={{ color: '#9A9A9E', textDecoration: 'none', fontSize: '0.87rem', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#9A9A9E')}>
                    {p}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 style={{ color: '#fff', fontWeight: 700, marginBottom: '1rem', fontSize: '0.9rem' }}>Legal</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {[
                { label: 'Terms of Service', href: '/tos' },
                { label: 'Privacy Policy',   href: '/privacy' },
                { label: 'Refund Policy',    href: '/refund' },
              ].map((l) => (
                <li key={l.label}>
                  <a href={l.href} style={{ color: '#9A9A9E', textDecoration: 'none', fontSize: '0.87rem', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#9A9A9E')}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 style={{ color: '#fff', fontWeight: 700, marginBottom: '1rem', fontSize: '0.9rem' }}>Support</h4>
            <p style={{ color: '#9A9A9E', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: 1.5 }}>
              All support is handled via our Discord community.
            </p>
            <a
              href="https://discord.gg/275XqNhvwa"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-discord"
              style={{ fontSize: '0.85rem', padding: '0.5rem 1.1rem', borderRadius: 8, display: 'inline-flex' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.031.053a19.9 19.9 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
              </svg>
              Open a Ticket
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: '1.5rem',
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem',
        }}>
          <p style={{ color: '#6a6a6e', fontSize: '0.82rem', margin: 0 }}>
            © {year} VipPro. All rights reserved. boost.sessionguardvip.cc
          </p>
          <p style={{ color: '#6a6a6e', fontSize: '0.78rem', margin: 0 }}>
            This site is not affiliated with or endorsed by Discord Inc.
          </p>
        </div>
      </div>
    </footer>
  );
}
