import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ChevronDown, LogOut, User, LayoutDashboard, X } from 'lucide-react';
import { CurrencySelector } from '@/components/CurrencySelector';
import { useCurrency } from '@/context/CurrencyContext';
import { useAuth } from '@/context/AuthContext';

export function Navbar() {
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [showComingSoon, _setShowComingSoon] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { currency, setCurrency } = useCurrency();
  const { user, loading: authLoading, logout } = useAuth();
  const profileRef = useRef<HTMLDivElement>(null);
  
  const hostname = window.location.hostname;
  const isSubdomain = hostname !== 'mskhub.store' && hostname !== 'www.mskhub.store' && !hostname.includes('localhost');
  const mainDomainUrl = (path: string) => isSubdomain ? `https://mskhub.store${path}` : path;

  const base = import.meta.env.BASE_URL;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: 'Features', path: '/features' },
  ];

  const handleFaqClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location === '/') {
      document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = '/#faq';
    }
  };

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
  };

  return (
    <>
      {/* Coming Soon Modal */}
      {showComingSoon && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setShowComingSoon(false)}
        >
          <div
            className="glass-card p-10 max-w-sm w-full mx-6 text-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowComingSoon(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
            <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mx-auto mb-6">
              <img src={`${base}msk-logo.png`} alt="MSK Hub" className="w-9 h-9 object-contain" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Coming Soon</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              The MSK Hub Dashboard is currently in development. Join our Discord to get notified when it launches.
            </p>
            <a
              href="https://discord.gg/BcwHsh3zBk"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full text-center mt-6 block"
              onClick={() => setShowComingSoon(false)}
            >
              Join Discord
            </a>
          </div>
        </div>
      )}

      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-black/80 backdrop-blur-md border-b border-white/10' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-6">
          {/* Logo */}
          {isSubdomain ? (
            <a href={mainDomainUrl('/')} className="flex items-center gap-2 z-50 shrink-0">
              <img src={`${base}msk-logo.png`} alt="MSK Hub" className="h-9 w-auto object-contain" />
              <span className="text-2xl font-black text-white tracking-tighter">MSK</span>
              <span className="text-sm font-medium text-accent -ml-1">Hub</span>
            </a>
          ) : (
            <Link href="/" className="flex items-center gap-2 z-50 shrink-0">
              <img src={`${base}msk-logo.png`} alt="MSK Hub" className="h-9 w-auto object-contain" />
              <span className="text-2xl font-black text-white tracking-tighter">MSK</span>
              <span className="text-sm font-medium text-accent -ml-1">Hub</span>
            </Link>
          )}

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 flex-1 justify-center">
            {navLinks.map((link) => (
              isSubdomain ? (
                <a
                  key={link.path}
                  href={mainDomainUrl(link.path)}
                  className="text-sm font-medium transition-colors text-muted-foreground hover:text-white"
                >
                  {link.name}
                </a>
              ) : (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`text-sm font-medium transition-colors hover:text-white ${
                    location === link.path ? 'text-white' : 'text-muted-foreground'
                  }`}
                >
                  {link.name}
                </Link>
              )
            ))}
            <a
              href="#faq"
              onClick={handleFaqClick}
              className="text-sm font-medium transition-colors hover:text-white text-muted-foreground cursor-pointer"
            >
              FAQ
            </a>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <CurrencySelector selected={currency} onSelect={setCurrency} />

            {/* Auth section */}
            {authLoading ? (
              <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
            ) : user ? (
              /* Logged-in: avatar + username + dropdown */
              <div ref={profileRef} className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all"
                >
                  <img
                    src={user.avatar ?? `${base}msk-logo.png`}
                    alt={user.username}
                    className="w-6 h-6 rounded-full object-cover border border-white/15"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `${base}msk-logo.png`;
                    }}
                  />
                  <span className="text-sm font-medium text-white/80 max-w-[90px] truncate">
                    {user.username}
                  </span>
                  <ChevronDown
                    size={12}
                    className={`text-white/40 transition-transform duration-200 ${
                      profileOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-white/10 bg-black/90 backdrop-blur-xl shadow-[0_24px_64px_rgba(0,0,0,0.8)] z-[300] overflow-hidden">
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-white/8">
                      <p className="text-xs font-bold text-white/90 truncate">{user.username}</p>
                      <p className="text-[10px] text-white/30 capitalize mt-0.5">
                        via {user.provider}
                      </p>
                    </div>
                    {/* Menu items */}
                    <div className="py-1">
                      <a
                        href="https://dashboard.mskhub.store"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <LayoutDashboard size={14} className="shrink-0" />
                        Dashboard
                      </a>
                      <Link
                        href="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <User size={14} className="shrink-0" />
                        Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <LogOut size={14} className="shrink-0" />
                        Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Logged-out: Login link */
              isSubdomain ? (
                <a href={mainDomainUrl('/login')} className="btn-secondary text-sm px-4 py-2">
                  Login
                </a>
              ) : (
                <Link href="/login" className="btn-secondary text-sm px-4 py-2">
                  Login
                </Link>
              )
            )}

            {/* Dashboard CTA */}
            <a
              href={user ? 'https://dashboard.mskhub.store' : mainDomainUrl('/login?from=dashboard')}
              className="btn-secondary text-sm px-4 py-2 flex items-center gap-1.5"
            >
              <LayoutDashboard size={14} />
              Dashboard
            </a>
            <a
              href="https://discord.gg/BcwHsh3zBk"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-sm px-4 py-2"
            >
              Discord
            </a>
          </div>

          {/* Mobile Top Bar Actions */}
          <div className="flex md:hidden items-center gap-2 z-50">
            <CurrencySelector selected={currency} onSelect={setCurrency} />

            {authLoading ? (
              <div className="w-7 h-7 rounded-full bg-white/10 animate-pulse" />
            ) : user ? (
              <Link
                href="/profile"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10 bg-white/5 active:bg-white/10 transition-colors"
              >
                <img
                  src={user.avatar ?? `${base}msk-logo.png`}
                  alt={user.username}
                  className="w-5 h-5 rounded-full object-cover border border-white/15"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `${base}msk-logo.png`;
                  }}
                />
                <span className="text-xs font-semibold text-white/90 max-w-[70px] truncate">
                  {user.username}
                </span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-3 py-1 rounded-full border border-white/15 bg-white/5 text-xs font-semibold text-white active:bg-white/10 transition-colors"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
