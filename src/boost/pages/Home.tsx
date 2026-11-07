import { useState } from 'react';
import { useQuery }  from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Plus, Minus, Zap } from 'lucide-react';
import { PageWrapper }  from '@/boost/components/layout/PageWrapper';
import { MobileBottomDock } from '@/boost/components/layout/MobileBottomDock';
import { ProductCard }  from '@/boost/components/products/ProductCard';
import { BoostModal }   from '@/boost/components/products/BoostModal';
import { NitroModal }   from '@/boost/components/products/NitroModal';
import { TokenModal }   from '@/boost/components/products/TokenModal';
import { getProducts, getStats, type ProductInfo } from '@/boost/lib/api';

// ── Sparkle component ─────────────────────────────────────────────────────────
function Sparkle({ style }: { style: React.CSSProperties }) {
  return (
    <span style={{ position: 'absolute', pointerEvents: 'none', ...style }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L13.5 9H20L14.5 13.5L16.5 21L12 17L7.5 21L9.5 13.5L4 9H10.5L12 2Z" fill="rgba(255, 255, 255,0.85)" stroke="rgba(200, 200, 200,0.4)" strokeWidth="0.5"/>
      </svg>
    </span>
  );
}

// ── FAQ Section ───────────────────────────────────────────────────────────────
const faqs = [
  { q: 'What are Discord Server Boosts?', a: 'Server Boosts are a feature that lets users support their favourite Discord server and unlock perks like higher audio quality, more emojis, custom invite backgrounds, and more. Each boost comes from a real Nitro account.' },
  { q: 'How long until my boosts are delivered?', a: 'Boosts are applied automatically within minutes of your payment being confirmed. The entire process is automated.' },
  { q: 'Do the boosts stay permanently?', a: 'Boosts last for the duration you purchase - 1 month in this case. They will expire after that unless renewed.' },
  { q: 'What payment methods do you accept?', a: 'We accept a wide range of cryptocurrencies including USDT, BTC, ETH, and LTC, processed securely via our payment provider.' },
  { q: 'What if my boosts drop early?', a: 'Contact our support team via Discord immediately. Open a ticket and we\'ll investigate and resolve it.' },
  { q: 'Is there a customer dashboard?', a: 'The dashboard is coming soon. For now, please save your Nitro IDs and Discord tokens securely right after delivery - they will not be permanently stored in a dashboard yet.' },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" style={{ padding: '7rem 1.5rem', position: 'relative', zIndex: 10 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div className="grid lg:grid-cols-[380px_1fr] gap-12 lg:gap-16 items-start">

          {/* LEFT - Apex Model + Title & Support link */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="flex flex-col items-center lg:items-start lg:sticky lg:top-28"
          >
            {/* Apex image with soft white ambient glow */}
            <div style={{ position: 'relative', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div
                style={{
                  position: 'absolute',
                  width: 260,
                  height: 260,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, transparent 70%)',
                  filter: 'blur(50px)',
                  pointerEvents: 'none',
                }}
              />
              <img
                src="/apex-boost-faq.png?v=2"
                alt="Apex Boost Intel"
                style={{
                  position: 'relative',
                  zIndex: 10,
                  width: 240,
                  height: 240,
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 0 35px rgba(255, 255, 255, 0.12)) drop-shadow(0 15px 35px rgba(0, 0, 0, 0.8))',
                  animation: 'apexFloat 5s ease-in-out infinite',
                }}
              />
            </div>

            <div className="text-center lg:text-left">
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                  padding: '0.35rem 1rem',
                  borderRadius: 9999,
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  fontSize: '0.78rem',
                  color: 'rgba(255, 255, 255, 0.65)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.75)',
                    boxShadow: '0 0 8px rgba(255, 255, 255, 0.6)',
                  }}
                />
                Support Intel
              </div>

              <h2
                style={{
                  fontSize: 'clamp(2rem, 4vw, 2.75rem)',
                  fontWeight: 900,
                  color: '#FFFFFF',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.15,
                  margin: '0 0 1rem',
                }}
              >
                QUESTIONS<br />
                <span className="gradient-text">ANSWERED.</span>
              </h2>

              <p
                style={{
                  color: '#9A9A9E',
                  fontSize: '0.95rem',
                  lineHeight: 1.65,
                  maxWidth: 320,
                  margin: '0 auto 1.75rem',
                }}
                className="lg:mx-0"
              >
                Everything you need to know before supercharging your server. Can't find what you're looking for?
              </p>

              <a
                href="https://discord.gg/275XqNhvwa"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-discord"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  padding: '0.75rem 1.4rem',
                  borderRadius: 12,
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Ask in Discord <ArrowRight size={15} />
              </a>
            </div>
          </motion.div>

          {/* RIGHT - FAQ items */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            style={{ display: 'flex', flexDirection: 'column' }}
          >
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                style={{
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  background: open === i ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                  borderRadius: 8,
                  transition: 'background 0.2s',
                }}
              >
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  style={{
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    padding: '1.35rem 1rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
                    <span
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        background: 'rgba(255, 255, 255, 0.04)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        color: 'rgba(255, 255, 255, 0.45)',
                        flexShrink: 0,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span
                      style={{
                        color: open === i ? '#FFFFFF' : '#E8E8EC',
                        fontWeight: 700,
                        fontSize: '1rem',
                        lineHeight: 1.4,
                      }}
                    >
                      {faq.q}
                    </span>
                  </div>
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      flexShrink: 0,
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                      transition: 'all 0.2s',
                    }}
                  >
                    {open === i ? <Minus size={14} /> : <Plus size={14} />}
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
                      style={{ overflow: 'hidden' }}
                    >
                      <p
                        style={{
                          color: '#9A9A9E',
                          fontSize: '0.92rem',
                          lineHeight: 1.7,
                          paddingLeft: '3.75rem',
                          paddingRight: '1rem',
                          paddingBottom: '1.35rem',
                          margin: 0,
                        }}
                      >
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

// ── Main Home Page ────────────────────────────────────────────────────────────
export default function Home() {
  const [activeModal, setActiveModal] = useState<ProductInfo | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
    refetchInterval: 2 * 60_000, // refresh every 2 minutes
  });

  const { data: statsData } = useQuery({
    queryKey: ['stats'],
    queryFn: getStats,
    refetchInterval: 60_000,
  });

  const products = productsData?.products ?? [];
  const totalBoostsSold = statsData?.totalBoostsSold ?? null;

  const filteredProducts = products.filter((p) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'boost-1m') return p.id === 'boost-1m';
    if (selectedCategory === 'boost-3m') return p.id === 'boost-3m';
    if (selectedCategory === 'nitro') return p.category === 'nitro';
    if (selectedCategory === 'token') return p.category === 'token';
    return true;
  });

  function openModal(product: ProductInfo) {
    setActiveModal(product);
  }
  function closeModal() {
    setActiveModal(null);
  }

  return (
    <PageWrapper>
      {/* ── HERO SECTION ─────────────────────────────────────────── */}
      <section style={{ position: 'relative', paddingTop: '9rem', paddingBottom: '5rem', overflow: 'hidden', minHeight: '90vh', display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem', width: '100%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', alignItems: 'center' }}>

            {/* Left - text */}
            <div>
              {/* Premium Badge */}
              <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  marginBottom: '1.75rem',
                  padding: '0.4rem 1.1rem 0.4rem 0.65rem',
                  borderRadius: 9999,
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
                }}
              >
                <img
                  src="/boost-icon.png?v=7"
                  alt="Boost"
                  style={{
                    height: 22,
                    width: 'auto',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.35))',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    color: '#FFFFFF',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    letterSpacing: '0.02em',
                  }}
                >
                  Instant Delivery • Real Server Boosts
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.35 }}
                style={{ color: '#fff', fontWeight: 900, fontSize: 'clamp(2.4rem, 6vw, 3.8rem)', lineHeight: 1.1, letterSpacing: '-0.03em', margin: '0 0 0.5rem' }}
              >
                Supercharge Your<br />
                <span style={{ display: 'block', marginTop: '0.15em' }}>Discord Server</span>
              </motion.h1>

              {/* Gradient words */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.5 }}
              >
                <span className="gradient-text" style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 900, letterSpacing: '-0.03em', display: 'block', marginBottom: '1.5rem', lineHeight: 1 }}>
                  Boosts &amp; Nitro.
                </span>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.65 }}
                style={{ color: '#9A9A9E', fontSize: '1.05rem', lineHeight: 1.65, maxWidth: 420, marginBottom: '2rem' }}
              >
                Real accounts, instant delivery, competitive prices. Unlock server perks and Nitro features without the full subscription price.
              </motion.p>

              {/* Feature bullets */}
              <motion.ul
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.75 }}
                style={{ listStyle: 'none', padding: 0, margin: '0 0 2.5rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}
              >
                {['Real Nitro accounts, not bots', 'Boosts applied within minutes', 'Crypto payments accepted'].map((f) => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.9rem', color: '#d0d0d8' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'linear-gradient(120deg, #555555 0%, #C0C0C0 28%, #FFFFFF 48%, #999999 68%, #E8E8E8 85%, #666666 100%)', flexShrink: 0, boxShadow: '0 0 8px rgba(255, 255, 255,0.6)' }} />
                    {f}
                  </li>
                ))}
              </motion.ul>

              {/* CTA buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
                style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}
              >
                <a
                  href="#products"
                  className="btn-boost"
                  style={{ fontSize: '1rem', padding: '0.85rem 2rem', textDecoration: 'none' }}
                >
                  Shop Boosts <ArrowRight size={16} style={{ marginLeft: 6 }} />
                </a>
                <a
                  href="https://discord.gg/275XqNhvwa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-discord"
                  style={{ fontSize: '1rem', padding: '0.85rem 1.75rem' }}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.031.053a19.9 19.9 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                  </svg>
                  Join Discord
                </a>
              </motion.div>
            </div>

            {/* Right - floating phone */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
              style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            >
              {/* Glow behind phone */}
              <div style={{ position: 'absolute', width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255, 255, 255,0.22) 0%, transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none' }} />

              {/* Sparkles */}
              <Sparkle style={{ top: '8%',  left: '5%',  animation: 'sparkle 2.2s ease-in-out infinite', animationDelay: '0s' }} />
              <Sparkle style={{ top: '15%', right: '3%', animation: 'sparkle 2.2s ease-in-out infinite', animationDelay: '0.7s' }} />
              <Sparkle style={{ bottom: '25%', left: '2%', animation: 'sparkle 2.2s ease-in-out infinite', animationDelay: '1.3s' }} />
              <Sparkle style={{ bottom: '10%', right: '8%', animation: 'sparkle 2.2s ease-in-out infinite', animationDelay: '1.9s' }} />

              {/* Phone */}
              <img
                src="/phone-boost.png?v=4"
                alt="Discord server on smartphone"
                style={{
                  position: 'relative', zIndex: 10,
                  width: '100%', maxWidth: 380,
                  filter: 'drop-shadow(0 24px 60px rgba(255, 255, 255,0.3)) drop-shadow(0 8px 24px rgba(0,0,0,0.8))',
                  animation: 'phoneFloat 3.5s ease-in-out infinite',
                }}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── STATS SECTION ────────────────────────────────────────── */}
      <section style={{ background: '#09090b', padding: '6rem 1.5rem', position: 'relative', zIndex: 10, borderTop: '1px solid rgba(255, 255, 255, 0.08)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
        {/* Ambient Silver Backdrops & Glow Layers */}
        <div style={{ position: 'absolute', top: '50%', left: '15%', transform: 'translate(-50%, -50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 65%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '50%', right: '15%', transform: 'translate(50%, -50%)', width: 650, height: 650, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,200,200,0.06) 0%, rgba(255,255,255,0.02) 40%, transparent 70%)', filter: 'blur(90px)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '4rem', alignItems: 'center', position: 'relative', zIndex: 2 }}>
          
          {/* Left Column - Heading, text, and 2-column Stat Cards */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 style={{ color: '#fff', fontWeight: 900, fontSize: 'clamp(2.2rem, 5vw, 3.2rem)', lineHeight: 1.15, margin: '0 0 1.25rem', letterSpacing: '-0.03em' }}>
              Boosts Delivered.<br />
              <span className="gradient-text">No Fakes.</span>
            </h2>

            <p style={{ color: '#A0A0A5', fontSize: '1.02rem', lineHeight: 1.7, maxWidth: 480, margin: '0 0 2.25rem' }}>
              Every number shown here reflects actual, confirmed boost deliveries - not estimates or projections. Thousands of servers powered worldwide with instant execution.
            </p>

            {/* Stat Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem', maxWidth: 500 }}>
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="card-boost"
                style={{ padding: '1.6rem 1.6rem', borderRadius: 16, background: 'linear-gradient(145deg, #131317 0%, #0d0d10 100%)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <div className="gradient-text" style={{ fontWeight: 900, fontSize: 'clamp(2.2rem, 4vw, 2.8rem)', lineHeight: 1, marginBottom: '0.45rem' }}>
                  {totalBoostsSold != null ? totalBoostsSold.toLocaleString() : '-'}
                </div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.2rem' }}>Boosts Delivered</div>
                <div style={{ color: '#88888D', fontSize: '0.8rem' }}>since launch</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="card-boost"
                style={{ padding: '1.6rem 1.6rem', borderRadius: 16, background: 'linear-gradient(145deg, #131317 0%, #0d0d10 100%)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <div className="gradient-text" style={{ fontWeight: 900, fontSize: 'clamp(2.2rem, 4vw, 2.8rem)', lineHeight: 1, marginBottom: '0.45rem' }}>
                  &lt;5min
                </div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.2rem' }}>Avg. Delivery</div>
                <div style={{ color: '#88888D', fontSize: '0.8rem' }}>after payment</div>
              </motion.div>
            </div>
          </motion.div>

          {/* Right Column - Hero Showcase Apex without any weird lines/dots */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: 380 }}
          >
            {/* Smooth ambient glow without any harsh rings or dots */}
            <div style={{ position: 'absolute', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)', filter: 'blur(55px)', pointerEvents: 'none' }} />
            
            <img
              src="/apex-boost.png?v=7"
              alt="Apex Boost"
              style={{
                position: 'relative',
                zIndex: 2,
                width: '100%',
                maxWidth: 320,
                height: 'auto',
                objectFit: 'contain',
                filter: 'drop-shadow(0 25px 60px rgba(0,0,0,0.9)) drop-shadow(0 0 50px rgba(255,255,255,0.18))',
                animation: 'apexFloat 4.5s ease-in-out infinite'
              }}
            />
          </motion.div>

        </div>
      </section>

      {/* ── PRODUCTS SECTION ─────────────────────────────────────── */}
      <section id="products" style={{ padding: '5rem 1.5rem', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', width: '100%' }}>
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            style={{ textAlign: 'center', marginBottom: '3.5rem' }}
          >
            <span style={{ display: 'inline-block', background: 'rgba(255, 255, 255,0.1)', border: '1px solid rgba(255, 255, 255,0.25)', color: '#FFFFFF', fontSize: '0.78rem', fontWeight: 700, padding: '0.35rem 1rem', borderRadius: 20, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '1rem' }}>
              Our Products
            </span>
            <h2 style={{ color: '#fff', fontWeight: 900, fontSize: 'clamp(1.8rem, 5vw, 2.8rem)', margin: '0 0 0.75rem', letterSpacing: '-0.02em' }}>
              Everything You Need for{' '}
              <span className="gradient-text">Discord</span>
            </h2>
            <p style={{ color: '#9A9A9E', fontSize: '1.05rem', maxWidth: 540, margin: '0 auto' }}>
              Server boosts, Nitro tokens, and Discord accounts. Real delivery, competitive prices.
            </p>
          </motion.div>

          {/* ── Category Filter Pills Bar (Mobile-friendly scrollable track) ── */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 mb-8 justify-start sm:justify-center px-1">
            {[
              { id: 'all', label: 'All Products' },
              { id: 'boost-1m', label: '1 Month Boosts' },
              { id: 'boost-3m', label: '3 Months Boosts' },
              { id: 'nitro', label: 'Discord Nitro' },
              { id: 'token', label: 'Discord Tokens' },
            ].map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                    active
                      ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.35)] scale-[1.02]'
                      : 'bg-white/[0.04] text-white/50 border border-white/10 hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Products grid */}
          {productsLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '1.5rem' }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="card-boost" style={{ height: 480, animation: 'pulse 1.5s ease-in-out infinite', background: 'rgba(18,17,24,0.8)', borderRadius: 20 }} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '1.5rem' }}>
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} onPurchase={openModal} />
              ))}
            </div>
          )}

          {!productsData?.supplierAvailable && !productsLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ textAlign: 'center', marginTop: '2rem', color: '#9A9A9E', fontSize: '0.85rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '0.85rem' }}
            >
              Stock information is temporarily unavailable. Please check back shortly or contact us on Discord.
            </motion.div>
          )}
        </div>
      </section>

      {/* ── FAQ SECTION ──────────────────────────────────────────── */}
      <FAQ />

      {/* ── Purchase Modals ───────────────────────────────────────── */}
      <AnimatePresence>
        {activeModal?.category === 'boost' && (
          <BoostModal key="boost-modal" product={activeModal} open={true} onClose={closeModal} />
        )}
        {activeModal?.category === 'nitro' && (
          <NitroModal key="nitro-modal" product={activeModal} open={true} onClose={closeModal} />
        )}
        {activeModal?.category === 'token' && (
          <TokenModal key="token-modal" product={activeModal} open={true} onClose={closeModal} />
        )}
      </AnimatePresence>

      {/* ── Fixed Mobile Bottom App Dock ── */}
      <MobileBottomDock onSelectCategory={setSelectedCategory} />
    </PageWrapper>
  );
}
