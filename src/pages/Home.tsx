import { PageWrapper } from '@/components/layout/PageWrapper';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Terminal, Shield, Zap, CheckCircle2, Plus, Minus } from 'lucide-react';
import { Link } from 'wouter';
import { useEffect, useState } from 'react';

const homeFaqs = [
  {
    q: "What exactly is VipPro Token-G?",
    a: "VipPro Token-G is a high-performance Discord token generation software. It automates the process of creating and verifying accounts at scale, using advanced fingerprint spoofing and proxy handling to ensure high-quality tokens."
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept major cryptocurrencies (LTC, BTC, ETH, USDT) and PayPal. All payments are handled manually through our Discord ticketing system - open a ticket and our team will guide you through checkout."
  },
  {
    q: "How do I receive the software after purchase?",
    a: "Once your payment is confirmed in the Discord ticket, you will receive a unique license key and a download link to the latest encrypted executable. Delivery is usually within minutes of payment confirmation."
  },
  {
    q: "Is there a monthly subscription or lifetime license?",
    a: "We offer both. You can choose a monthly subscription or a lifetime license - whichever fits your needs. Open a ticket in our Discord for current pricing on either option."
  },
  {
    q: "Do you provide refunds?",
    a: "Due to the digital and easily replicable nature of the software and license keys, all sales are final. Please ensure you understand what the tool does before purchasing."
  },
  {
    q: "Do I need my own proxies?",
    a: "Not necessarily. Our tools work on your own IP or VPN. We recommend Mullvad VPN (mullvad.net) for privacy. If you need proxies for high-volume operations, we can point you to trusted providers in our Discord."
  },
  {
    q: "How do I get technical support?",
    a: "All support is handled exclusively through our Discord server. Verified customers get access to private support channels where our developers and community helpers can assist you."
  },
];

function HomeFAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-16 sm:py-32 relative z-10 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-[360px_1fr] gap-10 md:gap-16 items-start">

          {/* LEFT - Apex + title */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center md:items-start md:sticky md:top-32"
          >
            {/* Apex image with glow */}
            <div className="relative mb-6 sm:mb-8 flex items-center justify-center">
              <div className="absolute w-48 sm:w-64 h-48 sm:h-64 rounded-full bg-white/5 blur-[60px]" />
              <div className="absolute w-36 sm:w-48 h-36 sm:h-48 rounded-full border border-white/5 animate-[spin_20s_linear_infinite]" />
              <img
                src={`${import.meta.env.BASE_URL}apex-eyes.png`}
                alt="Apex"
                className="relative z-10 w-40 h-40 sm:w-56 sm:h-56 object-contain drop-shadow-[0_0_40px_rgba(255,255,255,0.12)] animate-[apexFloat_5s_ease-in-out_infinite]"
              />
            </div>

            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-white/50 tracking-widest uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
                Support Intel
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight mb-4">
                QUESTIONS<br />
                <span className="text-gradient">ANSWERED.</span>
              </h2>
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed max-w-xs mb-6 sm:mb-8 mx-auto md:mx-0">
                Everything you need to know before joining VipPro. Can't find what you're looking for?
              </p>
              <a
                href="https://discord.gg/BcwHsh3zBk"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-sm px-5 py-2.5 inline-flex items-center gap-2"
              >
                Ask in Discord <ArrowRight size={14} />
              </a>
            </div>
          </motion.div>

          {/* RIGHT - FAQ items */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="space-y-0"
          >
            {homeFaqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className={`border-b border-white/8 last:border-b-0 ${open === i ? 'bg-white/[0.02]' : ''}`}
              >
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 sm:gap-6 py-5 sm:py-6 px-3 sm:px-4 text-left group transition-colors hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <span className="shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded border border-white/15 bg-white/5 flex items-center justify-center text-[10px] sm:text-xs font-black text-white/40 tabular-nums group-hover:border-white/30 transition-colors">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-sm sm:text-base font-bold text-white/90 group-hover:text-white transition-colors leading-snug">
                      {faq.q}
                    </span>
                  </div>
                  <span className="shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded border border-white/15 bg-white/5 flex items-center justify-center text-white/50 group-hover:border-white/30 group-hover:text-white transition-colors">
                    {open === i ? <Minus size={13} /> : <Plus size={13} />}
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {open === i && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed pl-4 sm:pl-[60px] pr-4 sm:pr-12 pb-6">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </div>
    </section>
  );
}

function TerminalLine({ text, color, delay, bold }: { text: string; color: string; delay: number; bold?: boolean }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  if (!visible) return null;
  return (
    <div className={`${color} ${bold ? 'font-bold' : ''} text-xs leading-relaxed`}>
      <span className="text-white/30 mr-2">&gt;</span>{text}
    </div>
  );
}

export default function Home() {
  const stats = [
    { label: 'Uptime', value: '99.9%' },
    { label: 'Active Users', value: '2.4K+' },
    { label: 'Tokens Gen/Day', value: '50K+' },
    { label: 'Support Response', value: '< 2h' },
  ];

  return (
    <PageWrapper>
      {/* Hero Section */}
      <section className="relative pt-24 sm:pt-32 pb-16 sm:pb-32 overflow-hidden px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10 md:gap-12 items-center">

          {/* Left - text */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="inline-flex items-center gap-2 mb-6 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-xs sm:text-sm text-white/70"
            >
              <span className="w-2 h-2 rounded-full bg-white inline-block animate-pulse" />
              Best Tools. Built to Last.
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tighter text-white mb-6 leading-[1.08]"
            >
              SURGICAL<br />
              PRECISION.<br />
              <span className="text-gradient">NO COMPROMISE.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="text-sm sm:text-base text-muted-foreground max-w-md mb-4 leading-relaxed"
            >
              Advanced Discord tooling built for performance, reliability, and scale.
            </motion.p>

            <motion.ul
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.7 }}
              className="space-y-2 mb-8 sm:mb-10"
            >
              {[
                'Auto-verification & captcha bypass',
                'Advanced TLS/JA3 fingerprint spoofing',
                'Multi-threaded - unlimited scale',
              ].map((f) => (
                <li key={f} className="flex items-center gap-3 text-xs sm:text-sm text-gray-300">
                  <span className="w-2 h-2 rounded-full bg-white/70 shrink-0 shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                  {f}
                </li>
              ))}
            </motion.ul>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.9 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3 sm:gap-4 w-full sm:w-auto"
            >
              <Link href="/shop" className="btn-primary text-sm sm:text-base px-8 py-3.5 sm:py-4 text-center justify-center">
                View Products <ArrowRight className="ml-2" size={18} />
              </Link>
              <a
                href="https://discord.gg/BcwHsh3zBk"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-sm sm:text-base px-8 py-3.5 sm:py-4 text-center justify-center"
              >
                Join Discord
              </a>
            </motion.div>
          </div>

          {/* Right - floating phone */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
            className="relative flex justify-center items-center mt-6 md:mt-0"
          >
            {/* Glow blob behind phone */}
            <div className="absolute w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-white/10 blur-[80px] opacity-50 pointer-events-none" />

            {/* Sparkles */}
            {[
              'top-[8%] left-[0%] delay-[0s]',
              'top-[18%] right-[2%] delay-[0.6s]',
              'bottom-[28%] left-[2%] delay-[1.1s]',
              'bottom-[8%] right-[8%] delay-[1.7s]',
            ].map((cls, i) => (
              <span
                key={i}
                className={`absolute ${cls} w-6 h-6 opacity-0 animate-[sparkle_2s_ease-in-out_infinite]`}
                style={{ animationDelay: ['0s','0.6s','1.1s','1.7s'][i] }}
              >
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L13.5 9H20L14.5 13.5L16.5 21L12 17L7.5 21L9.5 13.5L4 9H10.5L12 2Z" fill="rgba(200,200,200,0.9)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"/>
                </svg>
              </span>
            ))}

            {/* Phone image */}
            <img
              src={`${import.meta.env.BASE_URL}phone.png?v=4`}
              alt="MSK Hub App"
              className="relative z-10 w-full max-w-[260px] sm:max-w-sm drop-shadow-[0_20px_60px_rgba(0,0,0,0.8)] animate-[phoneFloat_3s_ease-in-out_infinite]"
            />
          </motion.div>
        </div>
      </section>

      {/* ── TRUSTED SECTION ── */}
      <section className="py-16 sm:py-28 relative z-10 overflow-hidden px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10 md:gap-16 items-center">

          {/* Left - stats + heading */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight mb-4 tracking-tight">
              BEST PRICE.<br />
              <span className="text-gradient">UNBEATABLE VALUE.</span>
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base mb-8 sm:mb-12 max-w-md leading-relaxed">
              MSK Hub tools have been used by thousands of power users to execute at scale. The numbers speak for themselves.
            </p>

            <div className="grid grid-cols-2 gap-4 sm:gap-5">
              {[
                { value: '50K+',  label: 'Tokens Generated Daily',  sub: 'and counting', highlight: true },
                { value: '2.4K+', label: 'Active Users',             sub: 'this month', highlight: false },
                { value: '99.9%', label: 'Tool Uptime',              sub: 'last 90 days', highlight: false },
                { value: '<2h',   label: 'Support Response',         sub: 'average time', highlight: false },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className={`rounded-2xl border p-5 sm:p-6 backdrop-blur-sm transition-all ${
                    s.highlight 
                      ? 'border-accent/40 bg-gradient-to-br from-accent/20 to-accent/5 shadow-lg shadow-accent/10' 
                      : 'border-white/10 bg-white/[0.03]'
                  }`}
                >
                  <div className={`text-3xl sm:text-4xl font-black mb-2 ${s.highlight ? 'text-accent' : 'text-white'}`}>
                    {s.value}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-white mb-1 leading-snug">{s.label}</div>
                  <div className="text-[11px] sm:text-xs text-white/50">{s.sub}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right - 3D model */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative flex flex-col items-center justify-center mt-6 md:mt-0"
          >
            {/* outer glow ring */}
            <div className="absolute w-64 sm:w-80 h-64 sm:h-80 rounded-full border border-white/5 animate-[spin_18s_linear_infinite]" />
            <div className="absolute w-52 sm:w-64 h-52 sm:h-64 rounded-full border border-white/5 animate-[spin_12s_linear_infinite_reverse]" />
            {/* radial glow */}
            <div className="absolute w-60 sm:w-72 h-60 sm:h-72 rounded-full bg-white/5 blur-[60px]" />

            <img
              src={`${import.meta.env.BASE_URL}apex-model.png`}
              alt="MSK Main"
              className="relative z-10 w-52 sm:w-72 md:w-80 drop-shadow-[0_0_60px_rgba(255,255,255,0.15)] animate-[apexFloat_4s_ease-in-out_infinite]"
            />

          </motion.div>
        </div>
      </section>


      {/* Products Preview */}
      <section className="py-16 sm:py-32 relative z-10 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-white mb-3 sm:mb-4">THE ARSENAL</h2>
          <p className="text-xs sm:text-base text-muted-foreground max-w-xl mx-auto">Elite tools designed for mass-action and token generation. Unmatched speed and reliability.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
          {/* MSK Token-G */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-card flex flex-col h-full overflow-hidden"
          >
            {/* Banner */}
            <img
              src={`${import.meta.env.BASE_URL}banner-token-g.png`}
              alt="MSK Token-G"
              className="w-full h-36 sm:h-40 object-cover object-center"
            />
            <div className="p-5 sm:p-8 flex flex-col flex-grow">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">MSK Token-G</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-6 flex-grow leading-relaxed">
                Advanced Discord token generator with custom fingerprinting, phone verification, multi-method support, and built-in humanizer for high-quality output at scale.
              </p>
              <ul className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8">
                {['Phone verify auto (5sim, HeroSMS)', 'Custom fingerprint & multi-thread', 'Own IP, VPN & proxy support'].map(f => (
                  <li key={f} className="flex items-center text-xs sm:text-sm text-gray-300">
                    <CheckCircle2 size={15} className="text-white mr-2 opacity-70 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/shop" className="btn-secondary w-full text-center text-sm py-3">Explore MSK Token-G</Link>
            </div>
          </motion.div>

          {/* MSK Raider Tool */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-card flex flex-col h-full overflow-hidden"
          >
            {/* Banner */}
            <img
              src={`${import.meta.env.BASE_URL}banner-raider-tool.png`}
              alt="MSK Raider Tool"
              className="w-full h-36 sm:h-40 object-cover object-center"
            />
            <div className="p-5 sm:p-8 flex flex-col flex-grow">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">MSK Raider Tool</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-6 flex-grow leading-relaxed">
              The ultimate mass-action suite with 55+ modules. Spam, bypass, scrape, and execute complex operations across thousands of accounts simultaneously.
            </p>
            <ul className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8">
              {['DM, channel & forum spammers', 'Bypass: captcha, rules, onboarding', 'VC crasher, server cloner & more'].map(f => (
                <li key={f} className="flex items-center text-xs sm:text-sm text-gray-300">
                  <CheckCircle2 size={15} className="text-white mr-2 opacity-70 shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <Link href="/shop" className="btn-secondary w-full text-center text-sm py-3">Explore Raider</Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Core */}
      <section className="py-16 sm:py-32 bg-black/40 border-y border-white/5 relative z-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-white mb-4 sm:mb-6 leading-tight">ENGINEERED FOR EXTREMES.</h2>
              <p className="text-sm sm:text-lg text-muted-foreground mb-6 sm:mb-8 leading-relaxed">
                We don't build generic software. MSK Hub tools are crafted to handle massive scale without breaking a sweat. Every line of code is optimized for raw performance.
              </p>
              <div className="space-y-5 sm:space-y-6">
                <div className="flex gap-4">
                  <div className="mt-1"><Shield className="text-white shrink-0" size={22} /></div>
                  <div>
                    <h4 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2">Anti-Detection Layer</h4>
                    <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">Advanced fingerprint spoofing keeps your operations under the radar.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1"><Zap className="text-white shrink-0" size={22} /></div>
                  <div>
                    <h4 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2">Zero-Latency Architecture</h4>
                    <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">Multi-threaded core engine ensures instantaneous execution at scale.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative mt-6 md:mt-0">
              <div className="rounded-xl border border-white/10 overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.8)]">
                <img
                  src={`${import.meta.env.BASE_URL}msktoken-g.png`}
                  alt="MSK Token-G GUI"
                  className="w-full h-auto block"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ SECTION ── */}
      <HomeFAQ />

    </PageWrapper>
  );
}
