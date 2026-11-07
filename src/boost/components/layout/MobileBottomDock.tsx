import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Activity, Menu, X, LayoutDashboard } from 'lucide-react';

function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.031.053a19.9 19.9 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

export function MobileBottomDock({
  onSelectCategory,
}: {
  onSelectCategory?: (category: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const scrollToSection = (id: string) => {
    setMenuOpen(false);
    setStatusOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleStoreClick = () => {
    setMenuOpen(false);
    setStatusOpen(false);
    scrollToSection('products');
  };

  const handleStatusClick = () => {
    if (statusOpen) {
      setStatusOpen(false);
    } else {
      setMenuOpen(false);
      setStatusOpen(true);
    }
  };

  const handleDiscordClick = () => {
    setMenuOpen(false);
    setStatusOpen(false);
    window.open('https://discord.gg/275XqNhvwa', '_blank', 'noopener,noreferrer');
  };

  const handleMenuClick = () => {
    if (menuOpen) {
      setMenuOpen(false);
    } else {
      setStatusOpen(false);
      setMenuOpen(true);
    }
  };

  return (
    <>
      {/* ── Fixed Mobile Bottom Dock Bar ── */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0d0d11]/95 backdrop-blur-2xl border-t border-white/10 px-2 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 6px)', paddingTop: '6px' }}
      >
        <div className="grid grid-cols-4 items-center max-w-md mx-auto">
          {/* Store */}
          <button
            onClick={handleStoreClick}
            type="button"
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all ${
              !menuOpen && !statusOpen ? 'text-white' : 'text-white/40 hover:text-white/70'
            }`}
          >
            <div className={`p-1 rounded-lg transition-all ${!menuOpen && !statusOpen ? 'bg-white/10' : ''}`}>
              <ShoppingBag size={20} className={!menuOpen && !statusOpen ? 'text-white' : ''} />
            </div>
            <span className="text-[10px] font-semibold tracking-tight mt-0.5">Store</span>
          </button>

          {/* Status */}
          <button
            onClick={handleStatusClick}
            type="button"
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all ${
              statusOpen ? 'text-white' : 'text-white/40 hover:text-white/70'
            }`}
          >
            <div className={`p-1 rounded-lg transition-all ${statusOpen ? 'bg-white/10' : ''}`}>
              <Activity size={20} className={statusOpen ? 'text-white' : ''} />
            </div>
            <span className="text-[10px] font-semibold tracking-tight mt-0.5">Status</span>
          </button>

          {/* Discord */}
          <button
            onClick={handleDiscordClick}
            type="button"
            className="flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all text-white/40 hover:text-white/70"
          >
            <div className="p-1 rounded-lg">
              <DiscordIcon />
            </div>
            <span className="text-[10px] font-semibold tracking-tight mt-0.5">Discord</span>
          </button>

          {/* Menu */}
          <button
            onClick={handleMenuClick}
            type="button"
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all ${
              menuOpen ? 'text-white' : 'text-white/40 hover:text-white/70'
            }`}
          >
            <div className={`p-1 rounded-lg transition-all ${menuOpen ? 'bg-white/10' : ''}`}>
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </div>
            <span className="text-[10px] font-semibold tracking-tight mt-0.5">Menu</span>
          </button>
        </div>
      </nav>

      {/* ── Slide-Up Menu Drawer ── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 md:hidden"
            />

            {/* Bottom Sheet Drawer (Matching Image 1 Design) */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 360 }}
              className="fixed bottom-[60px] left-0 right-0 z-40 md:hidden rounded-t-[32px] border-t border-white/10 bg-[#000000] p-6 shadow-2xl max-h-[88vh] overflow-y-auto"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}
            >
              {/* Drag Handle & Close */}
              <div className="relative mb-6">
                <div className="w-12 h-1.5 rounded-full bg-white/20 mx-auto" />
                <button
                  onClick={() => setMenuOpen(false)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Main Nav Links (Big, Bold, Centered - Exactly like Image 1) */}
              <div className="flex flex-col items-center justify-center gap-7 my-6">
                <button
                  type="button"
                  onClick={() => scrollToSection('products')}
                  className="text-2xl font-bold tracking-tight text-white hover:text-white/80 transition-colors"
                >
                  Store
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setStatusOpen(true);
                  }}
                  className="text-2xl font-bold tracking-tight text-white/80 hover:text-white transition-colors"
                >
                  Status
                </button>

                <button
                  type="button"
                  onClick={() => scrollToSection('faq')}
                  className="text-2xl font-bold tracking-tight text-white/80 hover:text-white transition-colors"
                >
                  FAQ
                </button>

                <a
                  href="https://sessionguardvip.cc"
                  className="text-2xl font-bold tracking-tight text-white/80 hover:text-white transition-colors"
                >
                  Main Hub
                </a>
              </div>

              {/* Action Stack (Width & Buttons exactly like Image 1) */}
              <div className="flex flex-col gap-3 w-full max-w-[290px] mx-auto mt-8">
                <a
                  href="https://dashboard.sessionguardvip.cc"
                  className="w-full py-3 px-4 rounded-xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.12] text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <LayoutDashboard size={16} /> Dashboard
                </a>

                <a
                  href="https://discord.gg/275XqNhvwa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.12] text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  Discord Support
                </a>

                {/* Shop Now Metallic Silver Button */}
                <button
                  type="button"
                  onClick={() => scrollToSection('products')}
                  className="w-full py-3.5 px-4 rounded-2xl font-black text-sm text-black bg-gradient-to-b from-[#ffffff] via-[#e5e5e7] to-[#a1a1aa] shadow-[0_4px_24px_rgba(255,255,255,0.25)] hover:opacity-95 active:scale-[0.98] transition-all text-center flex items-center justify-center mt-1"
                >
                  Shop Boosts Now
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Status Modal / Bottom Sheet ── */}
      <AnimatePresence>
        {statusOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setStatusOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 md:hidden"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 360 }}
              className="fixed bottom-[60px] left-0 right-0 z-40 md:hidden rounded-t-[32px] border-t border-white/10 bg-[#000000] p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}
            >
              {/* Drag Handle & Close */}
              <div className="relative mb-6">
                <div className="w-12 h-1.5 rounded-full bg-white/20 mx-auto" />
                <button
                  onClick={() => setStatusOpen(false)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Status Header */}
              <div className="flex items-center gap-2.5 pb-4 border-b border-white/10 mb-5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                <span className="text-base font-bold text-white tracking-tight">Live Service Status</span>
              </div>

              {/* Services List (Styled matching Image 1) */}
              <div className="space-y-3 mb-6">
                <div className="p-4 rounded-2xl border border-white/10 bg-[#121216] flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">Server Boost Deliveries</p>
                    <p className="text-xs text-white/40 mt-0.5">Automated Bot Delivery</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/25 px-3 py-1 rounded-full">
                    Operational
                  </span>
                </div>

                <div className="p-4 rounded-2xl border border-white/10 bg-[#121216] flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">Crypto Payment Processing</p>
                    <p className="text-xs text-white/40 mt-0.5">USDT, BTC, LTC, ETH</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/25 px-3 py-1 rounded-full">
                    Operational
                  </span>
                </div>

                <div className="p-4 rounded-2xl border border-white/10 bg-[#121216] flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">Average Delivery Time</p>
                    <p className="text-xs text-white/40 mt-0.5">After payment confirmation</p>
                  </div>
                  <span className="text-xs font-bold text-white bg-white/10 px-3 py-1 rounded-full">
                    &lt; 5 mins
                  </span>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setStatusOpen(false)}
                className="w-full py-3.5 px-4 rounded-xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.12] text-sm font-semibold text-white transition-all shadow-sm"
              >
                Close Status
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
