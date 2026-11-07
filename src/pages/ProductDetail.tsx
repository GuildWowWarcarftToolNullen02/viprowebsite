import { PageWrapper } from '@/components/layout/PageWrapper';
import { motion } from 'framer-motion';
import { useRoute, Link, useLocation } from 'wouter';
import { ArrowLeft, Package, ShoppingCart, Check, Minus, Plus, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCurrency, convertPrice } from '@/context/CurrencyContext';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { productsApi, type ExudosProduct, type ExudosVariant } from '@/lib/api/store';

// Map category name to category ID for breadcrumb
const categoryIdMap: Record<string, string> = {
  'Accounts': 'accounts',
  'Streaming': 'streaming',
  'Music': 'music',
  'AI': 'ai',
  'Software & Tools': 'software-tools',
  'VPN & Privacy': 'vpn-privacy',
  'Social Boost': 'social-boosts',
  'Discord Services': 'discord-services',
};

export default function ProductDetail() {
  const [match, params] = useRoute('/shop/product/:productId');
  const [_location, navigate] = useLocation();
  const productId = params?.productId || '';
  const { currency } = useCurrency();
  const { addToCart, loading: cartLoading } = useCart();
  const { toast } = useToast();

  const [product, setProduct] = useState<ExudosProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ExudosVariant | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Fetch product on mount
  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  // Set default variant when product loads
  useEffect(() => {
    if (product && product.variants.length > 0 && !selectedVariant) {
      setSelectedVariant(product.variants[0]);
    }
  }, [product]);

  async function fetchProduct() {
    try {
      setLoading(true);
      setError(null);
      const data = await productsApi.getById(Number(productId));
      setProduct(data);
    } catch (err) {
      console.error('Failed to fetch product:', err);
      setError('Unable to load product details. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  const handleAddToCart = async () => {
    if (!product || !selectedVariant) return;

    if (!selectedVariant.inStock) {
      toast({
        title: 'Out of Stock',
        description: 'This product variant is currently unavailable.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await addToCart({
        type: 'exudos-product',
        exudosProductId: product.id,
        exudosVariantId: selectedVariant.id,
        productName: product.name,
        category: product.category,
        quantity,
        unitPrice: selectedVariant.price,
      });

      toast({
        title: 'Added to cart',
        description: `${product.name} has been added to your cart.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add item to cart. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (!match) {
    return (
      <PageWrapper>
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <h1 className="text-3xl font-black text-white mb-4">Product Not Found</h1>
          <Link href="/shop" className="btn-primary inline-block">
            Back to Shop
          </Link>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-6 py-20">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={48} className="text-accent animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="glass-card p-8 text-center">
            <Package size={48} className="text-red-400/50 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Unable to Load Product</h3>
            <p className="text-white/60 mb-4">{error}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={fetchProduct} className="btn-primary">
                Try Again
              </button>
              <Link href="/shop" className="btn-secondary">
                Back to Shop
              </Link>
            </div>
          </div>
        )}

        {/* Product Content */}
        {!loading && !error && product && selectedVariant && (
          <>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-white/60 mb-8">
              <Link href="/shop" className="hover:text-white transition-colors">
                Shop
              </Link>
              <span>/</span>
              <Link
                href={`/shop/category/${categoryIdMap[product.category] || 'accounts'}`}
                className="hover:text-white transition-colors"
              >
                {product.category}
              </Link>
              <span>/</span>
              <span className="text-white/90">{product.name}</span>
            </div>

            <div className="grid lg:grid-cols-[1.2fr_1fr] gap-16">
              {/* Product Image - Larger and cleaner */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-card p-0 overflow-hidden"
              >
                <div className="aspect-square bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Package size={160} className="text-white/20 relative z-10 group-hover:scale-110 transition-transform duration-500" />
                </div>
              </motion.div>

              {/* Product Info */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                {/* Category Badge */}
                <div>
                  <Link
                    href={`/shop/category/${categoryIdMap[product.category] || 'accounts'}`}
                    className="inline-flex items-center gap-2 text-sm font-bold text-accent uppercase tracking-wider hover:text-accent/80 transition-colors px-4 py-2 bg-accent/10 border border-accent/30 rounded-xl"
                  >
                    {product.category}
                  </Link>
                </div>

                {/* Title and Price */}
                <div className="space-y-4">
                  <h1 className="text-4xl md:text-5xl font-black text-white leading-tight">
                    {product.name}
                  </h1>
                  <div className="flex items-center gap-4">
                    <span className="text-5xl font-black text-white">
                      {convertPrice(selectedVariant.price, currency)}
                    </span>
                    {selectedVariant.inStock ? (
                      <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-xl">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-sm text-green-400 font-bold">
                          In Stock
                          {selectedVariant.stock !== null && ` (${selectedVariant.stock})`}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-xl">
                        <span className="text-sm text-red-400 font-bold">
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="glass-card p-6 bg-white/[0.02]">
                  <p className="text-white/70 leading-relaxed text-base">
                    Premium {product.name} from MSK Hub. Instant delivery after payment completion.
                    Full warranty and support included.
                  </p>
                </div>

                {/* Variant Selection */}
                {product.variants.length > 1 && (
                  <div>
                    <label className="text-sm font-bold text-white uppercase tracking-wider block mb-4">
                      Select Variant
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {product.variants.map((variant, idx) => (
                        <button
                          key={variant.id}
                          onClick={() => setSelectedVariant(variant)}
                          disabled={!variant.inStock}
                          className={`rounded-2xl border p-6 text-center transition-all ${
                            selectedVariant.id === variant.id
                              ? 'border-accent bg-accent/10 shadow-lg shadow-accent/20'
                              : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                          } ${!variant.inStock ? 'opacity-40 cursor-not-allowed' : ''}`}
                        >
                          <div className="text-xs text-white/60 mb-2 uppercase tracking-wide">
                            Variant {idx + 1}
                          </div>
                          <div className="text-2xl font-black text-white mb-1">
                            {convertPrice(variant.price, currency)}
                          </div>
                          {variant.stock !== null && variant.inStock && (
                            <div className="text-xs text-white/50 mt-1">{variant.stock} in stock</div>
                          )}
                          {!variant.inStock && (
                            <div className="text-xs text-red-400 font-semibold mt-1">Sold Out</div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity Selector */}
                <div>
                  <label className="text-sm font-bold text-white uppercase tracking-wider block mb-4">
                    Quantity
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 glass-card p-2">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Minus size={18} className="text-white/70" />
                      </button>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-24 h-12 bg-white/[0.04] border border-white/10 rounded-xl text-center text-white font-bold text-lg focus:outline-none focus:border-accent/50"
                        min="1"
                      />
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors"
                      >
                        <Plus size={18} className="text-white/70" />
                      </button>
                    </div>
                    <div className="flex-grow text-right glass-card p-4">
                      <p className="text-sm text-white/50 mb-1">Total Price</p>
                      <p className="text-3xl font-black text-white">
                        {convertPrice(selectedVariant.price * quantity, currency)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Add to Cart Button - Larger */}
                <button
                  onClick={handleAddToCart}
                  disabled={!selectedVariant.inStock || cartLoading}
                  className="btn-primary w-full h-16 flex items-center justify-center gap-3 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cartLoading ? (
                    <>
                      <Loader2 size={24} className="animate-spin" />
                      Adding to Cart...
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={24} />
                      Add to Cart
                    </>
                  )}
                </button>

                {/* Features */}
                <div className="glass-card p-8 bg-white/[0.02]">
                  <h3 className="text-base font-bold text-white uppercase tracking-wider mb-6">
                    What's Included
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      'Instant delivery after payment',
                      'Full warranty included',
                      '24/7 Discord support',
                      'Replacement guarantee',
                      'Secure checkout',
                      'Crypto payment accepted',
                    ].map((feature) => (
                      <div key={feature} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors">
                        <Check size={18} className="text-green-400 shrink-0 mt-0.5" />
                        <span className="text-sm text-white/80 font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </div>
    </PageWrapper>
  );
}
