import { motion } from 'framer-motion';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 text-center"
      style={{ background: '#000000' }}>
      {/* Background glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 50% 40% at 50% 30%, rgba(255, 255, 255,0.07) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10">
        {/* Giant 404 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
          className="select-none mb-6"
          style={{
            fontSize: 'clamp(6rem, 20vw, 12rem)',
            fontWeight: 900,
            background: 'linear-gradient(135deg, #FFFFFF 0%, #E8E8E8 60%, rgba(255, 255, 255,0.3) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 1,
          }}>
          404
        </motion.div>

        {/* Icon / decoration */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-5xl mb-6 select-none">
          ⚡
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold text-white mb-4">
          Page Not Found
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.27 }}
          className="text-lg mb-10 max-w-md mx-auto"
          style={{ color: '#9A9A9E' }}>
          The page you're looking for doesn't exist, or it may have been moved. Let's get you back
          to the store.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.34 }}
          className="flex flex-wrap gap-4 justify-center">
          <Link href="/">
            <a
              className="inline-block px-7 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(120deg, #555555 0%, #C0C0C0 28%, #FFFFFF 48%, #999999 68%, #E8E8E8 85%, #666666 100%)' }}>
              ← Back to Store
            </a>
          </Link>

          <Link href="/#products">
            <a
              className="inline-block px-7 py-3 rounded-xl font-semibold text-white transition-all hover:border-purple-400"
              style={{ border: '1px solid rgba(255, 255, 255,0.3)' }}>
              Browse Products
            </a>
          </Link>
        </motion.div>

        {/* Discord help link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-10 text-sm"
          style={{ color: '#9A9A9E' }}>
          Need help?{' '}
          <a
            href="https://discord.gg/275XqNhvwa"
            target="_blank"
            rel="noreferrer"
            className="underline"
            style={{ color: '#5865F2' }}>
            Join our Discord
          </a>
        </motion.p>
      </div>
    </div>
  );
}
