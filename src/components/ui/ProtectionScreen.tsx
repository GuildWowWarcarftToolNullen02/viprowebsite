/**
 * ProtectionScreen - shown when the backend detects an active DDoS attack.
 *
 * Polls /api/protection/status every 10 seconds.
 * Renders a full-screen black overlay while underAttack is true,
 * then fades out automatically once the attack ends.
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProtectionStatus {
  underAttack: boolean;
  since?: number;
  until?: number;
}

export function ProtectionScreen() {
  const [status, setStatus] = useState<ProtectionStatus | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch('/api/protection/status', { credentials: 'same-origin' });
        if (res.ok && !cancelled) {
          const data: ProtectionStatus = await res.json();
          setStatus(data);
        }
      } catch {
        // Silently ignore - never block the site if this check fails
      }
    }

    poll();
    const interval = setInterval(poll, 10_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const show = status?.underAttack === true;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="ddos-protection"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[99999] bg-black flex flex-col items-center justify-center select-none"
        >
          {/* Logo */}
          <motion.img
            src={`${import.meta.env.BASE_URL}msk-logo.png`}
            alt="MSK Hub"
            className="w-14 h-14 object-contain mb-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0.6, 1, 0.6], scale: 1 }}
            transition={{ opacity: { duration: 2, repeat: Infinity }, scale: { duration: 0.4 } }}
          />

          {/* Scan bar */}
          <div className="w-52 h-[2px] bg-white/8 rounded-full overflow-hidden mb-6">
            <div className="h-full bg-white/70 rounded-full protection-scan" />
          </div>

          {/* Status text */}
          <p className="text-white/50 text-[11px] tracking-[0.25em] uppercase mb-2">
            Verifying your connection
          </p>
          <p className="text-white/20 text-[10px] tracking-widest uppercase">
            MSK Hub &middot; DDoS Protection Active
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
