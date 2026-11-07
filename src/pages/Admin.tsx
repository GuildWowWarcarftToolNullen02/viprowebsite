import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, Newspaper, Plus, Trash2, Edit2, Check, X,
  Loader2, LogOut, Shield, Users, ShoppingCart, Mail,
  ScrollText, Search, RefreshCw, ChevronLeft, ChevronRight,
  AlertCircle, CheckCircle2, TrendingUp, Key, Clock, UserCheck,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────
interface DownloadDoc {
  _id: string; product: string; version: string; url: string;
  size: string; checksum: string; releaseNotes: string;
  published: boolean; updatedAt: string;
}
interface NewsDoc {
  _id: string; title: string; content: string; type: string;
  published: boolean; publishedAt: string;
}
interface UserDoc {
  _id: string; email: string; username: string; provider: string;
  emailVerified: boolean; createdAt: string; lastLogin?: string; avatar?: string;
}
interface OrderDoc {
  _id: string; internalId: string; email: string; product: string;
  plan: string; status: string; licenseKey?: string;
  amountUsd: number; createdAt: string;
}
interface LogEntry { ts: string; level: 'info' | 'warn' | 'error'; msg: string; }
interface Stats {
  totalUsers: number; totalOrders: number; paidOrders: number;
  totalRedeemed: number; revenue: number; recentSignups: number;
}

type Tab = 'overview' | 'customers' | 'users' | 'orders' | 'email' | 'logs' | 'downloads' | 'news';

const PRODUCT_OPTIONS = [
  { value: 'token-g', label: 'MSK Token-G' },
  { value: 'raider',  label: 'MSK Raider Tool' },
];
const NEWS_TYPES = ['feature', 'bugfix', 'security', 'maintenance', 'release'];

// ── Helpers ──────────────────────────────────────────────────────
function fmt(iso?: string | null) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });
}
function statusColor(s: string) {
  if (s === 'paid') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  if (s === 'pending' || s === 'fulfilling') return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
  return 'text-red-400 bg-red-500/10 border-red-500/20';
}

// ── Shared UI ────────────────────────────────────────────────────
function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={`text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded border ${className}`}>
      {label}
    </span>
  );
}
function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <span className="text-[10px] text-white/30 uppercase tracking-widest">{label}</span>}
      <input
        {...props}
        className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/30 transition-colors placeholder:text-white/20"
      />
    </div>
  );
}
function Textarea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <span className="text-[10px] text-white/30 uppercase tracking-widest">{label}</span>}
      <textarea
        {...props}
        className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/30 transition-colors resize-none placeholder:text-white/20"
      />
    </div>
  );
}

// ── Admin login ──────────────────────────────────────────────────
function AdminLogin() {
  const [loading, setLoading] = useState(false);
  const params = new URLSearchParams(window.location.search);
  const errorCode = params.get('error');
  const reason = params.get('reason');
  const errorMsg: Record<string, string> = {
    unauthorized: 'Access denied. Only the authorized admin account may log in.',
    oauth_failed:  'Authentication failed. Please try again.',
    oauth_error:   'An error occurred. Please try again.',
  };
  let error = errorCode ? (errorMsg[errorCode] ?? 'Authentication error.') : null;
  if (error && reason) error += ` (${reason})`;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-sm bg-white/[0.03] border border-white/10 rounded-2xl p-8"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Shield size={18} className="text-white/50" />
          </div>
          <div>
            <p className="font-black text-white text-sm">MSK Hub</p>
            <p className="text-xs text-white/30">Admin Panel</p>
          </div>
        </div>
        <div className="space-y-4">
          <p className="text-xs text-white/40 leading-relaxed">
            Sign in with your authorized Google account to access the admin panel.
          </p>
          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <button
            onClick={() => { setLoading(true); window.location.href = '/api/admin/auth/google'; }}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-white text-black text-sm font-bold hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2.5"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : (
              <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            {loading ? 'Redirecting…' : 'Sign in with Google'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Overview (stats) ─────────────────────────────────────────────
function SectionOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats', { credentials: 'include' })
      .then((r) => r.ok ? r.json() as Promise<Stats> : Promise.reject())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-16 flex justify-center"><Loader2 size={24} className="text-white/20 animate-spin" /></div>;
  if (!stats) return <p className="text-sm text-white/30 py-8 text-center">Failed to load stats.</p>;

  const cards = [
    { label: 'Total Users',       value: stats.totalUsers,    icon: Users,        color: 'text-blue-400' },
    { label: 'Paid Orders',       value: stats.paidOrders,    icon: ShoppingCart, color: 'text-emerald-400' },
    { label: 'Redeemed Keys',     value: stats.totalRedeemed, icon: Key,          color: 'text-purple-400' },
    { label: 'Revenue (USD)',     value: `$${stats.revenue.toFixed(2)}`, icon: TrendingUp, color: 'text-yellow-400' },
    { label: 'Signups (7d)',      value: stats.recentSignups, icon: Clock,        color: 'text-cyan-400' },
    { label: 'Total Orders',      value: stats.totalOrders,   icon: ShoppingCart, color: 'text-white/40' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="bg-white/[0.02] border border-white/8 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <c.icon size={14} className={c.color} />
            <span className="text-[10px] text-white/30 uppercase tracking-widest">{c.label}</span>
          </div>
          <p className="text-2xl font-black text-white">{c.value}</p>
        </div>
      ))}
    </div>
  );
}

// ── Customers (users who own at least one tool) ──────────────────
function SectionCustomers() {
  const [customers, setCustomers] = useState<UserDoc[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [q, setQ]                 = useState('');
  const [product, setProduct]     = useState('all');
  const [loading, setLoading]     = useState(false);
  const limit = 25;

  const load = useCallback(async (p = page, search = q, prod = product) => {
    setLoading(true);
    try {
      const r = await fetch(
        `/api/admin/customers?page=${p}&limit=${limit}&q=${encodeURIComponent(search)}&product=${prod}`,
        { credentials: 'include' },
      );
      if (r.ok) {
        const data = await r.json() as { customers: UserDoc[]; total: number };
        setCustomers(data.customers); setTotal(data.total);
      }
    } finally { setLoading(false); }
  }, [page, q, product]);

  useEffect(() => { void load(); }, [load]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[160px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); void load(1, q, product); } }}
            placeholder="Search email or username…"
            className="w-full bg-black border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-white outline-none focus:border-white/30 placeholder:text-white/20"
          />
        </div>
        <select
          value={product}
          onChange={(e) => { setProduct(e.target.value); setPage(1); void load(1, q, e.target.value); }}
          className="bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none"
        >
          <option value="all">All tools</option>
          <option value="token-g">Token-G</option>
          <option value="raider">Raider</option>
        </select>
        <button onClick={() => { setPage(1); void load(1, q, product); }} className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white transition-colors">
          <RefreshCw size={14} />
        </button>
      </div>

      <p className="text-xs text-white/30">{total} customers with active tools</p>

      {loading ? (
        <div className="py-12 flex justify-center"><Loader2 size={24} className="text-white/20 animate-spin" /></div>
      ) : (
        <div className="space-y-1">
          {customers.length === 0 && <p className="text-sm text-white/30 py-8 text-center">No customers found.</p>}
          {customers.map((u) => (
            <div key={u._id} className="bg-white/[0.02] border border-white/8 rounded-xl px-4 py-3 flex items-center gap-3">
              <img
                src={u.avatar ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(u.username)}&background=111&color=fff&size=32`}
                alt=""
                className="w-8 h-8 rounded-full shrink-0 object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white truncate">{u.username}</span>
                  <Badge label={u.provider} className="text-white/30 bg-white/5 border-white/10 shrink-0" />
                </div>
                <p className="text-xs text-white/40 truncate">{u.email}</p>
              </div>
              <p className="text-[10px] text-white/20 shrink-0">{fmt(u.createdAt)}</p>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => { const p = page - 1; setPage(p); void load(p); }} disabled={page <= 1} className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white disabled:opacity-30 transition-colors">
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs text-white/30">Page {page} / {totalPages}</span>
          <button onClick={() => { const p = page + 1; setPage(p); void load(p); }} disabled={page >= totalPages} className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white disabled:opacity-30 transition-colors">
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Users ────────────────────────────────────────────────────────
function SectionUsers() {
  const [users, setUsers]   = useState<UserDoc[]>([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [q, setQ]           = useState('');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<UserDoc | null>(null);
  const [detail, setDetail] = useState<{ orders: OrderDoc[]; redeemed: { licenseKey: string; product: string; plan: string; redeemedAt: string }[] } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const limit = 25;

  const load = useCallback(async (p = page, search = q) => {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/users?page=${p}&limit=${limit}&q=${encodeURIComponent(search)}`, { credentials: 'include' });
      if (r.ok) {
        const data = await r.json() as { users: UserDoc[]; total: number };
        setUsers(data.users); setTotal(data.total);
      }
    } finally { setLoading(false); }
  }, [page, q]);

  useEffect(() => { void load(); }, [load]);

  const openDetail = async (u: UserDoc) => {
    setSelected(u); setDetail(null); setDetailLoading(true);
    try {
      const r = await fetch(`/api/admin/users/${u._id}`, { credentials: 'include' });
      if (r.ok) setDetail((await r.json() as { orders: OrderDoc[]; redeemed: { licenseKey: string; product: string; plan: string; redeemedAt: string }[] }));
    } finally { setDetailLoading(false); }
  };

  const deleteUser = async (u: UserDoc) => {
    if (!confirm(`Delete user ${u.email}? This cannot be undone.`)) return;
    await fetch(`/api/admin/users/${u._id}`, { method: 'DELETE', credentials: 'include' });
    setSelected(null);
    void load();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); void load(1, q); } }}
            placeholder="Search email or username…"
            className="w-full bg-black border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-white outline-none focus:border-white/30 placeholder:text-white/20"
          />
        </div>
        <button onClick={() => { setPage(1); void load(1, q); }} className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white transition-colors">
          <RefreshCw size={14} />
        </button>
      </div>

      <p className="text-xs text-white/30">{total} users total</p>

      {loading ? (
        <div className="py-12 flex justify-center"><Loader2 size={24} className="text-white/20 animate-spin" /></div>
      ) : (
        <div className="space-y-1">
          {users.map((u) => (
            <button
              key={u._id}
              onClick={() => void openDetail(u)}
              className="w-full text-left bg-white/[0.02] border border-white/8 rounded-xl px-4 py-3 flex items-center gap-3 hover:bg-white/[0.04] transition-colors"
            >
              <img
                src={u.avatar ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(u.username)}&background=111&color=fff&size=32`}
                alt=""
                className="w-8 h-8 rounded-full shrink-0 object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white truncate">{u.username}</span>
                  <Badge label={u.provider} className="text-white/30 bg-white/5 border-white/10 shrink-0" />
                  {!u.emailVerified && <Badge label="unverified" className="text-yellow-400 bg-yellow-500/10 border-yellow-500/20 shrink-0" />}
                </div>
                <p className="text-xs text-white/40 truncate">{u.email}</p>
              </div>
              <p className="text-[10px] text-white/20 shrink-0">{fmt(u.createdAt)}</p>
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => { const p = page - 1; setPage(p); void load(p); }} disabled={page <= 1} className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white disabled:opacity-30 transition-colors">
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs text-white/30">Page {page} / {totalPages}</span>
          <button onClick={() => { const p = page + 1; setPage(p); void load(p); }} disabled={page >= totalPages} className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white disabled:opacity-30 transition-colors">
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* User detail drawer */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-start justify-end"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ x: 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md h-screen bg-[#0a0a0a] border-l border-white/10 overflow-y-auto p-6 space-y-5"
            >
              <div className="flex items-center justify-between">
                <p className="font-black text-white">User Detail</p>
                <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-white/8 text-white/40 hover:text-white transition-colors"><X size={14} /></button>
              </div>

              <div className="space-y-1">
                <p className="font-semibold text-white">{selected.username}</p>
                <p className="text-xs text-white/50">{selected.email}</p>
                <div className="flex gap-1.5 flex-wrap pt-1">
                  <Badge label={selected.provider} className="text-white/30 bg-white/5 border-white/10" />
                  <Badge label={selected.emailVerified ? 'verified' : 'unverified'} className={selected.emailVerified ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'} />
                </div>
                <p className="text-[10px] text-white/20 pt-1">Joined {fmt(selected.createdAt)} · Last login {fmt(selected.lastLogin)}</p>
              </div>

              {detailLoading && <div className="flex justify-center py-4"><Loader2 size={20} className="text-white/20 animate-spin" /></div>}

              {detail && (
                <>
                  <div>
                    <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Orders ({detail.orders.length})</p>
                    {detail.orders.length === 0 ? <p className="text-xs text-white/20">No orders.</p> : (
                      <div className="space-y-1.5">
                        {detail.orders.map((o) => (
                          <div key={o._id} className="bg-white/[0.02] border border-white/8 rounded-lg px-3 py-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs text-white font-medium">{o.product} - {o.plan}</span>
                              <Badge label={o.status} className={statusColor(o.status)} />
                            </div>
                            <p className="text-[10px] text-white/30 mt-0.5">${o.amountUsd.toFixed(2)} · {fmt(o.createdAt)}</p>
                            {o.licenseKey && <p className="text-[10px] font-mono text-white/25 mt-0.5 truncate">{o.licenseKey}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Redeemed Keys ({detail.redeemed.length})</p>
                    {detail.redeemed.length === 0 ? <p className="text-xs text-white/20">None.</p> : (
                      <div className="space-y-1.5">
                        {detail.redeemed.map((r) => (
                          <div key={r.licenseKey} className="bg-white/[0.02] border border-white/8 rounded-lg px-3 py-2">
                            <p className="text-xs text-white font-medium">{r.product} - {r.plan}</p>
                            <p className="text-[10px] font-mono text-white/25 truncate">{r.licenseKey}</p>
                            <p className="text-[10px] text-white/20">{fmt(r.redeemedAt)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              <button
                onClick={() => void deleteUser(selected)}
                className="w-full py-2 rounded-xl border border-red-500/20 text-red-400 text-sm hover:bg-red-500/10 transition-colors"
              >
                Delete User
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Orders ───────────────────────────────────────────────────────
function SectionOrders() {
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [q, setQ]           = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const limit = 25;

  const load = useCallback(async (p = page, search = q, st = status) => {
    setLoading(true);
    try {
      const r = await fetch(
        `/api/admin/orders?page=${p}&limit=${limit}&q=${encodeURIComponent(search)}&status=${st}`,
        { credentials: 'include' },
      );
      if (r.ok) {
        const data = await r.json() as { orders: OrderDoc[]; total: number };
        setOrders(data.orders); setTotal(data.total);
      }
    } finally { setLoading(false); }
  }, [page, q, status]);

  useEffect(() => { void load(); }, [load]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[160px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); void load(1, q, status); } }}
            placeholder="Email, order ID, key…"
            className="w-full bg-black border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-white outline-none focus:border-white/30 placeholder:text-white/20"
          />
        </div>
        <select
          value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); void load(1, q, e.target.value); }}
          className="bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none"
        >
          {['all', 'paid', 'pending', 'fulfilling', 'failed', 'expired'].map((s) => (
            <option key={s} value={s}>{s === 'all' ? 'All statuses' : s}</option>
          ))}
        </select>
        <button onClick={() => { setPage(1); void load(1, q, status); }} className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white transition-colors">
          <RefreshCw size={14} />
        </button>
      </div>

      <p className="text-xs text-white/30">{total} orders</p>

      {loading ? (
        <div className="py-12 flex justify-center"><Loader2 size={24} className="text-white/20 animate-spin" /></div>
      ) : (
        <div className="space-y-1.5">
          {orders.map((o) => (
            <div key={o._id} className="bg-white/[0.02] border border-white/8 rounded-xl px-4 py-3">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-sm font-semibold text-white">{o.email}</span>
                <Badge label={o.status} className={statusColor(o.status)} />
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs text-white/50">{o.product} - {o.plan}</span>
                <span className="text-xs text-white/40">${o.amountUsd.toFixed(2)}</span>
                <span className="text-[10px] text-white/20">{fmt(o.createdAt)}</span>
              </div>
              {o.licenseKey && (
                <p className="text-[10px] font-mono text-white/25 mt-1 truncate">{o.licenseKey}</p>
              )}
              <p className="text-[10px] text-white/15 mt-0.5">{o.internalId}</p>
            </div>
          ))}
          {orders.length === 0 && <p className="text-sm text-white/30 py-8 text-center">No orders found.</p>}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => { const p = page - 1; setPage(p); void load(p); }} disabled={page <= 1} className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white disabled:opacity-30 transition-colors">
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs text-white/30">Page {page} / {totalPages}</span>
          <button onClick={() => { const p = page + 1; setPage(p); void load(p); }} disabled={page >= totalPages} className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white disabled:opacity-30 transition-colors">
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Email composer ───────────────────────────────────────────────
function SectionEmail() {
  const [to, setTo]           = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody]       = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult]   = useState<{ ok: boolean; msg: string } | null>(null);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true); setResult(null);
    try {
      const r = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ to, subject, body }),
      });
      const data = await r.json() as { success?: boolean; error?: string };
      if (r.ok) {
        setResult({ ok: true, msg: `Email sent to ${to}` });
        setTo(''); setSubject(''); setBody('');
      } else {
        setResult({ ok: false, msg: data.error ?? 'Send failed.' });
      }
    } catch {
      setResult({ ok: false, msg: 'Network error.' });
    } finally { setSending(false); }
  };

  return (
    <form onSubmit={(e) => void send(e)} className="space-y-4 max-w-lg">
      <Input label="To" type="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder="user@example.com" required />
      <Input label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Your message subject" required />
      <Textarea label="Message" value={body} onChange={(e) => setBody(e.target.value)} rows={8} placeholder="Write your message here…" required />

      {result && (
        <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border ${result.ok ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>
          {result.ok ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
          {result.msg}
        </div>
      )}

      <button
        type="submit"
        disabled={sending}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black text-sm font-bold hover:bg-white/90 transition-colors disabled:opacity-50"
      >
        {sending ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
        {sending ? 'Sending…' : 'Send Email'}
      </button>
    </form>
  );
}

// ── Activity log ──────────────────────────────────────────────────
function SectionLogs() {
  const [logs, setLogs]     = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/logs', { credentials: 'include' });
      if (r.ok) setLogs(await r.json() as LogEntry[]);
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const levelColor = (l: string) =>
    l === 'error' ? 'text-red-400' : l === 'warn' ? 'text-yellow-400' : 'text-white/50';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-white/30">{logs.length} entries (last 500, newest first)</p>
        <button onClick={() => void load()} className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white transition-colors">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>
      {loading ? (
        <div className="py-12 flex justify-center"><Loader2 size={24} className="text-white/20 animate-spin" /></div>
      ) : (
        <div ref={ref} className="space-y-0.5 max-h-[60vh] overflow-y-auto pr-1">
          {logs.length === 0 && <p className="text-sm text-white/30 py-8 text-center">No log entries yet.</p>}
          {logs.map((l, i) => (
            <div key={i} className="flex items-start gap-3 py-1.5 border-b border-white/[0.04] font-mono">
              <span className="text-[10px] text-white/20 shrink-0 mt-0.5">{new Date(l.ts).toLocaleTimeString()}</span>
              <span className={`text-[10px] uppercase font-bold shrink-0 mt-0.5 ${levelColor(l.level)}`}>{l.level}</span>
              <span className="text-xs text-white/60 leading-relaxed">{l.msg}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Download form ────────────────────────────────────────────────
function DownloadForm({ initial, onSave, onCancel }: {
  initial?: Partial<DownloadDoc>;
  onSave: (data: Partial<DownloadDoc>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<DownloadDoc>>({
    product: 'token-g', version: '', url: '', size: '', checksum: '', releaseNotes: '', published: false,
    ...initial,
  });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof DownloadDoc, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <form onSubmit={async (e) => { e.preventDefault(); setSaving(true); try { await onSave(form); } finally { setSaving(false); } }}
      className="space-y-3 bg-white/[0.02] border border-white/8 rounded-xl p-4 mt-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className="text-[10px] text-white/30 uppercase tracking-widest block mb-1">Product</span>
          <select value={form.product} onChange={(e) => set('product', e.target.value)} className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none">
            {PRODUCT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <Input label="Version" value={form.version} onChange={(e) => set('version', e.target.value)} placeholder="e.g. 2.4.1" required />
      </div>
      <Input label="Download URL (HTTPS)" value={form.url} onChange={(e) => set('url', e.target.value)} placeholder="https://..." required />
      <div className="grid grid-cols-2 gap-3">
        <Input label="File Size" value={form.size} onChange={(e) => set('size', e.target.value)} placeholder="e.g. 42.3 MB" />
        <Input label="SHA-256" value={form.checksum} onChange={(e) => set('checksum', e.target.value)} placeholder="hash…" />
      </div>
      <Textarea label="Release Notes" value={form.releaseNotes} onChange={(e) => set('releaseNotes', e.target.value)} rows={3} placeholder="What changed…" />
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.published} onChange={(e) => set('published', e.target.checked)} className="rounded" />
          <span className="text-xs text-white/50">Published</span>
        </label>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onCancel} className="px-3 py-1.5 text-xs text-white/40 hover:text-white/70 transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-white text-black text-xs font-bold hover:bg-white/90 transition-colors disabled:opacity-50">
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Save
          </button>
        </div>
      </div>
    </form>
  );
}

// ── News form ────────────────────────────────────────────────────
function NewsForm({ initial, onSave, onCancel }: {
  initial?: Partial<NewsDoc>;
  onSave: (data: Partial<NewsDoc>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<NewsDoc>>({
    title: '', content: '', type: 'feature', published: false,
    publishedAt: new Date().toISOString().slice(0, 16),
    ...initial,
    ...(initial?.publishedAt ? { publishedAt: new Date(initial.publishedAt).toISOString().slice(0, 16) } : {}),
  });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof NewsDoc, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <form onSubmit={async (e) => { e.preventDefault(); setSaving(true); try { await onSave(form); } finally { setSaving(false); } }}
      className="space-y-3 bg-white/[0.02] border border-white/8 rounded-xl p-4 mt-3">
      <Input label="Title" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Update title…" required />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className="text-[10px] text-white/30 uppercase tracking-widest block mb-1">Type</span>
          <select value={form.type} onChange={(e) => set('type', e.target.value)} className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none capitalize">
            {NEWS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <span className="text-[10px] text-white/30 uppercase tracking-widest block mb-1">Date</span>
          <input type="datetime-local" value={form.publishedAt?.slice(0, 16)} onChange={(e) => set('publishedAt', e.target.value)} className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" />
        </div>
      </div>
      <Textarea label="Content" value={form.content} onChange={(e) => set('content', e.target.value)} rows={4} placeholder="Update details…" required />
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.published} onChange={(e) => set('published', e.target.checked)} className="rounded" />
          <span className="text-xs text-white/50">Published</span>
        </label>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onCancel} className="px-3 py-1.5 text-xs text-white/40 hover:text-white/70 transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-white text-black text-xs font-bold hover:bg-white/90 transition-colors disabled:opacity-50">
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Save
          </button>
        </div>
      </div>
    </form>
  );
}

// ── Downloads tab ────────────────────────────────────────────────
function SectionDownloads() {
  const [downloads, setDownloads] = useState<DownloadDoc[]>([]);
  const [loading, setLoading]     = useState(false);
  const [adding, setAdding]       = useState(false);
  const [editing, setEditing]     = useState<DownloadDoc | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/downloads', { credentials: 'include' });
      if (r.ok) setDownloads(await r.json() as DownloadDoc[]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const save = async (data: Partial<DownloadDoc>) => {
    if (editing) {
      await fetch(`/api/admin/downloads/${editing._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(data) });
      setEditing(null);
    } else {
      await fetch('/api/admin/downloads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(data) });
      setAdding(false);
    }
    void load();
  };

  const del = async (id: string) => {
    if (!confirm('Delete this download entry?')) return;
    await fetch(`/api/admin/downloads/${id}`, { method: 'DELETE', credentials: 'include' });
    void load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-black text-white">Downloads</h2>
        <button onClick={() => { setAdding(true); setEditing(null); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/8 border border-white/10 text-xs text-white/70 hover:text-white hover:bg-white/12 transition-all">
          <Plus size={13} /> Add
        </button>
      </div>
      {adding && !editing && <DownloadForm onSave={save} onCancel={() => setAdding(false)} />}
      {loading ? <div className="py-12 flex justify-center"><Loader2 size={24} className="text-white/20 animate-spin" /></div> : (
        <div className="space-y-3 mt-2">
          {downloads.length === 0 && <p className="text-sm text-white/30 py-8 text-center">No downloads yet.</p>}
          {downloads.map((d) => (
            <div key={d._id}>
              <div className="bg-white/[0.02] border border-white/8 rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white text-sm">{PRODUCT_OPTIONS.find((p) => p.value === d.product)?.label ?? d.product}</span>
                    <span className="text-xs font-mono text-white/50">v{d.version}</span>
                    <Badge label={d.published ? 'Live' : 'Draft'} className={d.published ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-white/25 bg-white/5 border-white/10'} />
                  </div>
                  <p className="text-xs text-white/30 truncate">{d.url}</p>
                  {d.size && <p className="text-xs text-white/20">{d.size}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => { setEditing(d); setAdding(false); }} className="p-2 rounded-lg hover:bg-white/8 transition-colors text-white/30 hover:text-white"><Edit2 size={13} /></button>
                  <button onClick={() => void del(d._id)} className="p-2 rounded-lg hover:bg-red-500/10 transition-colors text-white/30 hover:text-red-400"><Trash2 size={13} /></button>
                </div>
              </div>
              {editing?._id === d._id && <DownloadForm initial={d} onSave={save} onCancel={() => setEditing(null)} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── News tab ─────────────────────────────────────────────────────
function SectionNews() {
  const [news, setNews]     = useState<NewsDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<NewsDoc | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/news', { credentials: 'include' });
      if (r.ok) setNews(await r.json() as NewsDoc[]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const save = async (data: Partial<NewsDoc>) => {
    if (editing) {
      await fetch(`/api/admin/news/${editing._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(data) });
      setEditing(null);
    } else {
      await fetch('/api/admin/news', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(data) });
      setAdding(false);
    }
    void load();
  };

  const del = async (id: string) => {
    if (!confirm('Delete this news item?')) return;
    await fetch(`/api/admin/news/${id}`, { method: 'DELETE', credentials: 'include' });
    void load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-black text-white">Update News</h2>
        <button onClick={() => { setAdding(true); setEditing(null); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/8 border border-white/10 text-xs text-white/70 hover:text-white hover:bg-white/12 transition-all">
          <Plus size={13} /> Add
        </button>
      </div>
      {adding && !editing && <NewsForm onSave={save} onCancel={() => setAdding(false)} />}
      {loading ? <div className="py-12 flex justify-center"><Loader2 size={24} className="text-white/20 animate-spin" /></div> : (
        <div className="space-y-3 mt-2">
          {news.length === 0 && <p className="text-sm text-white/30 py-8 text-center">No updates yet.</p>}
          {news.map((n) => (
            <div key={n._id}>
              <div className="bg-white/[0.02] border border-white/8 rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white text-sm truncate">{n.title}</span>
                    <Badge label={n.type} className="text-white/30 bg-white/5 border-white/10 capitalize shrink-0" />
                    {!n.published && <Badge label="Draft" className="text-yellow-400 bg-yellow-500/10 border-yellow-500/20 shrink-0" />}
                  </div>
                  <p className="text-xs text-white/30 line-clamp-1">{n.content}</p>
                  <p className="text-[10px] text-white/20 mt-1">{fmt(n.publishedAt)}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => { setEditing(n); setAdding(false); }} className="p-2 rounded-lg hover:bg-white/8 transition-colors text-white/30 hover:text-white"><Edit2 size={13} /></button>
                  <button onClick={() => void del(n._id)} className="p-2 rounded-lg hover:bg-red-500/10 transition-colors text-white/30 hover:text-red-400"><Trash2 size={13} /></button>
                </div>
              </div>
              {editing?._id === n._id && <NewsForm initial={n} onSave={save} onCancel={() => setEditing(null)} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main admin panel ─────────────────────────────────────────────
export default function Admin() {
  const [authed, setAuthed]   = useState(false);
  const [checking, setChecking] = useState(true);
  const [tab, setTab]         = useState<Tab>('overview');

  useEffect(() => {
    fetch('/api/admin/me', { credentials: 'include' })
      .then((r) => { if (r.ok) setAuthed(true); })
      .finally(() => setChecking(false));
  }, []);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
    setAuthed(false);
  };

  if (checking) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 size={28} className="text-white/20 animate-spin" /></div>;
  if (!authed)  return <AdminLogin />;

  const tabs: { id: Tab; icon: React.ElementType; label: string }[] = [
    { id: 'overview',   icon: TrendingUp,   label: 'Overview'   },
    { id: 'customers',  icon: UserCheck,    label: 'Customers'  },
    { id: 'users',      icon: Users,        label: 'All Users'  },
    { id: 'orders',     icon: ShoppingCart, label: 'Orders'     },
    { id: 'email',      icon: Mail,         label: 'Email'      },
    { id: 'logs',       icon: ScrollText,   label: 'Logs'       },
    { id: 'downloads',  icon: Download,     label: 'Downloads'  },
    { id: 'news',       icon: Newspaper,    label: 'News'       },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/8 px-6 py-4 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <Shield size={16} className="text-white/40" />
          <span className="font-black text-white text-sm">MSK Hub</span>
          <span className="text-white/20 text-xs">/ Admin</span>
        </div>
        <button onClick={() => void handleLogout()} className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors">
          <LogOut size={13} /> Sign out
        </button>
      </header>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
        {/* Tab bar */}
        <div className="flex gap-1 mb-8 overflow-x-auto pb-1 scrollbar-hide border-b border-white/8">
          {tabs.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                tab === id
                  ? 'bg-white/8 text-white border border-white/10'
                  : 'text-white/35 hover:text-white/70'
              }`}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {tab === 'overview'  && <SectionOverview />}
            {tab === 'customers' && <SectionCustomers />}
            {tab === 'users'     && <SectionUsers />}
            {tab === 'orders'    && <SectionOrders />}
            {tab === 'email'     && <SectionEmail />}
            {tab === 'logs'      && <SectionLogs />}
            {tab === 'downloads' && <SectionDownloads />}
            {tab === 'news'      && <SectionNews />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
