import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Key, Download, Menu, X, Cpu, Newspaper, Gift, Settings, MessageCircle, LogOut, ExternalLink, ChevronRight
} from 'lucide-react';

const base = import.meta.env.BASE_URL;

export type DashboardSection = 'overview' | 'keys' | 'hwid' | 'downloads' | 'news' | 'redeem' | 'settings' | 'support';

interface DashboardMobileDockProps {
  currentSection: DashboardSection;
  onSelectSection: (section: DashboardSection) => void;
  toolsCount: number;
  onLogout: () => void;
}

export function DashboardMobileDock({
  currentSection,
  onSelectSection,
  toolsCount,
  onLogout,
}: DashboardMobileDockProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleSelect = (section: DashboardSection) => {
    onSelectSection(section);
    setDrawerOpen(false);
  };

  const isMoreActive = ['news', 'redeem', 'settings', 'support'].includes(currentSection);

  const mainStoreUrl = 'https://mskhub.store';
  const boostStoreUrl = 'https://boost.mskhub.store';

  return (
    <>
      {/* ── Fixed Bottom App Dock for Mobile Dashboard ── */}
      <nav
        aria-label="Dashboard Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0c0c10]/95 backdrop-blur-2xl border-t border-white/10 px-2 shadow-[0_-12px_32px_rgba(0,0,0,0.8)]"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 6px)', paddingTop: '6px' }}
      >
        <div className="grid grid-cols-5 items-center max-w-lg mx-auto">
          {/* Overview */}
          <button
            type="button"
            onClick={() => handleSelect('overview')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
              currentSection === 'overview' ? 'text-white' : 'text-white/40 active:text-white/80'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${currentSection === 'overview' ? 'bg-white/15 shadow-sm' : ''}`}>
              <User size={19} className={currentSection === 'overview' ? 'text-white' : ''} />
            </div>
            <span className="text-[10px] font-semibold tracking-tight mt-0.5">Overview</span>
          </button>

          {/* Keys & Tools */}
          <button
            type="button"
            onClick={() => handleSelect('keys')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all relative ${
              currentSection === 'keys' ? 'text-white' : 'text-white/40 active:text-white/80'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all relative ${currentSection === 'keys' ? 'bg-white/15 shadow-sm' : ''}`}>
              <Key size={19} className={currentSection === 'keys' ? 'text-white' : ''} />
              {toolsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-black text-[9px] font-black flex items-center justify-center shadow-sm">
                  {toolsCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold tracking-tight mt-0.5">Keys</span>
          </button>

          {/* HWID Reset */}
          <button
            type="button"
            onClick={() => handleSelect('hwid')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
              currentSection === 'hwid' ? 'text-white' : 'text-white/40 active:text-white/80'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${currentSection === 'hwid' ? 'bg-white/15 shadow-sm' : ''}`}>
              <Cpu size={19} className={currentSection === 'hwid' ? 'text-white' : ''} />
            </div>
            <span className="text-[10px] font-semibold tracking-tight mt-0.5">HWID</span>
          </button>

          {/* Downloads */}
          <button
            type="button"
            onClick={() => handleSelect('downloads')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
              currentSection === 'downloads' ? 'text-white' : 'text-white/40 active:text-white/80'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${currentSection === 'downloads' ? 'bg-white/15 shadow-sm' : ''}`}>
              <Download size={19} className={currentSection === 'downloads' ? 'text-white' : ''} />
            </div>
            <span className="text-[10px] font-semibold tracking-tight mt-0.5">Downloads</span>
          </button>

          {/* More Menu */}
          <button
            type="button"
            onClick={() => setDrawerOpen(!drawerOpen)}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
              drawerOpen || isMoreActive ? 'text-white' : 'text-white/40 active:text-white/80'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${drawerOpen || isMoreActive ? 'bg-white/15 shadow-sm' : ''}`}>
              {drawerOpen ? <X size={19} /> : <Menu size={19} />}
            </div>
            <span className="text-[10px] font-semibold tracking-tight mt-0.5">More</span>
          </button>
        </div>
      </nav>

      {/* ── Slide-Up Drawer for Additional Sections & Navigation ── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed bottom-0 left-0 right-0 z-40 md:hidden rounded-t-[32px] border-t border-white/15 bg-[#0e0e14]/98 backdrop-blur-2xl p-6 shadow-[0_-20px_50px_rgba(0,0,0,0.9)] max-h-[85vh] overflow-y-auto"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 76px)' }}
            >
              {/* Drag handle */}
              <div className="w-12 h-1.5 rounded-full bg-white/20 mx-auto mb-5" />

              {/* Drawer header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                <div>
                  <h3 className="text-base font-black text-white tracking-tight">Dashboard Navigation</h3>
                  <p className="text-xs text-white/40">Select a section or access store features</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 active:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Sections list */}
              <div className="space-y-1.5 mb-6">
                {[
                  { id: 'redeem' as const,   label: 'Redeem Key',       desc: 'Claim or link a new tool key', icon: Gift },
                  { id: 'news' as const,     label: 'Update News',      desc: 'Changelogs and announcements', icon: Newspaper },
                  { id: 'settings' as const, label: 'Account Settings', desc: 'Password, username & logins', icon: Settings },
                  { id: 'support' as const,  label: 'Support & Help',   desc: 'Discord & ticket system',     icon: MessageCircle },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = currentSection === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item.id)}
                      className={`flex items-center justify-between w-full p-3.5 rounded-2xl border transition-all text-left ${
                        active
                          ? 'bg-white/10 border-white/20 text-white'
                          : 'bg-white/[0.03] border-white/5 text-white/70 active:bg-white/[0.08]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${active ? 'bg-white text-black' : 'bg-white/5 text-white/70'}`}>
                          <Icon size={17} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{item.label}</p>
                          <p className="text-xs text-white/40">{item.desc}</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-white/30" />
                    </button>
                  );
                })}
              </div>

              {/* Quick links to Main Store & Boost Store */}
              <div className="mb-6">
                <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-2.5 px-1">Quick Links</p>
                <div className="grid grid-cols-2 gap-2.5">
                  <a
                    href={mainStoreUrl}
                    className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-xs font-semibold text-white/80 active:bg-white/10 transition-colors"
                  >
                    <img src={`${base}msk-logo.png`} alt="MSK" className="w-5 h-5 object-contain shrink-0" />
                    <span className="truncate">Main Store</span>
                    <ExternalLink size={12} className="text-white/30 ml-auto shrink-0" />
                  </a>
                  <a
                    href={boostStoreUrl}
                    className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-xs font-semibold text-white/80 active:bg-white/10 transition-colors"
                  >
                    <img src={`${base}boost-icon.png`} alt="Boost" className="w-5 h-5 object-contain shrink-0" />
                    <span className="truncate">Boost Store</span>
                    <ExternalLink size={12} className="text-white/30 ml-auto shrink-0" />
                  </a>
                </div>
              </div>

              {/* Sign out button */}
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400 text-xs font-bold active:bg-red-500/20 transition-colors"
              >
                <LogOut size={15} /> Sign Out
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
