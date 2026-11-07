import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { cartApi, type Cart, type CartItem } from '@/lib/api/store';

export type { CartItem, Cart };

interface CartContextValue {
  cart: Cart | null;
  itemCount: number;
  loading: boolean;
  addToCart: (item: Omit<CartItem, 'totalPrice'>) => Promise<void>;
  updateQuantity: (itemIndex: number, quantity: number) => Promise<void>;
  removeItem: (itemIndex: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue>({
  cart: null,
  itemCount: 0,
  loading: false,
  addToCart: async () => {},
  updateQuantity: async () => {},
  removeItem: async () => {},
  clearCart: async () => {},
  refreshCart: async () => {},
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);

  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

  // Fetch cart on mount
  useEffect(() => {
    refreshCart();
  }, []);

  async function refreshCart() {
    try {
      const data = await cartApi.get();
      setCart(data);
    } catch (err) {
      console.error('[Cart] Failed to load:', err);
      // Initialize empty cart on error
      setCart({
        _id: '',
        items: [],
        subtotal: 0,
        total: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  async function addToCart(item: Omit<CartItem, 'totalPrice'>) {
    setLoading(true);
    try {
      const data = await cartApi.addItem(item);
      setCart(data);
    } catch (err) {
      console.error('[Cart] Failed to add item:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function updateQuantity(itemIndex: number, quantity: number) {
    setLoading(true);
    try {
      const data = await cartApi.updateItem(itemIndex, quantity);
      setCart(data);
    } catch (err) {
      console.error('[Cart] Failed to update:', err);
    } finally {
      setLoading(false);
    }
  }

  async function removeItem(itemIndex: number) {
    setLoading(true);
    try {
      const data = await cartApi.removeItem(itemIndex);
      setCart(data);
    } catch (err) {
      console.error('[Cart] Failed to remove item:', err);
    } finally {
      setLoading(false);
    }
  }

  async function clearCart() {
    setLoading(true);
    try {
      const data = await cartApi.clear();
      setCart(data);
    } catch (err) {
      console.error('[Cart] Failed to clear:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <CartContext.Provider value={{
      cart,
      itemCount,
      loading,
      addToCart,
      updateQuantity,
      removeItem,
      clearCart,
      refreshCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
