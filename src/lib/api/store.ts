// Store API client for MSK Hub
// Based on API contract: /api/exudos/* and /api/cart/*

const API_BASE = '/api';

// Types from API contract
export interface ExudosProduct {
  id: number;
  name: string;
  category: string;
  variants: ExudosVariant[];
}

export interface ExudosVariant {
  id: number;
  price: number;
  originalPrice: number | null;
  stock: number | null;
  inStock: boolean;
}

export interface ProductsResponse {
  categories: Record<string, ExudosProduct[]>;
  total: number;
}

export interface CartItem {
  type: 'msk-tool' | 'exudos-product';
  exudosProductId?: number;
  exudosVariantId?: number;
  productName?: string;
  category?: string;
  mskProductId?: string;
  mskPlan?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Cart {
  _id: string;
  sessionId?: string;
  userId?: string;
  items: CartItem[];
  subtotal: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

// Helper function for API calls
async function apiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include', // Include session cookies
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Products API
export const productsApi = {
  // Get all products grouped by category
  async getAll(): Promise<ProductsResponse> {
    return apiCall<ProductsResponse>('/exudos/products');
  },

  // Get single product by ID
  async getById(productId: number): Promise<ExudosProduct> {
    return apiCall<ExudosProduct>(`/exudos/product/${productId}`);
  },

  // Search products (client-side filtering)
  async search(query: string): Promise<ExudosProduct[]> {
    const data = await this.getAll();
    const allProducts = Object.values(data.categories).flat();
    
    const lowerQuery = query.toLowerCase();
    return allProducts.filter(product =>
      product.name.toLowerCase().includes(lowerQuery) ||
      product.category.toLowerCase().includes(lowerQuery)
    );
  },
};

// Cart API
export const cartApi = {
  // Get current cart
  async get(): Promise<Cart> {
    return apiCall<Cart>('/cart');
  },

  // Add item to cart
  async addItem(item: Omit<CartItem, 'totalPrice'>): Promise<Cart> {
    return apiCall<Cart>('/cart/add', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  // Update cart item quantity
  async updateItem(itemIndex: number, quantity: number): Promise<Cart> {
    return apiCall<Cart>('/cart/update', {
      method: 'PUT',
      body: JSON.stringify({ itemIndex, quantity }),
    });
  },

  // Remove item from cart
  async removeItem(itemIndex: number): Promise<Cart> {
    return apiCall<Cart>(`/cart/remove/${itemIndex}`, {
      method: 'DELETE',
    });
  },

  // Clear entire cart
  async clear(): Promise<Cart> {
    return apiCall<Cart>('/cart/clear', {
      method: 'DELETE',
    });
  },
};
