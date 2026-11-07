import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, XCircle, Copy, Check, ExternalLink } from 'lucide-react';

const base = import.meta.env.BASE_URL;

const PLAN_LABELS: Record<string, string> = {
  monthly: 'Monthly',
  lifetime: 'Lifetime',
  source: 'Source',
};

const PRODUCT_LABELS: Record<string, string> = {
  'token-g': 'MSK Token-G',
  raider: 'MSK Raider Tool',
};

type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired';

interface StatusData {
  status: PaymentStatus;
  key?: string;
  product?: string;
  plan?: string;
}

export default function PaymentSuccess() {
  const [location] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('order');

  const [data, setData] = useState<StatusData | null>(null);
  const [copied, setCopied] = useState(false);
  const [dots, setDots] = useState('');

  // Animated dots for "Processing"
  useEffect(() => {
    if (data?.status !== 'pending') return;
    const id = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
    return () => clearInterval(id);
  }, [data?.status]);

  // Poll every 4 seconds while pending
  useEffect(() => {
    if (!orderId) return;

    async function poll() {
      try {
        const res = await fetch(`/api/payments/status/${orderId}`);
        if (!res.ok) return;
        const json: StatusData = await res.json();
        setData(json);
      } catch { /* ignore */ }
    }

    poll();
    const id = setInterval(() => {
      setData(current => {
        if (current?.status === 'paid' || current?.status === 'failed' || current?.status === 'expired') {
          clearInterval(id);
          return current;
        }
        poll();
        return current;
      });
    }, 4000);

    return () => clearInterval(id);
  }, [orderId]);

  function copyKey() {
    if (!data?.key) return;
    navigator.clipboard.writeText(data.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!orderId) {
    return (
      <PageWrapper>
        <div className="max-w-lg mx-auto px-6 py-32 text-center">
          <p className="text-muted-foreground">No order found.</p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-lg mx-auto px-6 py-24">

        {/* Pending */}
        {(!data || data.status === 'pending') && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-10 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mx-auto mb-6">
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
            <h1 className="text-2xl font-black text-white mb-3">Awaiting Payment{dots}</h1>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Your crypto payment is being confirmed. This page updates automatically - keep it open.
              Your license key will appear here and be emailed to you once confirmed.
            </p>
            <div className="flex gap-2 items-center justify-center text-xs text-white/30 bg-white/5 rounded-lg px-4 py-2 border border-white/10">
              <span>Order ID:</span>
              <code className="font-mono text-white/50">{orderId}</code>
            </div>
          </motion.div>
        )}

        {/* Paid - show key */}
        {data?.status === 'paid' && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-10"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <h1 className="text-2xl font-black text-white mb-2">Payment Confirmed!</h1>
              <p className="text-muted-foreground text-sm">
                {PRODUCT_LABELS[data.product ?? ''] ?? data.product} - {PLAN_LABELS[data.plan ?? ''] ?? data.plan}
              </p>
            </div>

            <div className="mb-6">
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Your License Key</p>
              <div
                className="bg-black/50 border border-red-500/40 rounded-xl p-5 text-center cursor-pointer group hover:border-red-500/60 transition-colors"
                onClick={copyKey}
              >
                <code className="font-mono text-base text-white tracking-widest break-all">
                  {data.key}
                </code>
                <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-white/30 group-hover:text-white/50 transition-colors">
                  {copied
                    ? <><Check size={11} className="text-green-400" /><span className="text-green-400">Copied!</span></>
                    : <><Copy size={11} /><span>Click to copy</span></>
                  }
                </div>
              </div>
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 mb-6">
              <p className="text-xs text-yellow-400 font-semibold mb-1">⚠ Save your key</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This key has also been emailed to you. If you ever lose it, open a support ticket on Discord with your purchase email.
              </p>
            </div>

            <a
              href="https://discord.gg/BcwHsh3zBk"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              Get the download on Discord <ExternalLink size={14} />
            </a>
          </motion.div>
        )}

        {/* Failed / Expired */}
        {(data?.status === 'failed' || data?.status === 'expired') && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-10 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-black text-white mb-3">
              Payment {data.status === 'expired' ? 'Expired' : 'Failed'}
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              {data.status === 'expired'
                ? 'The payment window expired. Please try again.'
                : 'Something went wrong with your payment. If funds were deducted, open a support ticket.'}
            </p>
            <div className="flex gap-3">
              <a href={`${base}shop`} className="btn-secondary flex-1 text-center">Back to Shop</a>
              <a
                href="https://discord.gg/BcwHsh3zBk"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary flex-1 text-center"
              >
                Get Support
              </a>
            </div>
          </motion.div>
        )}

      </div>
    </PageWrapper>
  );
}
