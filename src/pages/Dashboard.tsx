import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, Redirect } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useDevice } from '@/context/DeviceContext';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { DashboardMobileDock, DashboardSection } from '@/components/layout/DashboardMobileDock';
import {
  User, Key, Cpu, Download, Newspaper, Settings, MessageCircle,
  ChevronRight, Copy, Check, RefreshCw, ExternalLink, Shield,
  Clock, AlertTriangle, CheckCircle2, Loader2, LogOut, Gift,
  Lock, Link2, Link2Off, TrendingUp, Monitor, Eye, EyeOff,
  ClipboardPaste, ShoppingBag, Package, FileText
} from 'lucide-react';

const base = import.meta.env.BASE_URL;

// ── Types ────────────────────────────────────────────────────────
interface Tool {
  orderId: string;
  product: string;
  productName: string;
  plan: string;
  planLabel: string;
  licenseKey: string;
  maskedKey: string;
  isLifetime: boolean;
  purchasedAt: string;
  amountUsd: number;
  source?: 'purchase' | 'redeemed';
}

interface DashboardData {
  user: {
    id: string;
    username: string;
    email: string;
    avatar: string | null;
    provider: string;
    createdAt: string;
    lastLogin: string | null;
    emailVerified: boolean;
    linkedDiscord: boolean;
    linkedGoogle: boolean;
    hasPassword: boolean;
  };
  tools: Tool[];
  totalTools: number;
}

interface DownloadItem {
  id: string;
  product: string;
  productName: string;
  version: string;
  url: string;
  size: string;
  checksum: string;
  releaseNotes: string;
  updatedAt: string;
}

interface NewsItem {
  id: string;
  title: string;
  content: string;
  type: string;
  publishedAt: string;
}

interface Order {
  orderId: string;
  userId: string;
  orderDate: string;
  status: 'pending' | 'paid' | 'processing' | 'delivered' | 'failed' | 'refunded';
  items: OrderItem[];
  subtotal: number;
  total: number;
  currency: string;
  paymentMethod: string;
  paymentId: string;
}

interface OrderItem {
  type: 'msk-tool' | 'exudos-product';
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  deliveryInfo?: DeliveryInfo;
}

interface DeliveryInfo {
  licenseKey?: string;
  downloadUrl?: string;
  credentials?: { username: string; password: string };
  instructions?: string;
  deliveredAt?: string;
}

interface HwidStatus {
  [key: string]: { canReset: boolean; remainingSeconds: number; nextResetAt: string | null };
}

type Section = DashboardSection;

const NAV_ITEMS: { id: Section; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'overview',   label: 'User Info',        icon: User },
  { id: 'keys',       label: 'Your Tools & Keys', icon: Key },
  { id: 'orders',     label: 'Order History',    icon: ShoppingBag },
  { id: 'hwid',       label: 'HWID Reset',        icon: Cpu },
  { id: 'downloads',  label: 'Downloads',         icon: Download },
  { id: 'news',       label: 'Update News',       icon: Newspaper },
  { id: 'redeem',     label: 'Redeem Key',        icon: Gift },
  { id: 'settings',   label: 'Account Settings',  icon: Settings },
  { id: 'support',    label: 'Support',           icon: MessageCircle },
];

const NEWS_TYPE_STYLES: Record<string, { label: string; color: string }> = {
  feature:     { label: 'Feature',     color: 'bg-blue-500/15 text-blue-400 border-blue-500/25' },
  bugfix:      { label: 'Bug Fix',     color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25' },
  security:    { label: 'Security',    color: 'bg-red-500/15 text-red-400 border-red-500/25' },
  maintenance: { label: 'Maintenance', color: 'bg-white/10 text-white/50 border-white/15' },
  release:     { label: 'Release',     color: 'bg-green-500/15 text-green-400 border-green-500/25' },
};

const ORDER_STATUS_STYLES: Record<Order['status'], { label: string; color: string }> = {
  pending:    { label: 'Pending',    color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  paid:       { label: 'Paid',       color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  processing: { label: 'Processing', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  delivered:  { label: 'Delivered',  color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  failed:     { label: 'Failed',     color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  refunded:   { label: 'Refunded',   color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
};

// ── Helpers ──────────────────────────────────────────────────────
function formatDate(iso: string | null | undefined): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatCountdown(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// ── Copy button with instant touch feedback ──────────────────────
function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      type="button"
      onClick={copy}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
        copied
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          : 'bg-white/[0.06] hover:bg-white/[0.12] text-white/70 hover:text-white border border-white/10'
      }`}
      title="Copy to clipboard"
    >
      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-white/60" />}
      <span>{copied ? 'Copied' : (label || 'Copy')}</span>
    </button>
  );
}

// ── Section card wrapper ─────────────────────────────────────────
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`glass-card p-4 sm:p-6 w-full ${className}`}>
      {children}
    </div>
  );
}

// ── Main dashboard component ─────────────────────────────────────
export default function Dashboard() {
  const { user: authUser, loading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [section, setSection] = useState<Section>('overview');

  const { isMobile } = useDevice();

  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [hwidStatus, setHwidStatus] = useState<HwidStatus>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Countdown ticks
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchDash = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [meRes, dlRes, newsRes, hwidRes] = await Promise.all([
        fetch('/api/dashboard/me', { credentials: 'include' }),
        fetch('/api/dashboard/downloads', { credentials: 'include' }),
        fetch('/api/dashboard/news', { credentials: 'include' }),
        fetch('/api/dashboard/hwid-status', { credentials: 'include' }),
      ]);
      if (!meRes.ok) { setError('Failed to load dashboard.'); setLoading(false); return; }
      setDashData(await meRes.json() as DashboardData);
      if (dlRes.ok) setDownloads(await dlRes.json() as DownloadItem[]);
      if (newsRes.ok) setNews(await newsRes.json() as NewsItem[]);
      if (hwidRes.ok) setHwidStatus(await hwidRes.json() as HwidStatus);
      
      // Fetch orders separately (may require auth)
      try {
        const ordersRes = await fetch('/api/orders/history', { credentials: 'include' });
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json() as { orders: Order[] };
          setOrders(ordersData.orders || []);
        }
      } catch (err) {
        console.log('[Dashboard] Orders not available:', err);
        setOrders([]);
      }
    } catch {
      setError('Network error. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (authUser) void fetchDash(); }, [authUser, fetchDash]);

  if (authLoading) return null;
  if (!authUser) {
    if (window.location.hostname !== 'mskhub.store' && window.location.hostname !== 'www.mskhub.store' && !window.location.hostname.includes('localhost')) {
      window.location.href = 'https://mskhub.store/login?from=dashboard';
      return null;
    }
    return <Redirect to="/login?from=dashboard" />;
  }
  
  if (loading) return (
    <PageWrapper>
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-3">
        <Loader2 size={36} className="text-white/40 animate-spin" />
        <p className="text-xs font-mono text-white/40 uppercase tracking-widest">Loading Dashboard…</p>
      </div>
    </PageWrapper>
  );

  if (error) return (
    <PageWrapper>
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <AlertTriangle size={36} className="text-red-400" />
        <p className="text-white/70 max-w-sm">{error}</p>
        <button onClick={fetchDash} className="btn-secondary text-sm px-6 py-2.5 rounded-xl">Retry Connection</button>
      </div>
    </PageWrapper>
  );

  const data = dashData!;

  return (
    <PageWrapper>
      <div className="min-h-screen pt-20 sm:pt-24 pb-28 md:pb-16 px-3.5 sm:px-6 max-w-7xl mx-auto w-full">

        {/* ── Welcome Banner ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8 flex items-center justify-between flex-wrap gap-3 p-4 sm:p-0 rounded-2xl sm:rounded-none bg-white/[0.02] sm:bg-transparent border border-white/5 sm:border-0"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Customer Portal</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">Live</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">
              Welcome back, <span className="text-accent">{data.user.username}</span>
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="hidden sm:inline-block text-xs font-mono text-white/40 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
              {data.tools.length} active {data.tools.length === 1 ? 'license' : 'licenses'}
            </span>
            <button
              onClick={async () => { await logout(); setLocation('/'); }}
              className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 px-3 py-1.5 rounded-xl transition-all"
            >
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </motion.div>

        {/* ── Responsive Flex Container (Column on Mobile, Row on Desktop) ── */}
        <div className="flex flex-col md:flex-row gap-6 relative w-full">
          {/* Desktop Sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
            className="hidden md:flex flex-col gap-1.5 w-56 shrink-0"
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = section === item.id;
              const count = item.id === 'keys' ? data.tools.length : null;

              return (
                <button
                  key={item.id}
                  onClick={() => setSection(item.id)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
                    active
                      ? 'bg-white text-black shadow-md'
                      : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <Icon size={16} className={active ? 'text-black' : 'text-white/60'} />
                  <span>{item.label}</span>
                  {count !== null && count > 0 && (
                    <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      active ? 'bg-black text-white' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </motion.aside>

          {/* Mobile Category Navigation Pills (Smooth touch scrolling with active spring indicator) */}
          <div className="md:hidden w-full overflow-x-auto no-scrollbar pb-1 -mx-3.5 px-3.5">
            <div className="flex items-center gap-2 min-w-max">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = section === item.id;
                const count = item.id === 'keys' ? data.tools.length : null;

                return (
                  <button
                    key={item.id}
                    onClick={() => setSection(item.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0 active:scale-95 ${
                      active
                        ? 'bg-white text-black shadow-lg shadow-white/10 font-bold'
                        : 'text-white/60 bg-white/[0.04] border border-white/10 hover:text-white'
                    }`}
                  >
                    <Icon size={14} className={active ? 'text-black' : 'text-white/60'} />
                    <span>{item.label}</span>
                    {count !== null && count > 0 && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                        active ? 'bg-black text-white' : 'bg-emerald-500 text-black'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content Area */}
          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.08 }}
            className="flex-1 min-w-0 w-full"
          >
            <AnimatePresence mode="wait">
              {section === 'overview' && (
                <SectionOverview key="overview" data={data} onNavigate={setSection} />
              )}
              {section === 'keys' && (
                <SectionKeys key="keys" tools={data.tools} onNavigate={setSection} />
              )}
              {section === 'orders' && (
                <SectionOrders key="orders" orders={orders} onNavigate={setSection} />
              )}
              {section === 'hwid' && (
                <SectionHwid key="hwid" tools={data.tools} hwidStatus={hwidStatus} tick={tick} onRefresh={fetchDash} onNavigate={setSection} />
              )}
              {section === 'downloads' && (
                <SectionDownloads key="downloads" downloads={downloads} tools={data.tools} />
              )}
              {section === 'news' && (
                <SectionNews key="news" news={news} />
              )}
              {section === 'redeem' && (
                <SectionRedeem key="redeem" onRedeemed={fetchDash} />
              )}
              {section === 'settings' && (
                <SectionSettings key="settings" user={data.user} onUpdated={fetchDash} />
              )}
              {section === 'support' && (
                <SectionSupport key="support" />
              )}
            </AnimatePresence>
          </motion.main>
        </div>
      </div>

      {/* ── Fixed Mobile Bottom App Dock for Dashboard ── */}
      <DashboardMobileDock
        currentSection={section}
        onSelectSection={setSection}
        toolsCount={data.tools.length}
        onLogout={async () => { await logout(); setLocation('/'); }}
      />
    </PageWrapper>
  );
}

// ── Section: Overview ────────────────────────────────────────────
function SectionOverview({ data, onNavigate }: { data: DashboardData; onNavigate: (s: Section) => void }) {
  const u = data.user;

  const stats = [
    { label: 'Active Licenses', value: String(data.tools.length), action: () => onNavigate('keys') },
    { label: 'Account Status', value: 'Verified Active', highlight: true },
    { label: 'Auth Provider', value: u.provider.charAt(0).toUpperCase() + u.provider.slice(1) },
    { label: 'Member Since', value: formatDate(u.createdAt) },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 sm:space-y-5">
      <SectionTitle icon={User} label="User Info & Profile" />

      {/* Avatar + name header card */}
      <Card className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <img
            src={u.avatar ?? `${base}msk-logo.png`}
            alt={u.username}
            className="w-14 h-14 rounded-full border-2 border-white/15 object-cover shrink-0"
            onError={(e) => { (e.target as HTMLImageElement).src = `${base}msk-logo.png`; }}
          />
          <div className="min-w-0">
            <p className="text-lg font-black text-white truncate">{u.username}</p>
            <p className="text-xs text-white/50 truncate max-w-[220px] sm:max-w-md">{u.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active Member
              </span>
            </div>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-white/5">
          <button
            onClick={() => onNavigate('redeem')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-black text-xs font-bold hover:bg-white/90 active:scale-95 transition-all"
          >
            <Gift size={14} /> Redeem Key
          </button>
          <button
            onClick={() => onNavigate('settings')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-white/80 hover:text-white text-xs font-semibold active:scale-95 transition-all"
          >
            <Settings size={14} /> Settings
          </button>
        </div>
      </Card>

      {/* Responsive Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            onClick={s.action}
            className={`p-3.5 sm:p-4 rounded-2xl border bg-white/[0.03] border-white/8 transition-all ${
              s.action ? 'cursor-pointer hover:border-white/20 active:bg-white/[0.06]' : ''
            }`}
          >
            <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1 truncate">{s.label}</p>
            <p className={`text-base sm:text-lg font-bold truncate ${s.highlight ? 'text-emerald-400' : 'text-white'}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Purchased tools summary */}
      {data.tools.length > 0 ? (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Active Licenses ({data.tools.length})</p>
            <button
              onClick={() => onNavigate('keys')}
              className="text-xs text-accent hover:underline flex items-center gap-1"
            >
              View Keys <ChevronRight size={13} />
            </button>
          </div>
          <div className="space-y-2">
            {data.tools.map((t) => (
              <div
                key={t.orderId}
                onClick={() => onNavigate('keys')}
                className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-white/[0.02] border border-white/6 hover:border-white/15 transition-all cursor-pointer"
              >
                <div className="min-w-0 pr-2">
                  <p className="text-sm font-bold text-white truncate">{t.productName}</p>
                  <p className="text-[11px] font-mono text-white/40">{t.maskedKey}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    t.isLifetime
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                      : 'text-blue-400 bg-blue-500/10 border-blue-500/20'
                  }`}>
                    {t.planLabel}
                  </span>
                  <ChevronRight size={14} className="text-white/30" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card className="text-center py-8">
          <p className="text-sm text-white/50 mb-3">No active tool licenses linked to your account yet.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a href="/shop" className="btn-primary text-xs px-5 py-2.5 rounded-xl">
              Browse Store
            </a>
            <button onClick={() => onNavigate('redeem')} className="btn-secondary text-xs px-5 py-2.5 rounded-xl">
              Redeem License Key
            </button>
          </div>
        </Card>
      )}
    </motion.div>
  );
}

// ── Section: Keys ────────────────────────────────────────────────
function SectionKeys({ tools, onNavigate }: { tools: Tool[]; onNavigate: (s: Section) => void }) {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  if (tools.length === 0) return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
      <SectionTitle icon={Key} label="Your Tools & Keys" />
      <EmptyState
        message="You don't own any tools yet."
        cta={{ label: 'Browse Shop', href: '/shop' }}
      />
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between">
        <SectionTitle icon={Key} label="Your Tools & Keys" />
        <span className="text-xs text-white/40">{tools.length} Total</span>
      </div>

      {tools.map((t) => {
        const show = revealed[t.licenseKey];
        return (
          <Card key={t.orderId}>
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="font-black text-white text-base sm:text-lg">{t.productName}</p>
                <p className="text-xs text-white/40 mt-0.5">
                  {t.source === 'redeemed' ? 'Redeemed' : 'Purchased'} {formatDate(t.purchasedAt)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={`text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                  t.isLifetime
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    : 'text-blue-400 bg-blue-500/10 border-blue-500/20'
                }`}>
                  {t.planLabel}
                </span>
                {t.source === 'redeemed' && (
                  <span className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full text-amber-400 bg-amber-500/10 border border-amber-500/20">
                    Redeemed
                  </span>
                )}
              </div>
            </div>

            {/* License Key Box */}
            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1.5 font-mono">License Key</p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white/[0.03] border border-white/10 rounded-2xl p-2.5">
                  <div className="flex items-center gap-2 flex-1 min-w-0 px-2 py-1">
                    <Key size={14} className="text-white/40 shrink-0" />
                    <code className="text-xs sm:text-sm font-mono text-white/90 truncate select-all">
                      {show ? t.licenseKey : t.maskedKey}
                    </code>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end pt-1 sm:pt-0 border-t sm:border-0 border-white/5">
                    <button
                      type="button"
                      onClick={() => setRevealed((r) => ({ ...r, [t.licenseKey]: !r[t.licenseKey] }))}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] transition-colors"
                    >
                      {show ? <EyeOff size={13} /> : <Eye size={13} />}
                      <span>{show ? 'Hide' : 'Reveal'}</span>
                    </button>
                    <CopyButton text={t.licenseKey} label="Copy Key" />
                  </div>
                </div>
              </div>

              {/* Status footer */}
              <div className="flex items-center justify-between text-xs text-white/40 pt-2 border-t border-white/5 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <CheckCircle2 size={13} /> Active License
                  </span>
                  <span className="flex items-center gap-1 text-white/40">
                    <Clock size={12} />
                    {t.isLifetime ? 'Lifetime Access' : 'Monthly'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigate('hwid')}
                    className="text-white/50 hover:text-white text-xs font-semibold hover:underline"
                  >
                    Reset HWID
                  </button>
                  <span className="text-white/20">•</span>
                  <button
                    onClick={() => onNavigate('downloads')}
                    className="text-white/50 hover:text-white text-xs font-semibold hover:underline"
                  >
                    Download
                  </button>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </motion.div>
  );
}

// ── Section: Order History ───────────────────────────────────────
function SectionOrders({ orders, onNavigate }: { orders: Order[]; onNavigate: (s: Section) => void }) {
  const [statusFilter, setStatusFilter] = useState<'all' | Order['status']>('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(o => o.status === statusFilter);

  if (orders.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
        <SectionTitle icon={ShoppingBag} label="Order History" />
        <EmptyState
          message="No orders yet. Browse the store to make your first purchase!"
          cta={{ label: 'Browse Store', href: '/shop' }}
        />
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 sm:space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <SectionTitle icon={ShoppingBag} label="Order History" />
        
        {/* Status Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1">
          {(['all', 'pending', 'processing', 'delivered', 'failed', 'refunded'] as const).map((status) => {
            const count = status === 'all' ? orders.length : orders.filter(o => o.status === status).length;
            if (count === 0 && status !== 'all') return null;
            
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                  statusFilter === status
                    ? 'bg-white text-black'
                    : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {status === 'all' ? `All (${count})` : `${ORDER_STATUS_STYLES[status as Order['status']].label} (${count})`}
              </button>
            );
          })}
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <Card className="text-center py-8">
          <p className="text-sm text-white/50">No orders with this status</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const statusStyle = ORDER_STATUS_STYLES[order.status];
            const isExpanded = expandedOrder === order.id;
            const hasDelivery = order.deliveryInfo && (order.deliveryInfo.delivered?.length || order.deliveryInfo.content?.length);

            return (
              <Card key={order.id} className="overflow-hidden">
                {/* Order Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-bold text-white text-sm sm:text-base">
                        Order #{order.id.slice(-8).toUpperCase()}
                      </p>
                      <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full border ${statusStyle.color}`}>
                        {statusStyle.label}
                      </span>
                      <span className="text-[9px] font-mono text-white/30 px-1.5 py-0.5 rounded bg-white/5">
                        {order.type.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-white/40">{formatDateTime(order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-white">${order.total.toFixed(2)}</p>
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">{order.currency}</p>
                  </div>
                </div>

                {/* Order Items Summary */}
                <div className="space-y-2 mb-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.02] border border-white/5">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Package size={14} className="text-white/40 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white truncate">{item.productName}</p>
                          <p className="text-xs text-white/40">Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-white shrink-0">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Delivery Info (if delivered) */}
                {order.status === 'delivered' && hasDelivery && isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-white/10 pt-4 mb-4 space-y-3"
                  >
                    <p className="text-xs font-bold text-white/70 uppercase tracking-wider mb-3">Delivery Information</p>
                    
                    {order.deliveryInfo.content && order.deliveryInfo.content.length > 0 && (
                      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 space-y-2">
                        <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Delivered Content</p>
                        {order.deliveryInfo.content.map((item, i) => (
                          <div key={i} className="flex items-center gap-2 bg-white/[0.03] border border-white/10 rounded-lg p-2.5">
                            <code className="text-xs font-mono text-white/90 flex-1 truncate select-all">
                              {item}
                            </code>
                            <CopyButton text={item} label="Copy" />
                          </div>
                        ))}
                      </div>
                    )}

                    {order.deliveryInfo.instructions && (
                      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
                        <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Instructions</p>
                        <p className="text-xs text-white/70 leading-relaxed">
                          {order.deliveryInfo.instructions}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Order Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <div className="flex items-center gap-3 text-xs text-white/40">
                    {order.status === 'delivered' && (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 size={12} /> Complete
                      </span>
                    )}
                    {order.status === 'pending' && (
                      <span className="flex items-center gap-1 text-yellow-400">
                        <Clock size={12} /> Awaiting Payment
                      </span>
                    )}
                    {order.status === 'processing' && (
                      <span className="flex items-center gap-1 text-blue-400">
                        <Loader2 size={12} className="animate-spin" /> Processing
                      </span>
                    )}
                    {order.status === 'failed' && (
                      <span className="flex items-center gap-1 text-red-400">
                        <AlertTriangle size={12} /> Contact Support
                      </span>
                    )}
                  </div>

                  {order.status === 'delivered' && hasDelivery && (
                    <button
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                      className="text-xs font-semibold text-accent hover:underline"
                    >
                      {isExpanded ? 'Hide Details' : 'View Details'}
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

// ── Section: HWID Reset ──────────────────────────────────────────
function SectionHwid({ tools, hwidStatus, tick, onRefresh, onNavigate }: {
  tools: Tool[];
  hwidStatus: HwidStatus;
  tick: number;
  onRefresh: () => void;
  onNavigate: (s: Section) => void;
}) {
  const [resetting, setResetting] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, { ok: boolean; msg: string }>>({});
  const [localStatus, setLocalStatus] = useState<HwidStatus>(hwidStatus);

  useEffect(() => { setLocalStatus(hwidStatus); }, [hwidStatus]);

  useEffect(() => {
    setLocalStatus((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        if (next[key].remainingSeconds > 0) {
          next[key] = { ...next[key], remainingSeconds: Math.max(0, next[key].remainingSeconds - 1) };
          if (next[key].remainingSeconds === 0) next[key].canReset = true;
        }
      }
      return next;
    });
  }, [tick]);

  async function handleReset(tool: Tool) {
    setResetting((r) => ({ ...r, [tool.licenseKey]: true }));
    setResults((r) => ({ ...r, [tool.licenseKey]: { ok: false, msg: '' } }));
    try {
      const res = await fetch('/api/dashboard/hwid-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ licenseKey: tool.licenseKey, product: tool.product }),
      });
      const data = await res.json() as { success?: boolean; error?: string; remainingSeconds?: number };
      if (res.ok) {
        setResults((r) => ({ ...r, [tool.licenseKey]: { ok: true, msg: 'HWID reset successfully. You can now login on your new PC.' } }));
        setLocalStatus((s) => ({
          ...s,
          [tool.licenseKey]: { canReset: false, remainingSeconds: 12 * 3600, nextResetAt: null },
        }));
        void onRefresh();
      } else {
        const msg = data.error ?? 'Reset failed.';
        const rem = data.remainingSeconds;
        setResults((r) => ({ ...r, [tool.licenseKey]: { ok: false, msg: rem ? `${msg} Try again in ${formatCountdown(rem)}.` : msg } }));
      }
    } catch {
      setResults((r) => ({ ...r, [tool.licenseKey]: { ok: false, msg: 'Network error. Please try again.' } }));
    } finally {
      setResetting((r) => ({ ...r, [tool.licenseKey]: false }));
    }
  }

  if (tools.length === 0) return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
      <SectionTitle icon={Cpu} label="HWID Reset" />
      <EmptyState message="You don't own any tools yet." cta={{ label: 'Browse Shop', href: '/shop' }} />
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 sm:space-y-5">
      <SectionTitle icon={Cpu} label="HWID Reset" />
      <Card>
        {/* Notice banner */}
        <div className="flex items-start gap-3 mb-5 p-3.5 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl">
          <AlertTriangle size={16} className="text-yellow-400 mt-0.5 shrink-0" />
          <p className="text-xs text-white/70 leading-relaxed">
            Hardware ID (HWID) reset unbinds your license from your registered computer. You can reset once every <strong className="text-white">12 hours</strong>.
          </p>
        </div>

        <div className="space-y-4">
          {tools.map((t) => {
            const status = localStatus[t.licenseKey];
            const busy = resetting[t.licenseKey];
            const result = results[t.licenseKey];
            const canReset = !status || status.canReset;
            const remaining = status?.remainingSeconds ?? 0;

            return (
              <div
                key={t.licenseKey}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/6"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-white text-base">{t.productName}</p>
                    <span className="text-[10px] font-mono text-white/40 uppercase bg-white/5 px-2 py-0.5 rounded">
                      {t.planLabel}
                    </span>
                  </div>
                  <code className="text-xs text-white/40 font-mono mt-0.5 block truncate">{t.maskedKey}</code>

                  {result?.msg && (
                    <p className={`text-xs mt-2 font-medium ${result.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                      {result.msg}
                    </p>
                  )}

                  {!canReset && remaining > 0 && (
                    <p className="text-xs text-yellow-400/80 mt-2 flex items-center gap-1.5 font-mono">
                      <Clock size={12} /> Next reset available in {formatCountdown(remaining)}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => void handleReset(t)}
                  disabled={!canReset || busy}
                  className="w-full sm:w-auto h-11 flex items-center justify-center gap-2 px-5 rounded-xl text-xs font-bold transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed bg-white text-black hover:bg-white/90 active:scale-95"
                >
                  {busy ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                  <span>{busy ? 'Resetting…' : 'Reset HWID'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </Card>
    </motion.div>
  );
}

// ── Section: Downloads ───────────────────────────────────────────
function SectionDownloads({ downloads, tools }: { downloads: DownloadItem[]; tools: Tool[] }) {
  const ownedProducts = new Set(tools.map((t) => t.product));

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 sm:space-y-5">
      <SectionTitle icon={Download} label="Downloads & Software" />

      {downloads.length === 0 ? (
        <EmptyState message="No downloads available right now." />
      ) : (
        <div className="space-y-4">
          {downloads
            .filter((d) => ownedProducts.has(d.product))
            .map((d) => (
              <Card key={d.id}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="font-black text-white text-lg">{d.productName}</p>
                    <div className="flex items-center gap-2.5 mt-1">
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        v{d.version}
                      </span>
                      <span className="text-xs text-white/40">Updated {formatDate(d.updatedAt)}</span>
                    </div>
                  </div>

                  <a
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto h-11 flex items-center justify-center gap-2 px-6 rounded-xl bg-white text-black text-xs font-bold hover:bg-white/90 active:scale-95 transition-all shrink-0 shadow-lg"
                  >
                    <Download size={15} /> Download Installer
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                  {d.size && (
                    <div className="bg-white/[0.03] border border-white/5 rounded-xl px-3.5 py-2.5">
                      <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono mb-0.5">File Size</p>
                      <p className="text-xs font-mono font-bold text-white/80">{d.size}</p>
                    </div>
                  )}
                  {d.checksum && (
                    <div className="bg-white/[0.03] border border-white/5 rounded-xl px-3.5 py-2.5 col-span-1 sm:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono">SHA-256 Checksum</p>
                        <CopyButton text={d.checksum} label="Copy Hash" />
                      </div>
                      <p className="text-xs font-mono text-white/60 truncate select-all">{d.checksum}</p>
                    </div>
                  )}
                </div>

                {d.releaseNotes && (
                  <div className="pt-3 border-t border-white/5">
                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono mb-2">Changelog & Release Notes</p>
                    <p className="text-xs text-white/60 leading-relaxed whitespace-pre-line bg-white/[0.02] p-3 rounded-xl border border-white/5">
                      {d.releaseNotes}
                    </p>
                  </div>
                )}
              </Card>
            ))}

          {downloads.filter((d) => ownedProducts.has(d.product)).length === 0 && (
            <EmptyState message="No downloads available for your currently owned tools." />
          )}
        </div>
      )}
    </motion.div>
  );
}

// ── Section: News ────────────────────────────────────────────────
function SectionNews({ news }: { news: NewsItem[] }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 sm:space-y-5">
      <SectionTitle icon={Newspaper} label="Update News & Changelogs" />
      {news.length === 0 ? (
        <EmptyState message="No update news posted yet." />
      ) : (
        <div className="space-y-3.5">
          {news.map((n) => {
            const style = NEWS_TYPE_STYLES[n.type] ?? NEWS_TYPE_STYLES['feature'];
            return (
              <Card key={n.id}>
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <p className="font-bold text-white text-base leading-snug">{n.title}</p>
                  <span className={`text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full border shrink-0 ${style.color}`}>
                    {style.label}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-white/60 leading-relaxed whitespace-pre-line">{n.content}</p>
                <p className="text-[11px] text-white/30 mt-3 font-mono">{formatDateTime(n.publishedAt)}</p>
              </Card>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

// ── Section: Redeem Key ──────────────────────────────────────────
function SectionRedeem({ onRedeemed }: { onRedeemed: () => void }) {
  const [keyInput, setKeyInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    productName: string;
    planLabel: string;
    maskedKey: string;
  } | null>(null);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setKeyInput(text.trim().toUpperCase());
        setError(null);
      }
    } catch {
      // clipboard access denied
    }
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = keyInput.trim().toUpperCase();
    if (!trimmed) { setError('Please enter your license key.'); return; }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/dashboard/redeem-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ licenseKey: trimmed }),
      });
      const data = await res.json() as {
        success?: boolean;
        productName?: string;
        planLabel?: string;
        maskedKey?: string;
        error?: string;
      };

      if (!res.ok) {
        setError(data.error ?? 'Redemption failed. Please try again.');
        return;
      }

      setSuccess({
        productName: data.productName ?? '',
        planLabel:   data.planLabel ?? '',
        maskedKey:   data.maskedKey ?? '',
      });
      setKeyInput('');
      onRedeemed();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 sm:space-y-5">
      <SectionTitle icon={Gift} label="Redeem License Key" />

      <Card>
        <div className="flex items-start gap-3 mb-6 p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
          <Shield size={16} className="text-blue-400 mt-0.5 shrink-0" />
          <p className="text-xs text-white/70 leading-relaxed">
            Own an MSK tool license purchased externally or via gift? Enter the key below to link it to your account.
          </p>
        </div>

        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center gap-4 py-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 size={32} className="text-emerald-400" />
            </div>
            <div>
              <p className="font-black text-white text-xl mb-1">Key Successfully Redeemed!</p>
              <p className="text-sm text-white/60">
                <strong className="text-white">{success.productName}</strong> ({success.planLabel}) is now permanently linked to your profile.
              </p>
              <code className="inline-block mt-3 px-3 py-1 bg-white/[0.03] rounded-lg text-xs font-mono text-white/50 border border-white/5">
                {success.maskedKey}
              </code>
            </div>
            <button
              onClick={() => setSuccess(null)}
              className="text-xs text-white/50 hover:text-white underline mt-2"
            >
              Redeem another key
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleRedeem} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] text-white/40 uppercase tracking-widest font-mono">
                  License Key Code
                </label>
                <button
                  type="button"
                  onClick={handlePaste}
                  className="flex items-center gap-1 text-[11px] text-accent hover:underline active:scale-95 transition-all"
                >
                  <ClipboardPaste size={12} /> Paste from clipboard
                </button>
              </div>

              <input
                type="text"
                value={keyInput}
                onChange={(e) => { setKeyInput(e.target.value.toUpperCase()); setError(null); }}
                placeholder="MSK-XXXXXXX-XXXXXXX-XXXXXXX"
                maxLength={48}
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="characters"
                className="w-full h-12 bg-white/[0.03] border border-white/10 rounded-2xl px-4 text-sm font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3.5 py-2.5"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading || !keyInput.trim()}
              className="w-full h-12 flex items-center justify-center gap-2 px-5 rounded-2xl bg-white text-black text-sm font-bold hover:bg-white/90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Verifying License…</>
              ) : (
                <><Gift size={16} /> Link Key to Account</>
              )}
            </button>
          </form>
        )}
      </Card>
    </motion.div>
  );
}

// ── Section: Account Settings & Device Config ────────────────────
function SectionSettings({ user, onUpdated }: {
  user: DashboardData['user'];
  onUpdated: () => void;
}) {
  const [username, setUsername] = useState(user.username);
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameMsg, setUsernameMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw]         = useState('');
  const [pwSaving, setPwSaving]   = useState(false);
  const [showPw, setShowPw]       = useState(false);
  const [pwMsg, setPwMsg]         = useState<{ ok: boolean; text: string } | null>(null);

  const [history, setHistory]     = useState<{ ip: string; ua: string; at: string }[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const historyRef = useRef(false);

  useEffect(() => {
    if (historyRef.current) return;
    historyRef.current = true;
    void fetch('/api/dashboard/login-history', { credentials: 'include' })
      .then((r) => r.ok ? r.json() as Promise<typeof history> : [])
      .then((h) => { setHistory(h); setHistoryLoaded(true); });
  }, []);

  const saveUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameSaving(true); setUsernameMsg(null);
    const r = await fetch('/api/dashboard/change-username', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    const d = await r.json() as { success?: boolean; username?: string; error?: string };
    if (r.ok) { setUsernameMsg({ ok: true, text: 'Username updated successfully.' }); onUpdated(); }
    else { setUsernameMsg({ ok: false, text: d.error ?? 'Failed to update username.' }); }
    setUsernameSaving(false);
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwSaving(true); setPwMsg(null);
    const endpoint = user.hasPassword ? '/api/dashboard/change-password' : '/api/dashboard/set-password';
    const body = user.hasPassword
      ? { currentPassword: currentPw, newPassword: newPw }
      : { newPassword: newPw };
    const r = await fetch(endpoint, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const d = await r.json() as { success?: boolean; error?: string };
    if (r.ok) { setPwMsg({ ok: true, text: 'Password saved.' }); setCurrentPw(''); setNewPw(''); onUpdated(); }
    else { setPwMsg({ ok: false, text: d.error ?? 'Failed to update password.' }); }
    setPwSaving(false);
  };

  const unlinkProvider = async (provider: 'discord' | 'google') => {
    const r = await fetch(`/api/dashboard/unlink-${provider}`, { method: 'POST', credentials: 'include' });
    const d = await r.json() as { success?: boolean; error?: string };
    if (r.ok) { onUpdated(); }
    else { alert(d.error ?? 'Failed to unlink account.'); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 sm:space-y-5">
      <SectionTitle icon={Settings} label="Account Settings" />

      {/* ── Username ── */}
      <Card>
        <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3 font-mono">Display Username</p>
        <form onSubmit={(e) => void saveUsername(e)} className="flex flex-col sm:flex-row gap-2.5">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={32}
            className="flex-1 h-11 bg-white/[0.03] border border-white/10 rounded-xl px-4 text-sm text-white outline-none focus:border-white/30 transition-colors"
          />
          <button
            type="submit"
            disabled={usernameSaving || username === user.username}
            className="h-11 flex items-center justify-center gap-1.5 px-6 rounded-xl bg-white text-black text-xs font-bold hover:bg-white/90 transition-colors disabled:opacity-40"
          >
            {usernameSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save Username
          </button>
        </form>
        {usernameMsg && (
          <p className={`text-xs mt-3 flex items-center gap-2 p-2.5 rounded-xl border ${usernameMsg.ok ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>
            {usernameMsg.text}
          </p>
        )}
      </Card>

      {/* ── Password ── */}
      <Card>
        <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3 font-mono">
          {user.hasPassword ? 'Change Password' : 'Set Account Password'}
        </p>
        <form onSubmit={(e) => void savePassword(e)} className="space-y-3">
          {user.hasPassword && (
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="Current password"
                className="w-full h-11 bg-white/[0.03] border border-white/10 rounded-xl px-4 text-sm text-white outline-none focus:border-white/30 transition-colors pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-white/40 hover:text-white"
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          )}
          <input
            type={showPw ? 'text' : 'password'}
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            placeholder="New password (minimum 8 characters)"
            className="w-full h-11 bg-white/[0.03] border border-white/10 rounded-xl px-4 text-sm text-white outline-none focus:border-white/30 transition-colors"
          />
          <button
            type="submit"
            disabled={pwSaving || !newPw || (user.hasPassword && !currentPw)}
            className="h-11 flex items-center justify-center gap-1.5 px-6 rounded-xl bg-white text-black text-xs font-bold hover:bg-white/90 transition-colors disabled:opacity-40"
          >
            {pwSaving ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
            {user.hasPassword ? 'Update Password' : 'Set Password'}
          </button>
          {pwMsg && (
            <p className={`text-xs mt-3 flex items-center gap-2 p-2.5 rounded-xl border ${pwMsg.ok ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>
              {pwMsg.text}
            </p>
          )}
        </form>
      </Card>

      {/* ── Linked Accounts ── */}
      <Card>
        <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3 font-mono">Connected Accounts</p>
        <div className="space-y-2.5">
          {[
            { id: 'discord' as const, label: 'Discord', linked: user.linkedDiscord || user.provider === 'discord', color: 'text-indigo-400' },
            { id: 'google'  as const, label: 'Google',  linked: user.linkedGoogle  || user.provider === 'google',  color: 'text-blue-400' },
          ].map(({ id, label, linked, color }) => (
            <div key={id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/6">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center ${color}`}>
                  <Link2 size={15} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{label}</p>
                  <p className="text-xs text-white/40">{linked ? 'Connected' : 'Not linked'}</p>
                </div>
              </div>
              {linked ? (
                <button
                  type="button"
                  onClick={() => void unlinkProvider(id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Link2Off size={13} /> Unlink
                </button>
              ) : (
                <a
                  href={`/api/auth/${id}?t=SKIP&link=1`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Link2 size={13} /> Connect
                </a>
              )}
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}

// ── Section: Support ─────────────────────────────────────────────
function SectionSupport() {
  const links = [
    { icon: MessageCircle, label: 'MSK Hub Discord Server', desc: 'Join over 10,000 members for live community help, announcements & status.', href: 'https://discord.gg/BcwHsh3zBk', action: 'Join Discord' },
    { icon: ExternalLink,  label: 'Direct Support Ticket', desc: 'Open a private 1-on-1 ticket with our staff in our Discord server.', href: 'https://discord.gg/BcwHsh3zBk', action: 'Open Ticket' },
    { icon: Shield,        label: 'Email Support Team', desc: 'Direct email assistance at support@mskhub.store for billing & account issues.', href: 'mailto:support@mskhub.store', action: 'Send Email' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 sm:space-y-5">
      <SectionTitle icon={MessageCircle} label="Customer Support & Help" />
      <div className="space-y-3">
        {links.map((l) => {
          const Icon = l.icon;
          return (
            <Card key={l.label} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-white/70" />
                </div>
                <div>
                  <p className="font-bold text-white text-base">{l.label}</p>
                  <p className="text-xs text-white/40 mt-0.5 leading-relaxed">{l.desc}</p>
                </div>
              </div>
              <a
                href={l.href}
                target={l.href.startsWith('http') ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="w-full sm:w-auto h-11 flex items-center justify-center gap-2 px-5 rounded-xl bg-white text-black text-xs font-bold hover:bg-white/90 active:scale-95 transition-all shrink-0"
              >
                <span>{l.action}</span>
                <ChevronRight size={14} />
              </a>
            </Card>
          );
        })}
      </div>
    </motion.div>
  );
}

// ── Shared components ────────────────────────────────────────────
function SectionTitle({ icon: Icon, label }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-1">
      <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
        <Icon size={15} className="text-white/80" />
      </div>
      <h2 className="text-base sm:text-lg font-black text-white tracking-tight">{label}</h2>
    </div>
  );
}

function EmptyState({ message, cta }: { message: string; cta?: { label: string; href: string } }) {
  return (
    <Card className="flex flex-col items-center text-center py-10 gap-4">
      <p className="text-sm text-white/40">{message}</p>
      {cta && (
        <a href={cta.href} className="btn-primary text-xs px-6 py-2.5 rounded-xl">
          {cta.label} <ChevronRight size={13} className="inline ml-1" />
        </a>
      )}
    </Card>
  );
}
