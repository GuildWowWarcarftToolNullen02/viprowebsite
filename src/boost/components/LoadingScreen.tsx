import { motion, AnimatePresence } from 'framer-motion';

interface LoadingScreenProps {
  className?: string;
}

export default function LoadingScreen(_props: LoadingScreenProps) {
  return (
    <AnimatePresence>
      <motion.div
        key="loading"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.5 } }}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
        style={{ backgroundColor: 'var(--boost-bg)' }}
      >
        {/* Purple glow background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 600px 400px at 50% 50%, rgba(255, 255, 255,0.12) 0%, transparent 70%)',
          }}
        />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex flex-col items-center gap-6 relative z-10"
        >
          {/* Icon + Text */}
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: 'linear-gradient(120deg, #555555 0%, #C0C0C0 28%, #FFFFFF 48%, #999999 68%, #E8E8E8 85%, #666666 100%)', }}
            >
              ⚡
            </div>
            <span className="text-3xl font-black tracking-tight" style={{ color: '#FFFFFF' }}>
              Vip<span style={{ color: '#FFFFFF' }}>Pro</span>{' '}
              <span className="gradient-text">Boosts</span>
            </span>
          </div>

          {/* Loading bar container */}
          <div
            className="w-64 h-1 rounded-full overflow-hidden"
            style={{ background: 'rgba(255, 255, 255,0.15)' }}
          >
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.4, ease: 'easeInOut' }}
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(120deg, #555555 0%, #C0C0C0 28%, #FFFFFF 48%, #999999 68%, #E8E8E8 85%, #666666 100%)' }}
            />
          </div>

          <p className="text-sm font-medium" style={{ color: 'var(--boost-muted)' }}>
            Loading premium services...
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
