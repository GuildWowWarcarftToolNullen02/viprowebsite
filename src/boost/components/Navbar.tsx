import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, Menu, ExternalLink } from 'lucide-react';
import { Link } from 'wouter';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToProducts = () => {
    setMobileOpen(false);
    const el = document.getElementById('products');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          backgroundColor: scrolled ? 'rgba(8,6,11,0.95)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255, 255, 255,0.12)' : '1px solid transparent',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/">
              <a className="flex items-center gap-2 cursor-pointer group">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 group-hover:scale-110"
                  style={{
                    background: 'linear-gradient(120deg, #555555 0%, #C0C0C0 28%, #FFFFFF 48%, #999999 68%, #E8E8E8 85%, #666666 100%)',
                    boxShadow: '0 0 16px rgba(255, 255, 255,0.4)',
                  }}
                >
                  <Zap size={16} color="#fff" strokeWidth={2.5} />
                </div>
                <span className="font-black text-lg tracking-tight" style={{ color: '#FFFFFF' }}>
                  Vip<span style={{ color: '#FFFFFF' }}>Pro</span>{' '}
                  <span className="gradient-text">Boosts</span>
                </span>
              </a>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="/">
                <a
                  className="text-sm font-medium transition-colors duration-200 hover:text-white"
                  style={{ color: 'var(--boost-muted)' }}
                >
                  Home
                </a>
              </Link>
              <button
                onClick={scrollToProducts}
                className="text-sm font-medium transition-colors duration-200 hover:text-white bg-transparent border-0 cursor-pointer p-0"
                style={{ color: 'var(--boost-muted)' }}
              >
                Products
              </button>
              <a
                href="https://discord.gg/275XqNhvwa"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium transition-colors duration-200 hover:text-white flex items-center gap-1"
                style={{ color: 'var(--boost-muted)' }}
              >
                Support
                <ExternalLink size={12} />
              </a>
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <a
                href="https://discord.gg/275XqNhvwa"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-discord text-sm py-2 px-4"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026c.462-.62.874-1.275 1.226-1.963.021-.04.001-.088-.041-.104a13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028z" />
                </svg>
                Join Discord
              </a>
            </div>

            {/* Mobile Hamburger */}
            <button
              className="md:hidden p-2 rounded-lg transition-colors"
              style={{ color: 'var(--boost-muted)' }}
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="md:hidden overflow-hidden"
              style={{ borderTop: '1px solid rgba(255, 255, 255,0.12)', backgroundColor: 'rgba(8,6,11,0.97)' }}
            >
              <div className="px-4 py-4 flex flex-col gap-3">
                <Link href="/">
                  <a
                    className="py-2 text-sm font-medium hover:text-white transition-colors"
                    style={{ color: 'var(--boost-muted)' }}
                    onClick={() => setMobileOpen(false)}
                  >
                    Home
                  </a>
                </Link>
                <button
                  onClick={scrollToProducts}
                  className="py-2 text-sm font-medium hover:text-white transition-colors text-left bg-transparent border-0 cursor-pointer"
                  style={{ color: 'var(--boost-muted)' }}
                >
                  Products
                </button>
                <a
                  href="https://discord.gg/275XqNhvwa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 text-sm font-medium hover:text-white transition-colors"
                  style={{ color: 'var(--boost-muted)' }}
                  onClick={() => setMobileOpen(false)}
                >
                  Support
                </a>
                <a
                  href="https://discord.gg/275XqNhvwa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-discord text-sm py-2.5 justify-center mt-1"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026c.462-.62.874-1.275 1.226-1.963.021-.04.001-.088-.041-.104a13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028z" />
                  </svg>
                  Join Discord
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
}
