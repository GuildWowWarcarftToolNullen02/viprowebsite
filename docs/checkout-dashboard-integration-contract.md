# Checkout & Dashboard Integration Contract

**Version:** 1.0  
**Last Updated:** 2026-11-03  
**Owner:** Worker 3 - Checkout & Dashboard

---

## Overview

This document defines the contract between the frontend checkout/dashboard components and the backend API for multi-product purchase flow and order management.

## Architecture

```
[User] → [Enhanced Checkout] → [Payment Gateway] → [Backend API] → [Exudos Store API]
                                                            ↓
                                                    [Order Creation]
                                                            ↓
                                              [Dashboard Order History]
```

---

## 1. Checkout Flow Sequence

### Phase 1: Cart Review
1. User navigates to checkout with cart items
2. Frontend displays all cart items (MSK tools + Exudos products)
3. User can modify quantities or remove items
4. Real-time subtotal and total calculations
5. Currency conversion applied

### Phase 2: Customer Details
1. Email collection (required)
2. Optional notes field
3. Authentication check (required for store products)

### Phase 3: Payment Method Selection
1. Display available payment methods
2. Currently: Cryptocurrency via NowPayments
3. Future: Credit cards, PayPal, etc.

### Phase 4: Payment Processing
1. Frontend creates payment intent via backend API
2. Backend validates cart contents and prices
3. Backend creates NowPayments invoice
4. User redirected to payment gateway
5. User completes payment
6. Payment gateway callback to backend
7. Backend verifies payment status
8. Backend creates orders in systems
9. User redirected to success page

---

## 2. Backend API Endpoints Required

### 2.1 Cart Management (Already Implemented by Worker 1)

**GET** `/api/cart`
- Returns current user's cart
- Response: `{ items: CartItem[], subtotal: number, total: number }`

**POST** `/api/cart/add`
- Add item to cart
- Body: `CartItem`
- Response: Updated cart

**PUT** `/api/cart/update`
- Update item quantity
- Body: `{ itemIndex: number, quantity: number }`
- Response: Updated cart

**DELETE** `/api/cart/remove/:itemIndex`
- Remove item from cart
- Response: Updated cart

**DELETE** `/api/cart/clear`
- Clear entire cart
- Response: Empty cart

### 2.2 Payment Creation & Verification (TO BE IMPLEMENTED BY WORKER 2)

**POST** `/api/payments/create-multi-product`
- Creates payment for multiple products
- **Request Body:**
```typescript
{
  cartItems: CartItem[];
  email: string;
  note?: string;
  userId?: string; // From session
}
```
- **Response (Success):**
```typescript
{
  success: true;
  paymentId: string;
  invoiceUrl: string;
  amount: number;
  currency: string;
  expiresAt: string; // ISO timestamp
}
```
- **Response (Error):**
```typescript
{
  success: false;
  error: string;
}
```

**GET** `/api/payments/verify/:paymentId`
- Verify payment status server-side
- **Response:**
```typescript
{
  success: boolean;
  status: 'pending' | 'processing' | 'confirmed' | 'failed' | 'expired';
  amount: number;
  paidAmount?: number;
  paidAt?: string; // ISO timestamp
}
```

**POST** `/api/payments/webhook`
- Receives payment gateway callbacks
- Validates payment signature
- Triggers order creation flow
- Internal use only

### 2.3 Order Creation (TO BE IMPLEMENTED BY WORKER 2)

**POST** `/api/orders/create`
- Creates orders after confirmed payment
- **CRITICAL: Server-side only, never called from frontend**
- Called internally after payment verification
- **Request Body:**
```typescript
{
  userId: string;
  paymentId: string;
  cartItems: CartItem[];
  email: string;
  totalAmount: number;
}
```
- **Response:**
```typescript
{
  success: boolean;
  orders: {
    orderId: string;
    type: 'msk-tool' | 'exudos-product';
    productId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    error?: string;
  }[];
}
```

**Idempotency Protection:**
- Use `paymentId` as idempotency key
- Duplicate requests return existing orders
- Prevent double-charging

### 2.4 Order History & Details (TO BE IMPLEMENTED BY WORKER 2)

**GET** `/api/orders/history`
- Fetch all orders for authenticated user
- **Query Parameters:**
  - `status?`: Filter by order status
  - `limit?`: Number of orders (default: 50)
  - `offset?`: Pagination offset (default: 0)
- **Response:**
```typescript
{
  orders: Order[];
  total: number;
  hasMore: boolean;
}

interface Order {
  orderId: string;
  userId: string;
  orderDate: string; // ISO timestamp
  status: 'pending' | 'paid' | 'processing' | 'delivered' | 'failed' | 'refunded';
  items: OrderItem[];
  subtotal: number;
  total: number;
  currency: string;
  paymentMethod: string;
  paymentId: string;
}

interface OrderItem {
  type: 'msk-tool' | 'exudos-product';
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  deliveryInfo?: DeliveryInfo;
}

interface DeliveryInfo {
  licenseKey?: string;
  downloadUrl?: string;
  credentials?: { username: string; password: string };
  instructions?: string;
  deliveredAt?: string; // ISO timestamp
}
```

**GET** `/api/orders/:orderId`
- Fetch single order details
- **Security:** Verify order ownership
- **Response:** Full `Order` object with delivery information

---

## 3. Order State Transitions

```
[Cart] → [Payment Created: pending]
           ↓
       [Payment Processing]
           ↓
       [Payment Confirmed] → [Create Orders: processing]
           ↓                      ↓
       [Orders Created]      [Some Failed]
           ↓                      ↓
       [Delivery: delivered]  [Status: failed]
           ↓
       [User Access in Dashboard]
```

### Order Status Definitions

- **pending**: Payment initiated but not yet confirmed
- **paid**: Payment confirmed, awaiting order processing
- **processing**: Order being created in backend systems
- **delivered**: Product delivered (license key, download, etc.)
- **failed**: Order creation or delivery failed
- **refunded**: Payment refunded, order cancelled

---

## 4. Error Handling Strategy

### Customer-Facing Messages

**Never expose raw errors to customers.** Use these sanitized messages:

| Backend Error | Customer Message |
|---------------|------------------|
| Payment gateway timeout | "Payment could not be processed. Please try again." |
| Product out of stock | "Product no longer available. Your cart has been updated." |
| Order creation failed | "Unable to complete purchase. Please contact support." |
| Delivery system error | "Order processing, check back shortly." |
| Invalid cart items | "Some items in your cart are invalid. Please review." |
| Network/DB error | "Service temporarily unavailable. Please try again." |

### Error Logging

Backend must log detailed errors for debugging:
```typescript
{
  timestamp: string;
  userId: string;
  paymentId: string;
  error: string;
  stack: string;
  context: object;
}
```

### Partial Failure Handling

When some products succeed but others fail:
1. Mark successful orders as `delivered`
2. Mark failed orders as `failed`
3. Store error details in order record
4. Display both statuses in dashboard
5. Customer sees mixed success/failure state
6. Support can manually resolve failed items

---

## 5. Security Requirements

### Authentication
- All order endpoints require authenticated session
- Verify `userId` from session, never trust request body
- Use Express session with secure cookies

### Authorization
- Users can only access their own orders
- Verify order ownership on every order detail request
- Admin endpoints require separate admin role check

### Payment Verification
- **CRITICAL:** Never trust frontend payment status
- Always verify payment server-side via payment gateway API
- Check payment amount matches cart total
- Validate payment is not already processed
- Use webhook signature verification

### Data Protection
- Mask sensitive delivery information in API responses
- Only reveal full license keys/credentials in order detail view
- Log access to sensitive order data
- Encrypt sensitive data at rest

---

## 6. Checkout UI Components

### Enhanced Checkout Page (`src/pages/Checkout.tsx`)

**Current State:**
- Handles single MSK tool checkout
- Email input
- Payment method selection (crypto only)
- Redirects to NowPayments

**Enhancements Needed:**

1. **Multi-Product Cart Display**
```typescript
// Display all cart items
{cart.items.map((item, index) => (
  <CartItemRow
    key={index}
    item={item}
    onUpdateQuantity={(qty) => updateQuantity(index, qty)}
    onRemove={() => removeItem(index)}
  />
))}
```

2. **Cart Summary Section**
- Individual item rows with quantity controls
- Remove item buttons
- Subtotal calculation
- Tax line (if applicable)
- Total with currency conversion
- Empty cart state

3. **Unified Product Display**
```typescript
// Support both MSK tools and Exudos products
if (item.type === 'msk-tool') {
  // Display: MSK Token-G - Monthly Plan
} else if (item.type === 'exudos-product') {
  // Display: Product Name - Variant
}
```

4. **Authentication Gate**
```typescript
// Require login for store products
const hasStoreProducts = cart.items.some(
  item => item.type === 'exudos-product'
);

if (hasStoreProducts && !user) {
  // Redirect to login with return URL
  navigate(`/login?from=checkout`);
}
```

5. **Enhanced Payment Flow**
```typescript
// Create payment with full cart
const response = await fetch('/api/payments/create-multi-product', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    cartItems: cart.items,
    email: email.trim(),
    note: note.trim(),
  }),
});
```

---

## 7. Dashboard Order History UI

### New Section in Dashboard (`src/pages/Dashboard.tsx`)

Add new navigation item:
```typescript
{ id: 'orders', label: 'Order History', icon: ShoppingBag }
```

### Order History Component

**Layout:**
- Order list with cards
- Status badges with color coding
- Date and total for each order
- Expandable order details
- Filter by status dropdown
- Empty state for no orders
- Loading states

**Status Badge Colors:**
```typescript
const STATUS_STYLES = {
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  paid: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  processing: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  delivered: 'bg-green-500/10 text-green-400 border-green-500/20',
  failed: 'bg-red-500/10 text-red-400 border-red-500/20',
  refunded: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};
```

**Order Card Structure:**
```tsx
<Card>
  {/* Header */}
  <div className="flex items-center justify-between">
    <div>
      <p className="font-bold">Order #{orderId.slice(-8)}</p>
      <p className="text-xs text-white/40">{formatDate(orderDate)}</p>
    </div>
    <StatusBadge status={order.status} />
  </div>

  {/* Items Summary */}
  <div className="space-y-2">
    {order.items.map(item => (
      <div className="flex items-center justify-between">
        <span>{item.productName} x{item.quantity}</span>
        <span>${item.totalPrice}</span>
      </div>
    ))}
  </div>

  {/* Total */}
  <div className="border-t pt-3">
    <div className="flex items-center justify-between font-bold">
      <span>Total</span>
      <span>${order.total}</span>
    </div>
  </div>

  {/* Delivery Info (if delivered) */}
  {order.status === 'delivered' && (
    <div className="border-t pt-3">
      {order.items.map(item => (
        item.deliveryInfo && (
          <DeliveryInfoDisplay
            productName={item.productName}
            delivery={item.deliveryInfo}
          />
        )
      ))}
    </div>
  )}

  {/* View Details Button */}
  <button onClick={() => viewOrderDetails(order.orderId)}>
    View Full Details
  </button>
</Card>
```

### Order Detail View

**Expandable or Modal:**
- Full order information
- Payment method used
- Payment ID reference
- All product details
- Delivery information with copy buttons
- Download links
- Support contact for failed orders

---

## 8. Mobile Responsiveness

### Checkout Mobile Optimizations

1. **Stack Layout**
   - Order summary moves below form on mobile
   - Full-width cart item cards
   - Touch-friendly quantity controls (+/- buttons)
   - Large tap targets (min 44x44px)

2. **Cart Item Mobile Layout**
```tsx
<div className="flex flex-col sm:flex-row gap-3">
  <img className="w-16 h-16" />
  <div className="flex-1">
    <p className="font-bold">{item.productName}</p>
    <div className="flex items-center justify-between mt-2">
      <QuantityControl />
      <span className="font-bold">${totalPrice}</span>
    </div>
  </div>
</div>
```

3. **Mobile Payment Button**
   - Sticky bottom bar on mobile
   - Large, thumb-friendly button
   - Clear total display

### Dashboard Mobile Optimizations

1. **Order Card Stacking**
   - Vertical layout on mobile
   - Collapsible details
   - Swipe gestures for actions

2. **Filter Dropdown**
   - Native mobile select on small screens
   - Bottom sheet for advanced filters

3. **Delivery Info Display**
   - Scrollable code blocks
   - One-tap copy buttons
   - Download button prominence

---

## 9. Testing Requirements

### Unit Tests

- Cart item calculation logic
- Currency conversion accuracy
- Order status badge rendering
- Error message sanitization

### Integration Tests

- Full checkout flow with mock payment
- Order creation after payment confirmation
- Order history fetching with filters
- Order detail access control
- Partial order failure handling

### E2E Tests

- Complete purchase flow: cart → checkout → payment → dashboard
- Multi-product cart checkout
- Failed payment handling
- Order history display after purchase
- Mobile responsive behavior

---

## 10. Coordination Notes

### Dependencies on Worker 2

**BLOCKED until Worker 2 provides:**

1. `/api/payments/create-multi-product` endpoint
2. `/api/payments/verify/:paymentId` endpoint
3. `/api/orders/create` internal endpoint
4. `/api/orders/history` endpoint
5. `/api/orders/:orderId` endpoint

**Can proceed without Worker 2:**

1. ✅ UI design and layout
2. ✅ Component structure
3. ✅ Mock data integration
4. ✅ Responsive design
5. ✅ Routing setup
6. ✅ Documentation

### API Contract Confirmation

Once Worker 2 provides their API specification, Worker 3 will:
1. Review endpoint contracts
2. Verify request/response formats match this document
3. Test integration with actual endpoints
4. Report any discrepancies
5. Proceed with full implementation

---

## 11. Implementation Phases

### Phase 1: Design & UI (Can start now)
- ✅ Enhanced checkout layout with cart display
- ✅ Dashboard order history section design
- ✅ Mobile responsive design
- ✅ Component structure
- ✅ Mock data integration

### Phase 2: Backend Integration (After Worker 2)
- Call multi-product payment endpoint
- Implement payment verification
- Integrate order creation flow
- Fetch and display order history
- Handle delivery information display

### Phase 3: Error Handling & Polish
- Implement sanitized error messages
- Add loading states
- Add empty states
- Handle edge cases
- Add retry logic

### Phase 4: Testing & Validation
- Write unit tests
- Write integration tests
- Manual E2E testing
- Mobile device testing
- Cross-browser testing

---

## Status

**Current State:** Phase 1 in progress  
**Blocking Items:** Worker 2 backend API implementation  
**Next Steps:**
1. Complete UI design and layout
2. Wait for Worker 2's API contract
3. Integrate backend endpoints
4. Test end-to-end flow
5. Deploy to production

---

## Contact

For questions or clarifications about this contract:
- Frontend (Worker 3): Checkout & Dashboard implementation
- Backend (Worker 2): API endpoints and order management
- Cart Context (Worker 1): Cart state management
