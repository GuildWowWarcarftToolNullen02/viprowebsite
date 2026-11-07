import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ChevronDown, LogOut, User, LayoutDashboard, X, Search, ShoppingCart } from 'lucide-react';
import { CurrencySelector } from '@/components/CurrencySelector';
import { useCurrency } from '@/context/CurrencyContext';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

export function Navbar() {
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [showComingSoon, _setShowComingSoon] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const { currency, setCurrency } = useCurrency();
  const { user, loading: authLoading, logout } = useAuth();
  const { itemCount } = useCart();
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const hostname = window.location.hostname;
  const isSubdomain = hostname !== 'sessionguardvip.cc' && hostname !== 'www.sessionguardvip.cc' && !hostname.includes('localhost');
  const mainDomainUrl = (path: string) => isSubdomain ? `https://sessionguardvip.cc${path}` : path;

  const base = import.meta.env.BASE_URL;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
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

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

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
              <img src={`${base}vippro-logo.png`} alt="VipPro" className="w-9 h-9 object-contain" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Coming Soon</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              The VipPro Dashboard is currently in development. Join our Discord to get notified when it launches.
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
        className={`fixed left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'top-4' : 'top-0'
        }`}
      >
        <div className={`transition-all duration-300 ${
          scrolled 
            ? 'max-w-7xl mx-auto px-6' 
            : 'w-full'
        }`}>
          <div className={`flex items-center justify-between gap-6 transition-all duration-300 ${
            scrolled 
              ? 'h-16 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl px-6 shadow-lg' 
              : 'h-20 bg-transparent px-6 max-w-7xl mx-auto'
          }`}>
          {/* Logo */}
          {isSubdomain ? (
            <a href={mainDomainUrl('/')} className={`flex items-center gap-2 z-50 shrink-0 transition-all duration-300 ${scrolled ? 'scale-90' : ''}`}>
              <img src={`${base}vippro-logo.png`} alt="VipPro" className={`w-auto object-contain transition-all duration-300 ${scrolled ? 'h-7' : 'h-9'}`} />
              <span className={`font-black text-white tracking-tighter transition-all duration-300 ${scrolled ? 'text-xl' : 'text-2xl'}`}>Vip</span>
              <span className="text-sm font-medium text-accent -ml-1">Pro</span>
            </a>
          ) : (
            <Link href="/" className={`flex items-center gap-2 z-50 shrink-0 transition-all duration-300 ${scrolled ? 'scale-90' : ''}`}>
              <img src={`${base}vippro-logo.png`} alt="VipPro" className={`w-auto object-contain transition-all duration-300 ${scrolled ? 'h-7' : 'h-9'}`} />
              <span className={`font-black text-white tracking-tighter transition-all duration-300 ${scrolled ? 'text-xl' : 'text-2xl'}`}>Vip</span>
              <span className="text-sm font-medium text-accent -ml-1">Pro</span>
            </Link>
          )}

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-4 flex-1 justify-center">
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

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative" ref={searchRef}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-48 h-9 bg-white/[0.04] border border-white/10 rounded-lg px-3 pl-9 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
              />
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            </form>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-2.5 shrink-0">
            {/* Cart Icon */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative h-10 w-10 flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 active:bg-white/[0.12] transition-all shadow-sm"
            >
              <ShoppingCart size={16} className="text-white/70" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </button>

            <CurrencySelector selected={currency} onSelect={setCurrency} />

            {/* Auth section */}
            {authLoading ? (
              <div className="w-10 h-10 rounded-xl bg-white/10 animate-pulse" />
            ) : user ? (
              /* Logged-in: avatar + username + dropdown */
              <div ref={profileRef} className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="h-10 flex items-center gap-2 px-3.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 active:bg-white/[0.12] transition-all shadow-sm"
                >
                  <img
                    src={user.avatar ?? `${base}vippro-logo.png`}
                    alt={user.username}
                    className="w-5 h-5 rounded-full object-cover border border-white/15"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `${base}vippro-logo.png`;
                    }}
                  />
                  <span className="text-xs font-semibold text-white/90 max-w-[95px] truncate">
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
                        href="https://dashboard.sessionguardvip.cc"
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
                <a
                  href={mainDomainUrl('/login')}
                  className="h-10 flex items-center gap-2 px-4 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 active:bg-white/[0.12] transition-all text-xs font-semibold text-white/90 shadow-sm"
                >
                  Login
                </a>
              ) : (
                <Link
                  href="/login"
                  className="h-10 flex items-center gap-2 px-4 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 active:bg-white/[0.12] transition-all text-xs font-semibold text-white/90 shadow-sm"
                >
                  Login
                </Link>
              )
            )}

            {/* Dashboard CTA */}
            <a
              href={user ? 'https://dashboard.sessionguardvip.cc' : mainDomainUrl('/login?from=dashboard')}
              className="h-10 flex items-center gap-2 px-4 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 active:bg-white/[0.12] transition-all text-xs font-semibold text-white/90 shadow-sm"
            >
              <LayoutDashboard size={14} className="text-white/60" />
              Dashboard
            </a>

            {/* Discord CTA */}
            <a
              href="https://discord.gg/BcwHsh3zBk"
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 flex items-center gap-2 px-4 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 active:bg-white/[0.12] transition-all text-xs font-semibold text-white/90 shadow-sm"
            >
              Discord
            </a>
          </div>

          {/* Mobile Top Bar Actions */}
          <div className="flex md:hidden items-center gap-2 z-50">
            {/* Mobile Cart Icon */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 bg-white/5 active:bg-white/10 transition-colors"
            >
              <ShoppingCart size={14} className="text-white/70" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </button>
            <CurrencySelector selected={currency} onSelect={setCurrency} />

            {authLoading ? (
              <div className="w-7 h-7 rounded-full bg-white/10 animate-pulse" />
            ) : user ? (
              <Link
                href="/profile"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10 bg-white/5 active:bg-white/10 transition-colors"
              >
                <img
                  src={user.avatar ?? `${base}vippro-logo.png`}
                  alt={user.username}
                  className="w-5 h-5 rounded-full object-cover border border-white/15"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `${base}vippro-logo.png`;
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
        </div>
      </header>

      {/* Cart Sidebar */}
      {cartOpen && (
        <div className="fixed inset-0 z-[100]" onClick={() => setCartOpen(false)}>
          <div 
            className="absolute top-0 right-0 h-full w-full max-w-md bg-black/95 backdrop-blur-xl border-l border-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <CartSidebarContent onClose={() => setCartOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}

// Import CartSidebar component
import { CartSidebarContent } from '@/components/CartSidebar';
