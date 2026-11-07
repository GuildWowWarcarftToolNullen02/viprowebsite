import { PageWrapper } from '@/components/layout/PageWrapper';
import { motion } from 'framer-motion';
import { ShieldCheck, Zap, Server, Code, Settings, Lock } from 'lucide-react';

const features = [
  {
    icon: Zap,
    tag: 'PERFORMANCE',
    title: 'Multi-threaded Execution',
    desc: 'Advanced asynchronous multi-threading executes thousands of tasks concurrently - zero UI freeze, zero memory leaks.',
    stat: '10,000+',
    statLabel: 'tasks/sec',
  },
  {
    icon: ShieldCheck,
    tag: 'EVASION',
    title: 'Advanced Evasion',
    desc: 'Built-in TLS fingerprinting, dynamic header rotation, and smart delay algorithms to mimic human behavior at every layer.',
    stat: 'JA3',
    statLabel: 'spoofing',
  },
  {
    icon: Server,
    tag: 'NETWORK',
    title: 'Proxy Architecture',
    desc: 'Auto-rotation, health-checking, and ban detection - your tasks keep running on clean IPs without manual intervention.',
    stat: '99.9%',
    statLabel: 'uptime',
  },
  {
    icon: Code,
    tag: 'INTEGRATION',
    title: 'Clean API Integration',
    desc: 'Direct private endpoint access - no clunky browser automation. Microsecond response times at every operation.',
    stat: '<1ms',
    statLabel: 'latency',
  },
  {
    icon: Settings,
    tag: 'CONTROL',
    title: 'Granular Control',
    desc: 'Fine-tune delays, thread counts, and target parameters per operation. Every variable is yours to configure.',
    stat: '55+',
    statLabel: 'modules',
  },
  {
    icon: Lock,
    tag: 'SECURITY',
    title: 'Secure Licensing',
    desc: 'Hardware-locked licensing ensures you\'re always running genuine, uncompromised MSK Hub executables.',
    stat: 'HWID',
    statLabel: 'locked',
  },
];

export default function Features() {
  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">

        {/* Header */}
        <div className="text-center mb-12 sm:mb-24">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-white/50 tracking-widest uppercase"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
            Technical Architecture
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-5xl md:text-6xl font-black text-white mb-4 sm:mb-6 tracking-tight"
          >
            UNDER THE HOOD
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            We don't just glue APIs together. Discover the architecture that makes MSK Hub the standard for performance.
          </motion.p>
        </div>

        {/* Feature grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, idx) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ delay: idx * 0.08, duration: 0.5, ease: 'easeOut' }}
                className="group relative rounded-2xl border border-white/8 bg-[#0d0d0d] hover:border-white/20 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(255,255,255,0.06)] overflow-hidden flex flex-col"
              >
                {/* Top accent line - only on hover */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Subtle corner glow on hover */}
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/[0.04] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                {/* Card body */}
                <div className="p-7 flex flex-col flex-grow">

                  {/* Top row: icon container + stat */}
                  <div className="flex items-start justify-between mb-6">
                    {/* Icon box */}
                    <div className="relative w-12 h-12 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center group-hover:border-white/25 group-hover:bg-white/10 transition-all duration-300">
                      <Icon size={20} className="text-white/70 group-hover:text-white transition-colors duration-300" />
                    </div>

                    {/* Stat badge */}
                    <div className="text-right">
                      <div className="text-xl font-black text-white tracking-tight leading-none">{f.stat}</div>
                      <div className="text-[10px] text-white/35 uppercase tracking-widest mt-0.5">{f.statLabel}</div>
                    </div>
                  </div>

                  {/* Tag */}
                  <div className="mb-3">
                    <span className="inline-block text-[9px] font-black tracking-[0.2em] text-white/30 uppercase border border-white/8 rounded px-2 py-0.5 bg-white/[0.02]">
                      {f.tag}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-black text-white mb-3 leading-snug group-hover:text-white transition-colors">
                    {f.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-white/45 leading-relaxed group-hover:text-white/60 transition-colors duration-300 flex-grow">
                    {f.desc}
                  </p>
                </div>

                {/* Bottom separator + index number */}
                <div className="px-7 py-4 border-t border-white/5 flex items-center justify-between">
                  <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                  <span className="ml-4 text-xs font-black text-white/15 tabular-nums">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA bar - original glass style */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-32 p-1 border-y border-white/10 bg-gradient-to-r from-transparent via-white/5 to-transparent flex flex-col md:flex-row items-center justify-between px-10 py-12 rounded-2xl"
        >
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">Technical Documentation</h3>
            <p className="text-muted-foreground">Detailed usage guides and API specs are available for customers.</p>
          </div>
          <div className="mt-6 md:mt-0">
            <a
              href="https://discord.gg/BcwHsh3zBk"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              Request Docs in Discord
            </a>
          </div>
        </motion.div>

      </div>
    </PageWrapper>
  );
}
