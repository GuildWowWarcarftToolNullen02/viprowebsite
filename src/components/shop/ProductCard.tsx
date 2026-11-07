import { ShoppingCart, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCurrency, convertPrice } from '@/context/CurrencyContext';
import { Link } from 'wouter';

interface ProductCardProps {
  productId: number | string;
  name: string;
  price: number;
  category: string;
  inStock: boolean;
  variant?: string;
  image?: string;
  delay?: number;
  onAddToCart?: () => void;
}

export function ProductCard({
  productId,
  name,
  price,
  category,
  inStock,
  variant,
  delay = 0,
  onAddToCart,
}: ProductCardProps) {
  const { currency } = useCurrency();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="glass-card group hover:border-white/20 hover:shadow-2xl hover:shadow-white/5 transition-all duration-300 flex flex-col h-full"
    >
      {/* Image Placeholder - Larger */}
      <div className="relative overflow-hidden rounded-t-xl bg-gradient-to-br from-white/10 to-white/5 aspect-square flex items-center justify-center border-b border-white/10 group-hover:from-white/15 group-hover:to-white/8 transition-all">
        <Package size={80} className="text-white/20 group-hover:text-white/30 transition-colors group-hover:scale-110 duration-300" />
        {!inStock && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
            <span className="text-sm font-bold text-white/90 uppercase tracking-wider px-4 py-2 bg-white/10 rounded-lg border border-white/20">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 space-y-4 flex-grow flex flex-col">
        {/* Category Badge */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-accent uppercase tracking-wider">
            {category}
          </span>
          {variant && (
            <span className="text-[10px] text-white/40 uppercase tracking-wider">
              {variant}
            </span>
          )}
        </div>

        {/* Product Name */}
        <h3 className="text-base font-bold text-white line-clamp-2 min-h-[3rem] leading-snug">
          {name}
        </h3>

        {/* Spacer to push price/buttons to bottom */}
        <div className="flex-grow" />

        {/* Price and Stock Status */}
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-white">
              {convertPrice(price, currency)}
            </p>
            {inStock ? (
              <span className="text-xs text-green-400 font-semibold">✓ In Stock</span>
            ) : (
              <span className="text-xs text-red-400 font-semibold">✗ Unavailable</span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          {inStock && onAddToCart && (
            <button
              onClick={onAddToCart}
              className="flex-1 h-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 flex items-center justify-center gap-2 transition-all group/btn"
              title="Add to cart"
            >
              <ShoppingCart size={16} className="text-white/60 group-hover/btn:text-white transition-colors" />
              <span className="text-sm font-semibold text-white/80 group-hover/btn:text-white">Add</span>
            </button>
          )}
          <Link
            href={`/shop/product/${productId}`}
            className={`${inStock && onAddToCart ? 'flex-1' : 'w-full'} h-11 rounded-xl bg-accent/10 hover:bg-accent/20 border border-accent/30 hover:border-accent/50 flex items-center justify-center transition-all text-sm font-bold text-white`}
          >
            View Details
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
