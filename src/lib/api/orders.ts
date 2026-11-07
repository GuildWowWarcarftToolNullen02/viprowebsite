/**
 * Orders API Client
 * Handles order history and order details fetching
 */

export interface OrderItem {
  productId?: string | number;
  variantId?: number;
  productName: string;
  quantity: number;
  price: number;
  delivered?: string[];
}

export interface DeliveryInfo {
  type?: string;
  delivered?: string[];
  content?: string[];
  instructions?: string;
}

export interface Order {
  id: string;
  type: 'exudos' | 'msk-tool';
  createdAt: string;
  status: 'pending' | 'processing' | 'delivered' | 'failed' | 'refunded';
  total: number;
  currency: string;
  items: OrderItem[];
  deliveryInfo?: DeliveryInfo;
}

export interface OrderHistoryResponse {
  orders: Order[];
}

export type OrderStatus = 'pending' | 'processing' | 'delivered' | 'failed' | 'refunded';

/**
 * Fetch user's order history
 */
export async function fetchOrderHistory(
  status?: OrderStatus,
  email?: string
): Promise<OrderHistoryResponse> {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (email) params.set('email', email);

  const url = `/api/orders/history${params.toString() ? '?' + params.toString() : ''}`;

  const response = await fetch(url, {
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Please log in to view your order history');
    }
    throw new Error('Unable to load order history. Please try again.');
  }

  return await response.json();
}

/**
 * Fetch single order details
 */
export async function fetchOrderDetails(
  orderId: string,
  email?: string
): Promise<Order> {
  const params = new URLSearchParams();
  if (email) params.set('email', email);

  const url = `/api/orders/${orderId}${params.toString() ? '?' + params.toString() : ''}`;

  const response = await fetch(url, {
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error("You don't have permission to view this order");
    }
    if (response.status === 404) {
      throw new Error('Order not found');
    }
    throw new Error('Unable to load order details. Please try again.');
  }

  return await response.json();
}
