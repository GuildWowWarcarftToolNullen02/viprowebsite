import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Copy, Check, AlertTriangle } from 'lucide-react';
import { Link, useSearch } from 'wouter';
import { getOrderStatus } from '@/boost/lib/api';

type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired';
type FulfillmentStatus = 'pending' | 'processing' | 'completed' | 'partial' | 'failed';

interface OrderStatus {
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  product: string;
  quantity: number;
  totalPrice: number;
  serverName?: string;
  serverIcon?: string;
  boostsDelivered?: number;
  deliveredItems?: string[];
  deliveredItemCount?: number;
}

type UIState =
  | 'waiting_payment'
  | 'processing'
  | 'boost_complete'
  | 'token_complete'
  | 'failed'
  | 'expired';

function getUIState(order: OrderStatus): UIState {
  if (order.paymentStatus === 'expired') return 'expired';
  if (order.paymentStatus === 'failed') return 'failed';
  if (order.paymentStatus !== 'paid') return 'waiting_payment';
  // Paid
  if (['pending', 'processing'].includes(order.fulfillmentStatus)) return 'processing';
  if (['completed', 'partial'].includes(order.fulfillmentStatus)) {
    return order.product === 'boost-1m' ? 'boost_complete' : 'token_complete';
  }
  return 'failed';
}

const POLL_INTERVAL_MS = 3000;
const STOP_POLLING_STATES: UIState[] = ['boost_complete', 'token_complete', 'failed', 'expired'];

export default function PaymentSuccess() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const orderId = params.get('order') ?? '';

  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!orderId) { setError('No order ID found in URL.'); return; }

    const fetchStatus = async () => {
      try {
        const data = await getOrderStatus(orderId);
        setOrder(data);
        const state = getUIState(data);
        if (STOP_POLLING_STATES.includes(state) && intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } catch {
        // Don't stop polling on transient errors
      }
    };

    fetchStatus();
    intervalRef.current = setInterval(fetchStatus, POLL_INTERVAL_MS);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [orderId]);

  const handleCopy = () => {
    if (!order?.deliveredItems?.length) return;
    navigator.clipboard.writeText(order.deliveredItems.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const uiState: UIState = order ? getUIState(order) : 'waiting_payment';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20"
      style={{ background: '#000000' }}>
      {/* Background glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 20%, rgba(255, 255, 255,0.08) 0%, transparent 70%)',
        }}
      />

      <div className="w-full max-w-lg relative z-10">
        <AnimatePresence mode="wait">
          {/* ── Waiting for payment ──────────────────────────────────── */}
          {uiState === 'waiting_payment' && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255, 255, 255,0.12)', border: '2px solid rgba(255, 255, 255,0.3)' }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}>
                  <Clock size={36} style={{ color: '#FFFFFF' }} />
                </motion.div>
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">Waiting for Payment</h1>
              <p className="mb-2" style={{ color: '#9A9A9E' }}>
                Complete your payment in the NowPayments window.
              </p>
              <p className="text-sm mb-8" style={{ color: '#9A9A9E' }}>
                This page updates automatically every few seconds.
              </p>
              {order && (
                <div className="rounded-xl p-4 mb-6 text-left"
                  style={{ background: '#111113', border: '1px solid rgba(255, 255, 255,0.15)' }}>
                  <p className="text-sm mb-1" style={{ color: '#9A9A9E' }}>Order total</p>
                  <p className="text-xl font-bold text-white">\${order.totalPrice.toFixed(2)} USD</p>
                  <p className="text-xs mt-2" style={{ color: '#9A9A9E' }}>
                    Order ID: <span className="font-mono" style={{ color: '#FFFFFF' }}>{orderId.slice(0, 8)}…</span>
                  </p>
                </div>
              )}
              {error && <p className="text-red-400 text-sm">{error}</p>}
              {!orderId && (
                <p className="text-red-400">No order ID found. Please check your link.</p>
              )}
            </motion.div>
          )}

          {/* ── Processing fulfillment ───────────────────────────────── */}
          {uiState === 'processing' && order && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255, 255, 255,0.12)', border: '2px solid rgba(255, 255, 255,0.3)' }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}>
                  <div className="w-8 h-8 rounded-full border-2 border-t-transparent"
                    style={{ borderColor: '#FFFFFF', borderTopColor: 'transparent' }} />
                </motion.div>
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">Processing Your Order</h1>
              <p style={{ color: '#9A9A9E' }}>
                Payment confirmed! We're delivering your {order.product === 'boost-1m' ? 'boosts' : 'tokens'} now.
              </p>
              <p className="text-sm mt-2" style={{ color: '#9A9A9E' }}>This usually takes 1-2 minutes.</p>
            </motion.div>
          )}

          {/* ── Boost completed ──────────────────────────────────────── */}
          {uiState === 'boost_complete' && order && (
            <motion.div
              key="boost_done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.4)' }}>
                <CheckCircle size={40} className="text-green-400" />
              </motion.div>

              <h1 className="text-2xl font-bold text-white mb-2">Boosts Applied! 🎉</h1>
              {order.boostsDelivered != null && (
                <p className="text-xl font-semibold mb-4" style={{ color: '#FFFFFF' }}>
                  {order.boostsDelivered} boost{order.boostsDelivered !== 1 ? 's' : ''} delivered
                </p>
              )}
              {order.serverName && (
                <div className="flex items-center justify-center gap-3 mb-6 p-4 rounded-xl"
                  style={{ background: '#111113', border: '1px solid rgba(255, 255, 255,0.2)' }}>
                  {order.serverIcon && (
                    <img src={order.serverIcon} alt="" className="w-10 h-10 rounded-full" />
                  )}
                  <div className="text-left">
                    <p className="font-semibold text-white">{order.serverName}</p>
                    <p className="text-sm" style={{ color: '#9A9A9E' }}>Your server has been boosted</p>
                  </div>
                </div>
              )}
              <p className="text-sm mb-6" style={{ color: '#9A9A9E' }}>
                Need help? Join our{' '}
                <a href="https://discord.gg/275XqNhvwa" className="underline"
                  style={{ color: '#5865F2' }} target="_blank" rel="noreferrer">
                  Discord server
                </a>.
              </p>
              <Link href="/">
                <a className="btn-boost px-6 py-3 rounded-xl inline-block">← Back to Store</a>
              </Link>
            </motion.div>
          )}

          {/* ── Token / Nitro completed ──────────────────────────────── */}
          {uiState === 'token_complete' && order && (
            <motion.div
              key="token_done"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.4)' }}>
                  <CheckCircle size={40} className="text-green-400" />
                </motion.div>
                <h1 className="text-2xl font-bold text-white mb-2">Order Complete!</h1>
                <p style={{ color: '#9A9A9E' }}>
                  {order.deliveredItemCount ?? order.deliveredItems?.length ?? 0} item
                  {(order.deliveredItemCount ?? order.deliveredItems?.length ?? 0) !== 1 ? 's' : ''} delivered
                </p>
              </div>

              {/* ⚠️ Critical warning */}
              <div className="rounded-xl p-4 mb-4"
                style={{ background: 'rgba(234,179,8,0.08)', border: '2px solid rgba(234,179,8,0.4)' }}>
                <div className="flex items-start gap-3">
                  <AlertTriangle size={22} className="text-yellow-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-yellow-300 mb-1 text-sm">
                      ⚠️ IMPORTANT - Copy your tokens NOW
                    </p>
                    <p className="text-yellow-200 text-sm leading-relaxed">
                      The customer dashboard is <strong>not yet available</strong>. Your tokens are shown
                      below <strong>only once</strong>. Copy and save them in a secure place immediately.
                      We cannot retrieve them again after you leave this page.
                    </p>
                  </div>
                </div>
              </div>

              {/* Token display */}
              {order.deliveredItems && order.deliveredItems.length > 0 ? (
                <div className="rounded-xl overflow-hidden mb-4"
                  style={{ border: '1px solid rgba(255, 255, 255,0.25)' }}>
                  <div className="flex items-center justify-between px-4 py-2"
                    style={{ background: '#1a1722' }}>
                    <span className="text-sm font-medium" style={{ color: '#FFFFFF' }}>
                      Your Tokens ({order.deliveredItems.length})
                    </span>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-all"
                      style={{
                        background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(255, 255, 255,0.15)',
                        color: copied ? '#4ade80' : '#FFFFFF',
                        border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(255, 255, 255,0.3)'}`,
                      }}>
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? 'Copied!' : 'Copy All'}
                    </button>
                  </div>
                  <textarea
                    readOnly
                    value={order.deliveredItems.join('\n')}
                    rows={Math.min(order.deliveredItems.length, 8)}
                    className="w-full resize-none font-mono text-xs p-4 outline-none"
                    style={{
                      background: '#0e0c14',
                      color: '#e2e2e6',
                      fontFamily: '"Fira Code", "Courier New", monospace',
                    }}
                  />
                </div>
              ) : (
                <div className="rounded-xl p-4 mb-4 text-center"
                  style={{ background: '#111113', border: '1px solid rgba(255, 255, 255,0.15)' }}>
                  <p style={{ color: '#9A9A9E' }}>
                    Your tokens have been delivered ({order.deliveredItemCount ?? 0} items).
                    If you don't see them, contact support.
                  </p>
                </div>
              )}

              <p className="text-sm text-center mb-6" style={{ color: '#9A9A9E' }}>
                Need help?{' '}
                <a href="https://discord.gg/275XqNhvwa" style={{ color: '#5865F2' }}
                  target="_blank" rel="noreferrer" className="underline">
                  Open a support ticket
                </a>
              </p>

              <div className="flex gap-3 justify-center">
                <button onClick={handleCopy}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all"
                  style={{
                    background: 'linear-gradient(120deg, #555555 0%, #C0C0C0 28%, #FFFFFF 48%, #999999 68%, #E8E8E8 85%, #666666 100%)',
                    color: '#fff',
                  }}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy Tokens'}
                </button>
                <Link href="/">
                  <a className="px-5 py-2.5 rounded-xl font-semibold text-white transition-all"
                    style={{ border: '1px solid rgba(255, 255, 255,0.3)' }}>
                    Back to Store
                  </a>
                </Link>
              </div>
            </motion.div>
          )}

          {/* ── Failed ──────────────────────────────────────────────── */}
          {uiState === 'failed' && (
            <motion.div
              key="failed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(239,68,68,0.12)', border: '2px solid rgba(239,68,68,0.3)' }}>
                <XCircle size={40} className="text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">Order Failed</h1>
              <p className="mb-6" style={{ color: '#9A9A9E' }}>
                We couldn't fulfill your order. Please contact support via Discord and provide your order ID.
              </p>
              <div className="rounded-xl p-3 mb-6 font-mono text-sm"
                style={{ background: '#111113', color: '#FFFFFF' }}>
                Order ID: {orderId}
              </div>
              <a href="https://discord.gg/275XqNhvwa" target="_blank" rel="noreferrer"
                className="inline-block px-6 py-3 rounded-xl font-semibold text-white mr-3"
                style={{ background: '#5865F2' }}>
                Open Support Ticket
              </a>
              <Link href="/">
                <a className="inline-block px-6 py-3 rounded-xl font-semibold text-white"
                  style={{ border: '1px solid rgba(255, 255, 255,0.3)' }}>
                  Back to Store
                </a>
              </Link>
            </motion.div>
          )}

          {/* ── Expired ─────────────────────────────────────────────── */}
          {uiState === 'expired' && (
            <motion.div
              key="expired"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(107,114,128,0.15)', border: '2px solid rgba(107,114,128,0.3)' }}>
                <Clock size={40} className="text-gray-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">Payment Expired</h1>
              <p className="mb-6" style={{ color: '#9A9A9E' }}>
                The payment window for this order has expired. Please start a new order.
              </p>
              <Link href="/#products">
                <a className="inline-block px-6 py-3 rounded-xl font-semibold text-white"
                  style={{ background: 'linear-gradient(120deg, #555555 0%, #C0C0C0 28%, #FFFFFF 48%, #999999 68%, #E8E8E8 85%, #666666 100%)' }}>
                  Start New Order
                </a>
              </Link>
            </motion.div>
          )}

          {/* ── No order ID ─────────────────────────────────────────── */}
          {!orderId && (
            <motion.div
              key="no_id"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(239,68,68,0.12)', border: '2px solid rgba(239,68,68,0.3)' }}>
                <XCircle size={40} className="text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">Invalid Link</h1>
              <p className="mb-6" style={{ color: '#9A9A9E' }}>
                No order ID was found in this URL. This link may be invalid.
              </p>
              <Link href="/">
                <a className="inline-block px-6 py-3 rounded-xl font-semibold text-white"
                  style={{ background: 'linear-gradient(120deg, #555555 0%, #C0C0C0 28%, #FFFFFF 48%, #999999 68%, #E8E8E8 85%, #666666 100%)' }}>
                  Back to Store
                </a>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
