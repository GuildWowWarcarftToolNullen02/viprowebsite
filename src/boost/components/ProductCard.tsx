import { motion } from 'framer-motion';
import { Zap, Sparkles, Key } from 'lucide-react';
import type { ProductInfo } from '@/boost/lib/api';
import { fmtPrice } from '@/boost/lib/api';

const categoryIcon = {
  boost: <Zap size={24} style={{ color: '#FFFFFF' }} />,
  nitro: <Sparkles size={24} style={{ color: '#FFFFFF' }} />,
  token: <Key size={24} style={{ color: '#FFFFFF' }} />,
};

const productBanners: Record<string, string> = {
  'boost-1m': '/banner-server-boost.png?v=3',
  'boost-3m': '/banner-server-boost.png?v=3',
  'nitro-1m': '/banner-nitro-tokens.png?v=3',
  'nitro-3m': '/banner-nitro-tokens.png?v=3',
  'discord-token': '/banner-discord-tokens.png?v=1',
};

interface ProductCardProps {
  product: ProductInfo;
  onPurchase: (p: ProductInfo) => void;
}

export function ProductCard({ product, onPurchase }: ProductCardProps) {
  const isOOS = product.outOfStock || !product.available;
  const isLowStock = !isOOS && product.stock > 0 && product.stock < 10;
  const banner = productBanners[product.id];

  return (
    <motion.div
      className="card-boost"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45 }}
      style={{
        padding: '2.25rem',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 560,
        opacity: isOOS ? 0.78 : 1,
        borderRadius: 20,
      }}
    >
      {/* Banner image or styled header */}
      {banner ? (
        <div style={{
          width: 'calc(100% + 4.5rem)',
          height: 210,
          margin: '-2.25rem -2.25rem 1.75rem -2.25rem',
          position: 'relative',
          overflow: 'hidden',
          background: '#0a0a0c',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <img
            src={banner}
            alt={product.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>
      ) : (
        <div style={{
          width: 'calc(100% + 4.5rem)',
          height: 210,
          margin: '-2.25rem -2.25rem 1.75rem -2.25rem',
          position: 'relative',
          overflow: 'hidden',
          background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.06) 0%, rgba(17,17,19,0.98) 75%)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: 18,
            background: 'rgba(255,255,255,0.06)',
            border: '1.5px solid rgba(255,255,255,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 24px rgba(255,255,255,0.08)',
          }}>
            {categoryIcon[product.category]}
          </div>
        </div>
      )}

      {/* Header row: Status Badge (on text embed) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginBottom: '1.2rem',
      }}>
        {/* Status badge - fat embed styling */}
        {product.outOfStock || !product.available ? (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(255, 77, 77, 0.12)',
            color: '#ff5c5c',
            fontSize: '0.85rem',
            fontWeight: 800,
            padding: '0.5rem 1.25rem',
            borderRadius: 24,
            border: '1.5px solid rgba(255, 92, 92, 0.45)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            boxShadow: '0 2px 12px rgba(255, 92, 92, 0.2)',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff5c5c' }} />
            Out of Stock
          </span>
        ) : isLowStock ? (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(255, 180, 0, 0.12)',
            color: '#ffb400',
            fontSize: '0.85rem',
            fontWeight: 800,
            padding: '0.5rem 1.25rem',
            borderRadius: 24,
            border: '1.5px solid rgba(255, 180, 0, 0.45)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            boxShadow: '0 2px 12px rgba(255, 180, 0, 0.2)',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffb400' }} />
            Low Stock
          </span>
        ) : (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(0, 200, 100, 0.1)',
            color: '#00e676',
            fontSize: '0.85rem',
            fontWeight: 800,
            padding: '0.5rem 1.25rem',
            borderRadius: 24,
            border: '1.5px solid rgba(0, 230, 118, 0.45)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            boxShadow: '0 2px 12px rgba(0, 230, 118, 0.2)',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00e676' }} />
            In Stock
          </span>
        )}
      </div>

      {/* Title + price */}
      <h3 style={{ color: '#fff', fontWeight: 800, fontSize: '1.3rem', marginBottom: '0.5rem', letterSpacing: '-0.01em' }}>
        {product.title}
      </h3>
      {product.unitPrice != null ? (
        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
          <span className="gradient-text" style={{ fontSize: '1.85rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
            {fmtPrice(product.unitPrice)}
          </span>
          <span style={{ color: '#9A9A9E', fontSize: '0.9rem' }}>per unit</span>
        </div>
      ) : (
        <div style={{ marginBottom: '1rem' }}>
          <span style={{ color: '#9A9A9E', fontSize: '1.15rem', fontWeight: 600 }}>Price TBD</span>
        </div>
      )}

      {/* Description */}
      <p style={{ color: '#9A9A9E', fontSize: '0.94rem', lineHeight: 1.65, marginBottom: '1.5rem', flexGrow: 1 }}>
        {product.description}
      </p>

      {/* Features */}
      {product.features && product.features.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {product.features.map((f) => (
            <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.88rem', color: '#b5b5bc' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'linear-gradient(120deg, #C0C0C0, #FFFFFF)', flexShrink: 0 }} />
              {f}
            </li>
          ))}
        </ul>
      )}

      {/* Stock count */}
      {!isOOS && product.available && (
        <p style={{ color: '#7a7a82', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
          {product.stock} units available · Min {product.minQty}
        </p>
      )}

      {/* CTA */}
      <button
        onClick={() => !isOOS && product.available && onPurchase(product)}
        disabled={isOOS || !product.available}
        className="btn-boost"
        style={{
          width: '100%',
          padding: '0.88rem 1.5rem',
          fontSize: '0.98rem',
          fontWeight: 700,
          borderRadius: 14,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.65rem',
        }}
      >
        {isOOS ? (
          <>
            <img
              src="/boost-full.png?v=1"
              alt="Boost"
              style={{
                height: 22,
                width: 'auto',
                objectFit: 'contain',
                opacity: 0.65,
                filter: 'grayscale(20%) drop-shadow(0 0 6px rgba(255, 255, 255, 0.15))',
                flexShrink: 0,
                pointerEvents: 'none',
              }}
            />
            <span>Out of Stock</span>
          </>
        ) : (
          <>
            <img
              src="/boost-full.png?v=1"
              alt="Boost"
              style={{
                height: 22,
                width: 'auto',
                objectFit: 'contain',
                filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.45))',
                flexShrink: 0,
                pointerEvents: 'none',
              }}
            />
            <span>Buy Now →</span>
          </>
        )}
      </button>
    </motion.div>
  );
}
