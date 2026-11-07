import { Zap, ExternalLink } from 'lucide-react';
import { Link } from 'wouter';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        backgroundColor: 'var(--boost-bg)',
        borderTop: '1px solid transparent',
        backgroundImage: 'linear-gradient(var(--boost-bg), var(--boost-bg)), linear-gradient(90deg, transparent, #FFFFFF, #E8E8E8, transparent)',
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
      }}
    >
      {/* Top border gradient line */}
      <div
        className="w-full h-px"
        style={{ background: 'linear-gradient(90deg, transparent, #FFFFFF 30%, #E8E8E8 70%, transparent)' }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand column */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(120deg, #555555 0%, #C0C0C0 28%, #FFFFFF 48%, #999999 68%, #E8E8E8 85%, #666666 100%)',
                }}
              >
                <Zap size={18} color="#fff" strokeWidth={2.5} />
              </div>
              <span className="font-black text-xl tracking-tight text-white">
                Vip<span style={{ color: '#FFFFFF' }}>Pro</span>{' '}
                <span className="gradient-text">Boosts</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed mb-5 max-w-sm" style={{ color: 'var(--boost-muted)' }}>
              Premium Discord Server Boosts and Nitro at the best prices. Instant delivery,
              crypto payments. Part of the VipPro family of services.
            </p>
            {/* Discord social */}
            <a
              href="https://discord.gg/275XqNhvwa"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90"
              style={{ backgroundColor: '#5865F2', color: '#FFFFFF' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026c.462-.62.874-1.275 1.226-1.963.021-.04.001-.088-.041-.104a13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028z" />
              </svg>
              Join our Discord
              <ExternalLink size={12} />
            </a>
          </div>

          {/* Products column */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-widest">
              Products
            </h4>
            <ul className="flex flex-col gap-2.5">
              {[
                'Discord Boosts (1 Month)',
                'Discord Boosts (3 Months)',
                'Discord Nitro (1 Month)',
                'Discord Nitro (3 Months)',
                'Discord Tokens',
              ].map((p) => (
                <li key={p}>
                  <button
                    onClick={() => {
                      const el = document.getElementById('products');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-sm hover:text-white transition-colors duration-200 cursor-pointer bg-transparent border-0 p-0 text-left"
                    style={{ color: 'var(--boost-muted)' }}
                  >
                    {p}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal column */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-widest">
              Legal & Support
            </h4>
            <ul className="flex flex-col gap-2.5">
              <li>
                <Link href="/tos">
                  <a className="text-sm hover:text-white transition-colors duration-200" style={{ color: 'var(--boost-muted)' }}>
                    Terms of Service
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/privacy">
                  <a className="text-sm hover:text-white transition-colors duration-200" style={{ color: 'var(--boost-muted)' }}>
                    Privacy Policy
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/refund">
                  <a className="text-sm hover:text-white transition-colors duration-200" style={{ color: 'var(--boost-muted)' }}>
                    Refund Policy
                  </a>
                </Link>
              </li>
              <li>
                <a
                  href="https://discord.gg/275XqNhvwa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:text-white transition-colors duration-200 flex items-center gap-1"
                  style={{ color: 'var(--boost-muted)' }}
                >
                  Support
                  <ExternalLink size={11} />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: '1px solid rgba(255, 255, 255,0.1)' }}
        >
          <p className="text-sm" style={{ color: 'var(--boost-muted)' }}>
            © {year} VipPro. All rights reserved.
          </p>
          <p className="text-sm" style={{ color: 'var(--boost-muted)' }}>
            Part of the{' '}
            <span style={{ color: '#FFFFFF' }} className="font-semibold">
              VipPro
            </span>{' '}
            family of services
          </p>
        </div>
      </div>
    </footer>
  );
}
