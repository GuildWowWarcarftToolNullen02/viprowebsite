import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { AlertTriangle, CheckCircle, XCircle, MessageSquare } from 'lucide-react';

const eligibleReasons = [
  'Your order was paid but no items were delivered within 24 hours.',
  'Fewer boosts were applied than the quantity you paid for (partial delivery) and we cannot resolve the shortfall.',
  'A delivered Nitro token or account was already invalid at the time of delivery.',
];

const ineligibleReasons = [
  'You changed your mind after delivery.',
  'The Discord server you boosted was later banned or deleted by Discord.',
  'Your Discord account was banned by Discord after receiving boosts.',
  "You violated Discord's Terms of Service and lost access to boosts as a result.",
  'Boosts expired after their intended duration (1 month).',
  'Tokens were valid at delivery but later became invalid through your own use or Discord action.',
];

const steps = [
  { icon: '1', label: 'Join our Discord', desc: 'Go to discord.gg/275XqNhvwa and open a support ticket.' },
  { icon: '2', label: 'Provide your order ID', desc: 'Share the order ID from your confirmation page so we can look up your order.' },
  { icon: '3', label: 'We investigate', desc: 'Our team will verify the delivery status with our supplier within 24-48 hours.' },
  { icon: '4', label: 'Resolution', desc: 'We will either re-deliver the missing items or issue a refund for undelivered quantities.' },
];

export default function Refund() {
  return (
    <div className="min-h-screen" style={{ background: '#000000', paddingTop: '80px' }}>
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 50% 30% at 50% 0%, rgba(255, 255, 255,0.07) 0%, transparent 70%)' }} />

      <div className="max-w-3xl mx-auto px-6 py-16 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{ background: 'rgba(255, 255, 255,0.1)', border: '1px solid rgba(255, 255, 255,0.25)', color: '#FFFFFF' }}>
            Legal Document
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Refund Policy</h1>
          <p style={{ color: '#9A9A9E' }}>
            Last updated: October 2026 &nbsp;·&nbsp; Applies to all purchases on boost.sessionguardvip.cc
          </p>
          <div className="mt-4 h-px"
            style={{ background: 'linear-gradient(90deg, rgba(255, 255, 255,0.5), transparent)' }} />
        </motion.div>

        {/* Core policy banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl p-5 mb-8 flex items-start gap-4"
          style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.3)' }}>
          <AlertTriangle size={22} className="text-yellow-400 mt-0.5 shrink-0" />
          <div>
            <p className="font-bold text-yellow-300 mb-1">All Sales Are Final by Default</p>
            <p className="text-sm" style={{ color: '#d1b87a', lineHeight: 1.65 }}>
              Because we sell digital goods - Discord boosts, Nitro tokens, and account tokens - all
              sales are final and non-refundable by default. Once a product is delivered, it cannot be
              returned or reversed. Refunds are only considered in the limited circumstances listed below.
            </p>
          </div>
        </motion.div>

        {/* Eligible / Ineligible */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {/* Eligible */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl p-6"
            style={{ background: '#0d0b12', border: '1px solid rgba(34,197,94,0.2)' }}>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle size={18} className="text-green-400" />
              <h2 className="font-bold text-white">Eligible for Refund</h2>
            </div>
            <ul className="space-y-3">
              {eligibleReasons.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: '#9A9A9E' }}>
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Ineligible */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl p-6"
            style={{ background: '#0d0b12', border: '1px solid rgba(239,68,68,0.2)' }}>
            <div className="flex items-center gap-2 mb-4">
              <XCircle size={18} className="text-red-400" />
              <h2 className="font-bold text-white">Not Eligible for Refund</h2>
            </div>
            <ul className="space-y-3">
              {ineligibleReasons.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: '#9A9A9E' }}>
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Partial deliveries */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-xl p-6 mb-8"
          style={{ background: '#0d0b12', border: '1px solid rgba(255, 255, 255,0.1)' }}>
          <h2 className="text-lg font-bold text-white mb-3">Partial Deliveries (Boost Orders)</h2>
          <p style={{ color: '#9A9A9E', lineHeight: 1.75 }}>
            For Server Boost orders, if fewer boosts were applied than ordered (a partial delivery),
            you are eligible for a proportional refund or re-delivery for the undelivered portion.
            For example, if you ordered 10 boosts and 7 were delivered, we will either deliver the
            remaining 3 or refund the cost of 3 boosts at the unit price you paid.
          </p>
          <p className="mt-3 text-sm" style={{ color: '#9A9A9E' }}>
            The number of boosts actually applied is recorded automatically and visible on your order
            confirmation page.
          </p>
        </motion.div>

        {/* Process */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl p-6 mb-8"
          style={{ background: '#111113', border: '1px solid rgba(255, 255, 255,0.12)' }}>
          <h2 className="text-lg font-bold text-white mb-5">How to Request a Refund</h2>
          <div className="space-y-4">
            {steps.map((step) => (
              <div key={step.icon} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                  style={{ background: 'rgba(255, 255, 255,0.15)', color: '#FFFFFF', border: '1px solid rgba(255, 255, 255,0.3)' }}>
                  {step.icon}
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{step.label}</p>
                  <p className="text-sm mt-0.5" style={{ color: '#9A9A9E' }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Resolution timeframe */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-xl p-6 mb-8"
          style={{ background: '#0d0b12', border: '1px solid rgba(255, 255, 255,0.08)' }}>
          <h2 className="text-lg font-bold text-white mb-3">Resolution Timeframe</h2>
          <p style={{ color: '#9A9A9E', lineHeight: 1.75 }}>
            We aim to resolve all support requests within <strong className="text-white">48 hours</strong>.
            If we are unable to resolve a delivery issue within 48 hours of your support request, you
            are eligible for a full refund of the undelivered quantity. Refunds, where issued, are
            processed in cryptocurrency and may take additional time to confirm on-chain depending on
            network conditions.
          </p>
        </motion.div>

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl p-6 mb-10 flex items-start gap-4"
          style={{ background: 'rgba(88,101,242,0.08)', border: '1px solid rgba(88,101,242,0.25)' }}>
          <MessageSquare size={22} style={{ color: '#5865F2' }} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-white mb-1">Need to open a refund request?</p>
            <p className="text-sm mb-3" style={{ color: '#9A9A9E' }}>
              Join our Discord and open a support ticket. Have your order ID ready.
            </p>
            <a
              href="https://discord.gg/275XqNhvwa"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: '#5865F2' }}>
              Join Discord Support
            </a>
          </div>
        </motion.div>

        {/* Footer nav */}
        <div className="pt-6 flex flex-wrap gap-4 items-center"
          style={{ borderTop: '1px solid rgba(255, 255, 255,0.1)' }}>
          <Link href="/">
            <a className="px-5 py-2.5 rounded-xl font-semibold text-white text-sm"
              style={{ background: 'linear-gradient(120deg, #555555 0%, #C0C0C0 28%, #FFFFFF 48%, #999999 68%, #E8E8E8 85%, #666666 100%)' }}>
              ← Back to Store
            </a>
          </Link>
          <Link href="/tos">
            <a className="text-sm underline" style={{ color: '#9A9A9E' }}>Terms of Service</a>
          </Link>
          <Link href="/privacy">
            <a className="text-sm underline" style={{ color: '#9A9A9E' }}>Privacy Policy</a>
          </Link>
        </div>
      </div>
    </div>
  );
}
