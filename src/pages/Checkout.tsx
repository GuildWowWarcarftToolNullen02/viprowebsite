import { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Loader2, Info, X, Plus, Minus, ShoppingCart, AlertTriangle } from 'lucide-react';
import { useCurrency, convertPrice } from '@/context/CurrencyContext';
import { useAuth } from '@/context/AuthContext';
import { useCart, type CartItem } from '@/context/CartContext';
import { createCartPayment } from '@/lib/api/payments';

const base = import.meta.env.BASE_URL;

// Legacy MSK products for backwards compatibility
const legacyProducts = [
  {
    id: 'token-g',
    name: 'MSK Token-G',
    tagline: 'Professional Discord token generator',
    tiers: [
      { label: 'Monthly', plan: 'monthly', usd: 15, period: '/mo' },
      { label: 'Lifetime', plan: 'lifetime', usd: 20, period: ' one-time' },
      { label: 'Src GUI Rebrand', plan: 'source', usd: 120, period: ' one-time' },
    ],
  },
  {
    id: 'raider',
    name: 'MSK Raider Tool',
    tagline: 'Mass-action Discord tool',
    tiers: [
      { label: 'Monthly', plan: 'monthly', usd: 10, period: '/mo' },
      { label: 'Lifetime', plan: 'lifetime', usd: 20, period: ' one-time' },
      { label: 'Src', plan: 'source', usd: 60, period: ' one-time' },
    ],
  },
];

export default function Checkout() {
  const [_location, navigate] = useLocation();
  const { currency } = useCurrency();
  const { user } = useAuth();
  const { cart, itemCount, loading: cartLoading, updateQuantity, removeItem } = useCart();
  
  // Parse URL params for legacy single-product checkout
  const params = new URLSearchParams(window.location.search);
  const legacyProductId = params.get('product');
  const legacyPlanParam = params.get('plan');
  
  // Check if this is a legacy checkout or cart-based checkout
  const isLegacyCheckout = !!legacyProductId;
  const legacyProduct = legacyProducts.find(p => p.id === legacyProductId);
  
  const [selectedPlan, setSelectedPlan] = useState(legacyPlanParam || legacyProduct?.tiers[1]?.plan || 'lifetime');
  const [email, setEmail] = useState(user?.email || '');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if legacy product not found
  useEffect(() => {
    if (isLegacyCheckout && !legacyProduct) {
      navigate('/shop');
    }
  }, [isLegacyCheckout, legacyProduct, navigate]);

  // Redirect if cart is empty and not legacy checkout
  useEffect(() => {
    if (!isLegacyCheckout && !cartLoading && itemCount === 0) {
      navigate('/shop');
    }
  }, [isLegacyCheckout, cartLoading, itemCount, navigate]);

  // Check if store products require authentication
  const hasStoreProducts = cart?.items.some(item => item.type === 'exudos-product') || false;

  useEffect(() => {
    if (hasStoreProducts && !user) {
      navigate('/login?from=checkout');
    }
  }, [hasStoreProducts, user, navigate]);

  if (isLegacyCheckout && !legacyProduct) return null;
  if (!isLegacyCheckout && (cartLoading || itemCount === 0)) {
    return (
      <PageWrapper>
        <div className="min-h-screen pt-32 pb-16 px-6 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-white/40" />
        </div>
      </PageWrapper>
    );
  }

  // Calculate totals
  let subtotal = 0;
  let total = 0;
  
  if (isLegacyCheckout && legacyProduct) {
    const selectedTier = legacyProduct.tiers.find(t => t.plan === selectedPlan) || legacyProduct.tiers[0];
    subtotal = selectedTier.usd;
    total = selectedTier.usd;
  } else if (cart) {
    subtotal = cart.subtotal;
    total = cart.total;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email is required to receive your license key');
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      if (isLegacyCheckout && legacyProduct) {
        // Legacy single-product checkout (MSK tools)
        const res = await fetch('/api/payments/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Request-Timestamp': String(Date.now()),
            'X-Request-Nonce': nonce,
          },
          body: JSON.stringify({
            product: legacyProduct.id,
            plan: selectedPlan,
            email: email.trim(),
            note: note.trim(),
          }),
        });
        
        const data = await res.json();
        if (!res.ok || !data.invoiceUrl) {
          setError(data.error || 'Failed to create payment. Please try again.');
          setLoading(false);
          return;
        }
        
        window.location.href = data.invoiceUrl;
      } else if (cart && cart.items.length > 0) {
        // Multi-product cart checkout (Exudos products)
        const cartPaymentItems = cart.items
          .filter(item => item.type === 'exudos-product')
          .map(item => ({
            productId: item.exudosProductId!,
            variantId: item.exudosVariantId!,
            productName: item.productName || 'Store Product',
            category: item.category || 'Store',
            quantity: item.quantity,
            price: item.unitPrice,
          }));

        if (cartPaymentItems.length === 0) {
          setError('No valid store products in cart.');
          setLoading(false);
          return;
        }

        const payment = await createCartPayment({
          cartItems: cartPaymentItems,
          email: email.trim(),
        });

        if (payment.success && payment.invoiceUrl) {
          window.location.href = payment.invoiceUrl;
        } else {
          setError('Failed to create payment. Please try again.');
          setLoading(false);
        }
      } else {
        setError('Unable to process checkout. Please try again.');
        setLoading(false);
        return;
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
      setLoading(false);
    }
  }

  async function handleUpdateQuantity(itemIndex: number, newQuantity: number) {
    if (newQuantity < 1) return;
    try {
      await updateQuantity(itemIndex, newQuantity);
    } catch (err) {
      setError('Failed to update quantity. Please try again.');
    }
  }

  async function handleRemoveItem(itemIndex: number) {
    try {
      await removeItem(itemIndex);
    } catch (err) {
      setError('Failed to remove item. Please try again.');
    }
  }

  return (
    <PageWrapper>
      <div className="min-h-screen pt-32 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Back button */}
          <Link href="/shop">
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors mb-8 group">
              <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
              Back to products
            </button>
          </Link>

          {/* Progress steps */}
          <div className="flex items-center gap-3 mb-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                <span className="text-xs font-bold text-black">1</span>
              </div>
              <span className="text-sm font-semibold text-white">Order details</span>
            </div>
            <div className="h-px flex-1 bg-white/10 max-w-24" />
            <div className="flex items-center gap-2 opacity-40">
              <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center">
                <span className="text-xs font-bold text-white/60">2</span>
              </div>
              <span className="text-sm font-medium text-white/60">Payment</span>
            </div>
            <div className="h-px flex-1 bg-white/10 max-w-24" />
            <div className="flex items-center gap-2 opacity-40">
              <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center">
                <span className="text-xs font-bold text-white/60">3</span>
              </div>
              <span className="text-sm font-medium text-white/60">Delivery</span>
            </div>
          </div>

          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Checkout</h1>
          <p className="text-muted-foreground mb-12">Review your order and complete payment — nothing is charged until you confirm.</p>

          <div className="grid lg:grid-cols-[1fr_400px] gap-8">
            {/* Left: Order form */}
            <div className="space-y-6">
              {/* Cart Items (Multi-product checkout only) */}
              {!isLegacyCheckout && cart && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-6 sm:p-8"
                >
                  <div className="flex items-start gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                      <ShoppingCart size={16} className="text-accent" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-white mb-1">Your Cart</h2>
                      <p className="text-sm text-muted-foreground">{itemCount} {itemCount === 1 ? 'item' : 'items'} in your order</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {cart.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/10"
                      >
                        {/* Product Image */}
                        <img 
                          src={`${base}msk-logo.png`} 
                          alt={item.productName || 'Product'} 
                          className="w-16 h-16 rounded-lg object-contain bg-white/5 p-2 shrink-0"
                        />

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white text-sm sm:text-base truncate">
                            {item.productName || (item.type === 'msk-tool' ? item.mskProductId : 'Store Product')}
                          </p>
                          <p className="text-xs text-white/50">
                            {item.type === 'msk-tool' ? `${item.mskPlan} Plan` : item.category || 'Store Item'}
                          </p>
                          <p className="text-xs text-white/40 mt-1">
                            {convertPrice(item.unitPrice, currency)} each
                          </p>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-start">
                          <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
                            <button
                              onClick={() => handleUpdateQuantity(index, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                            >
                              <Minus size={14} className="text-white" />
                            </button>
                            <span className="text-sm font-bold text-white min-w-[2rem] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateQuantity(index, item.quantity + 1)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors active:scale-95"
                            >
                              <Plus size={14} className="text-white" />
                            </button>
                          </div>

                          {/* Item Total */}
                          <div className="flex items-center gap-3">
                            <p className="text-base font-bold text-white">
                              {convertPrice(item.totalPrice, currency)}
                            </p>
                            <button
                              onClick={() => handleRemoveItem(index)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-white/50 hover:text-red-400 transition-colors active:scale-95"
                              title="Remove item"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Delivery details */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: isLegacyCheckout ? 0 : 0.1 }}
                className="glass-card p-6 sm:p-8"
              >
                <div className="flex items-start gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-accent">01</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">Delivery details</h2>
                    <p className="text-sm text-muted-foreground">Your keys and the receipt are sent here, and the same link opens in your panel.</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-white/70 mb-2 uppercase tracking-wider">
                      Email address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-accent/50 focus:bg-white/[0.07] transition-all"
                      required
                    />
                    <p className="text-xs text-white/40 mt-2">Double-check — we cannot recover keys sent to the wrong address.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/70 mb-2 uppercase tracking-wider">
                      Note (optional)
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Any special requests or notes..."
                      maxLength={200}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-accent/50 focus:bg-white/[0.07] transition-all resize-none"
                    />
                    <p className="text-xs text-white/40 mt-2">{note.length}/200 characters</p>
                  </div>
                </form>
              </motion.div>

              {/* Payment method */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: isLegacyCheckout ? 0.1 : 0.2 }}
                className="glass-card p-6 sm:p-8"
              >
                <div className="flex items-start gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-accent">02</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">Payment method</h2>
                    <p className="text-sm text-muted-foreground">You will receive the exact payment instructions before anything is charged.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-4">Crypto</div>
                  
                  {/* NowPayments option */}
                  <div className="relative p-4 rounded-xl border-2 border-accent/40 bg-accent/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                        <img src={`${base}msk-logo.png`} alt="Crypto" className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-white">Cryptocurrency</p>
                        <p className="text-xs text-white/50">BTC, ETH, LTC, USDT, and 150+ coins</p>
                      </div>
                      <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                        <Check size={12} className="text-black font-bold" />
                      </div>
                    </div>
                  </div>

                  {/* Info banner */}
                  <div className="flex gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/10">
                    <Info size={16} className="text-accent shrink-0 mt-0.5" />
                    <p className="text-xs text-white/60 leading-relaxed">
                      Payments are processed securely via NowPayments. No account required - just send crypto and receive your license key instantly.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Error display */}
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3"
                >
                  <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </motion.div>
              )}

              {/* Submit button */}
              <button
                onClick={handleSubmit}
                disabled={loading || !email.trim()}
                className="w-full h-14 rounded-xl bg-accent hover:bg-accent/90 active:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold text-base transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Creating payment...
                  </>
                ) : (
                  <>
                    Continue to payment · {convertPrice(total, currency)}
                  </>
                )}
              </button>

              <p className="text-xs text-center text-white/40">
                Nothing is charged until you confirm on the next step.
              </p>
            </div>

            {/* Right: Order summary */}
            <div className="lg:sticky lg:top-24 h-fit">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: isLegacyCheckout ? 0.2 : 0.3 }}
                className="glass-card p-6"
              >
                <h3 className="text-lg font-bold text-white mb-6">Order summary</h3>

                {/* Legacy single product display */}
                {isLegacyCheckout && legacyProduct && (
                  <>
                    <div className="flex gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/10 mb-6">
                      <img src={`${base}msk-logo.png`} alt={legacyProduct.name} className="w-12 h-12 rounded-lg object-contain" />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-white mb-0.5">{legacyProduct.name}</p>
                        <p className="text-xs text-muted-foreground mb-2">
                          {legacyProduct.tiers.find(t => t.plan === selectedPlan)?.label} - {legacyProduct.tagline}
                        </p>
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-500/10 border border-green-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                          <span className="text-xs font-semibold text-green-400">Instant delivery</span>
                        </div>
                      </div>
                    </div>

                    {/* Plan selector */}
                    <div className="mb-6">
                      <label className="block text-xs font-semibold text-white/70 mb-3 uppercase tracking-wider">
                        Select plan
                      </label>
                      <div className="space-y-2">
                        {legacyProduct.tiers.map((tier) => (
                          <button
                            key={tier.plan}
                            onClick={() => setSelectedPlan(tier.plan)}
                            className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                              selectedPlan === tier.plan
                                ? 'border-accent bg-accent/5'
                                : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-white">{tier.label}</span>
                              <span className="text-sm font-bold text-white">{convertPrice(tier.usd, currency)}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{tier.period}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Multi-product summary */}
                {!isLegacyCheckout && cart && (
                  <div className="mb-6 space-y-2">
                    {cart.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm py-2">
                        <div className="flex-1 min-w-0 pr-3">
                          <p className="text-white font-medium truncate">
                            {item.productName || 'Product'}
                          </p>
                          <p className="text-white/40 text-xs">Qty: {item.quantity}</p>
                        </div>
                        <span className="text-white font-semibold shrink-0">
                          {convertPrice(item.totalPrice, currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="h-px bg-white/10 my-6" />

                {/* Pricing */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-white font-semibold">{convertPrice(subtotal, currency)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxes</span>
                    <span className="text-white/60">Included</span>
                  </div>
                </div>

                <div className="h-px bg-white/10 mb-6" />

                {/* Total */}
                <div className="flex justify-between items-baseline mb-6">
                  <span className="text-base font-bold text-white">Total</span>
                  <div className="text-right">
                    <p className="text-2xl font-black text-white">{convertPrice(total, currency)}</p>
                    <p className="text-xs text-muted-foreground">Charged in {currency.code}</p>
                  </div>
                </div>

                {/* Trust badges */}
                <div className="space-y-2 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <Check size={14} className="text-green-400" />
                    Secure checkout
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <Check size={14} className="text-green-400" />
                    24/7 support
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <Check size={14} className="text-green-400" />
                    Instant delivery
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <Check size={14} className="text-green-400" />
                    Replacement warranty
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
