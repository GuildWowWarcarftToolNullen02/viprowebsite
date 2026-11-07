import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useCurrency, convertPrice } from '@/context/CurrencyContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';

interface CartSidebarContentProps {
  onClose: () => void;
}

export function CartSidebarContent({ onClose }: CartSidebarContentProps) {
  const { cart, loading, updateQuantity, removeItem } = useCart();
  const { currency } = useCurrency();
  const [_location, navigate] = useLocation();

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <ShoppingBag size={20} className="text-white/70" />
          <h2 className="text-lg font-bold text-white">Your Cart</h2>
          {cart && cart.items.length > 0 && (
            <span className="text-xs font-semibold text-white/50">
              ({cart.items.length} {cart.items.length === 1 ? 'item' : 'items'})
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
        >
          <X size={16} className="text-white/60" />
        </button>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="popLayout">
          {!cart || cart.items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center h-full text-center py-12"
            >
              <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                <ShoppingBag size={32} className="text-white/30" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Your cart is empty</h3>
              <p className="text-sm text-white/40 mb-6 max-w-xs">
                Add products from our shop to get started
              </p>
              <button
                onClick={() => {
                  onClose();
                  navigate('/shop');
                }}
                className="btn-primary"
              >
                Browse Shop
              </button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {cart.items.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  layout
                  className="bg-white/[0.03] border border-white/10 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-white mb-1 truncate">
                        {item.productName || (item.type === 'msk-tool' ? `${item.mskProductId} - ${item.mskPlan}` : 'Product')}
                      </h3>
                      {item.category && (
                        <p className="text-xs text-white/40 capitalize">{item.category}</p>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(index)}
                      disabled={loading}
                      className="w-7 h-7 rounded-lg bg-white/5 hover:bg-red-500/20 hover:border-red-500/30 border border-white/10 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                      title="Remove item"
                    >
                      <Trash2 size={12} className="text-white/50" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(index, Math.max(1, item.quantity - 1))}
                        disabled={loading || item.quantity <= 1}
                        className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Minus size={12} className="text-white/70" />
                      </button>
                      <span className="text-sm font-semibold text-white w-8 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(index, item.quantity + 1)}
                        disabled={loading}
                        className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus size={12} className="text-white/70" />
                      </button>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <p className="text-xs text-white/40 mb-0.5">
                        {convertPrice(item.unitPrice, currency)} each
                      </p>
                      <p className="text-sm font-bold text-white">
                        {convertPrice(item.totalPrice, currency)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer with totals and checkout */}
      {cart && cart.items.length > 0 && (
        <div className="border-t border-white/10 p-6 space-y-4">
          {/* Totals */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Subtotal</span>
              <span className="font-semibold text-white">
                {convertPrice(cart.subtotal, currency)}
              </span>
            </div>
            <div className="flex items-center justify-between text-base">
              <span className="font-bold text-white">Total</span>
              <span className="font-black text-white text-lg">
                {convertPrice(cart.total, currency)}
              </span>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Proceed to Checkout
            <ArrowRight size={16} />
          </button>

          <p className="text-xs text-center text-white/30">
            Secure checkout with crypto payment
          </p>
        </div>
      )}
    </div>
  );
}
