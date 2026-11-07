/**
 * Payment API Client
 * Handles payment creation for cart-based checkout
 */

export interface CartPaymentItem {
  productId: number;
  variantId: number;
  productName: string;
  category: string;
  quantity: number;
  price: number;
}

export interface CreateCartPaymentRequest {
  cartItems: CartPaymentItem[];
  email: string;
}

export interface CreateCartPaymentResponse {
  success: boolean;
  invoiceUrl: string;
  paymentId: string;
  expiresAt: string;
}

/**
 * Create payment for cart items
 */
export async function createCartPayment(
  request: CreateCartPaymentRequest
): Promise<CreateCartPaymentResponse> {
  const response = await fetch('/api/payments/create-cart', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Payment creation failed' }));
    throw new Error(error.error || 'Unable to create payment. Please try again.');
  }

  return await response.json();
}
