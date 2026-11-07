# MSK Hub Store API Contract

**Version:** 1.0  
**Last Updated:** November 3, 2026  
**Base URL:** `https://mskhub.store/api`

This document defines the backend API contract for the MSK Hub store, which integrates both MSK proprietary tools and third-party products via the Exudos reseller API.

## Table of Contents

1. [Authentication](#authentication)
2. [Exudos Store Endpoints](#exudos-store-endpoints)
3. [Cart Endpoints](#cart-endpoints)
4. [Data Models](#data-models)
5. [Error Handling](#error-handling)
6. [Order Flow](#order-flow)
7. [Security & White-Label Requirements](#security--white-label-requirements)
8. [Frontend Integration Guide](#frontend-integration-guide)

---

## Authentication

### Session-Based Authentication

The API uses session cookies for authentication. Sessions are stored in MongoDB and persist for 7 days.

**Session Cookie:**
- Name: `connect.sid`
- Domain: `.mskhub.store`
- HttpOnly: `true`
- Secure: `true` (production)
- SameSite: `lax`
- Max-Age: 7 days

**Authenticated Requests:**
- Include credentials in fetch: `credentials: 'include'`
- Session automatically includes `userId` when user is logged in

**Anonymous Requests:**
- Cart operations work with session ID only (no login required)
- Order retrieval requires email parameter for anonymous users

---

## Exudos Store Endpoints

### 1. Get All Products

Fetches all approved Exudos products with MSK Hub pricing (40% markup).

**Endpoint:** `GET /api/exudos/products`

**Rate Limit:** 60 requests/minute

**Cache:** 5 minutes server-side

**Request:**
```http
GET /api/exudos/products
```

**Response:**
```json
{
  "categories": {
    "Streaming": [
      {
        "id": 123,
        "name": "Netflix Premium Account",
        "category": "Streaming",
        "variants": [
          {
            "id": 456,
            "price": 14.00,
            "originalPrice": 16.80,
            "stock": 50,
            "inStock": true
          }
        ]
      }
    ],
    "Music": [...],
    "AI": [...],
    "Software & Tools": [...],
    "VPN & Privacy": [...],
    "Social Boost": [...],
    "Discord Services": [...],
    "Accounts": [...]
  },
  "total": 127
}
```

**Approved Categories:**
1. Accounts
2. Streaming
3. Music
4. AI
5. Software & Tools (excluding MSK proprietary tools)
6. VPN & Privacy
7. Social Boost
8. Discord Services

**Pricing:**
- All prices in USD
- 40% markup applied: `Math.ceil(supplierCost * 1.4 * 100) / 100`
- Ceiling rounding ensures prices always round up to nearest cent

**Filtering:**
- Only products with `price !== null` are included
- Only products with `stock === null || stock > 0` are included
- Only approved categories are returned

---

### 2. Get Single Product

Fetches detailed information about a specific product.

**Endpoint:** `GET /api/exudos/product/:productId`

**Rate Limit:** 60 requests/minute

**Request:**
```http
GET /api/exudos/product/123
```

**Response:**
```json
{
  "id": 123,
  "name": "Netflix Premium Account",
  "category": "Streaming",
  "variants": [
    {
      "id": 456,
      "price": 14.00,
      "originalPrice": 16.80,
      "stock": 50,
      "inStock": true
    },
    {
      "id": 457,
      "price": 21.70,
      "originalPrice": null,
      "stock": null,
      "inStock": true
    }
  ]
}
```

**Error Responses:**
- `400` - Invalid product ID format
- `404` - Product not found or not approved
- `503` - Unable to fetch products from upstream

---

### 3. Create Order (Internal)

**CRITICAL:** This endpoint is called internally after payment confirmation. NOT exposed directly to customers.

**Endpoint:** `POST /api/exudos/orders/create`

**Rate Limit:** 10 requests/minute

**Authentication:** Internal only (called by payment webhook handler)

**Request:**
```json
{
  "orderId": "uuid-generated-order-id"
}
```

**Response - Success:**
```json
{
  "status": "completed",
  "delivered": true,
  "message": "Order completed successfully"
}
```

**Response - Already Processed:**
```json
{
  "status": "completed",
  "message": "Order already processed"
}
```

**Error Responses:**
- `400` - Order ID required / Product no longer available / Price has changed
- `404` - Order not found
- `500` - Failed to process order

**Server-Side Validation:**
1. Verifies order exists and status is 'paid'
2. Validates product/variant still available
3. Validates pricing hasn't changed (prevents manipulation)
4. Updates order status to 'processing'
5. Places order with supplier using idempotency key
6. Saves delivery content and updates status to 'completed'

**Idempotency:**
- Each order has a unique idempotency key
- Safe to retry with same key on 409 responses
- Prevents duplicate orders on network failures

---

### 4. Get Order Status

Retrieves order status and details. Requires ownership verification.

**Endpoint:** `GET /api/exudos/orders/:orderId`

**Authentication:** 
- Authenticated users: Verified by userId in session
- Anonymous users: Requires `?email=customer@example.com` query parameter

**Request (Authenticated):**
```http
GET /api/exudos/orders/abc-123-def-456
Cookie: connect.sid=...
```

**Request (Anonymous):**
```http
GET /api/exudos/orders/abc-123-def-456?email=customer@example.com
```

**Response:**
```json
{
  "orderId": "abc-123-def-456",
  "productName": "Netflix Premium Account",
  "category": "Streaming",
  "quantity": 1,
  "totalPrice": 14.00,
  "status": "completed",
  "createdAt": "2026-11-03T15:30:00.000Z",
  "deliveredAt": "2026-11-03T15:31:00.000Z",
  "deliveredContent": [
    "email:account@example.com",
    "password:securepassword123"
  ]
}
```

**Order Statuses:**
- `pending` - Order created, awaiting payment
- `paid` - Payment confirmed, order queued
- `processing` - Order being placed with supplier
- `completed` - Order fulfilled, content delivered
- `failed` - Order failed (payment issue or supplier error)
- `refunded` - Order refunded

**Security:**
- `deliveredContent` only shown when status is 'completed'
- Ownership verified by userId OR email match
- No internal Exudos details exposed

**Error Responses:**
- `401` - Authentication required or email parameter missing
- `403` - Access denied (ownership verification failed)
- `404` - Order not found
- `500` - Unable to retrieve order status

---

## Cart Endpoints

### 1. Get Cart

Retrieves the current cart for the session/user.

**Endpoint:** `GET /api/cart`

**Rate Limit:** 60 requests/minute

**Request:**
```http
GET /api/cart
Cookie: connect.sid=...
```

**Response:**
```json
{
  "_id": "mongoObjectId",
  "sessionId": "session123",
  "userId": "user456",
  "items": [
    {
      "type": "exudos-product",
      "exudosProductId": 123,
      "exudosVariantId": 456,
      "productName": "Netflix Premium",
      "category": "Streaming",
      "quantity": 1,
      "unitPrice": 14.00,
      "totalPrice": 14.00
    },
    {
      "type": "msk-tool",
      "mskProductId": "token-g",
      "mskPlan": "lifetime",
      "quantity": 1,
      "unitPrice": 50.00,
      "totalPrice": 50.00
    }
  ],
  "subtotal": 64.00,
  "total": 64.00,
  "createdAt": "2026-11-03T15:00:00.000Z",
  "updatedAt": "2026-11-03T15:30:00.000Z"
}
```

**Cart Lifetime:**
- Carts expire after 7 days of inactivity
- Automatic cleanup via MongoDB TTL index

---

### 2. Add to Cart

Adds an item to the cart. Automatically merges if item already exists.

**Endpoint:** `POST /api/cart/add`

**Rate Limit:** 60 requests/minute

**Request - Exudos Product:**
```json
{
  "type": "exudos-product",
  "exudosProductId": 123,
  "exudosVariantId": 456,
  "productName": "Netflix Premium",
  "category": "Streaming",
  "quantity": 1,
  "unitPrice": 14.00
}
```

**Request - MSK Tool:**
```json
{
  "type": "msk-tool",
  "mskProductId": "token-g",
  "mskPlan": "lifetime",
  "quantity": 1,
  "unitPrice": 50.00
}
```

**Response:**
Returns updated cart (same format as GET /api/cart)

**Behavior:**
- If item already exists, quantity is incremented
- If new item, added to cart
- `totalPrice` automatically calculated server-side
- Cart totals recalculated on every save

**Error Responses:**
- `400` - Invalid item data
- `500` - Unable to add item to cart

---

### 3. Update Cart Item

Updates the quantity of an existing cart item.

**Endpoint:** `PUT /api/cart/update`

**Rate Limit:** 60 requests/minute

**Request:**
```json
{
  "itemIndex": 0,
  "quantity": 3
}
```

**Response:**
Returns updated cart

**Error Responses:**
- `400` - Quantity must be at least 1 / Invalid item index
- `500` - Unable to update cart

---

### 4. Remove from Cart

Removes a specific item from the cart.

**Endpoint:** `DELETE /api/cart/remove/:itemIndex`

**Rate Limit:** 60 requests/minute

**Request:**
```http
DELETE /api/cart/remove/0
```

**Response:**
Returns updated cart

**Error Responses:**
- `400` - Invalid item index
- `500` - Unable to remove item

---

### 5. Clear Cart

Removes all items from the cart.

**Endpoint:** `DELETE /api/cart/clear`

**Rate Limit:** 60 requests/minute

**Request:**
```http
DELETE /api/cart/clear
```

**Response:**
```json
{
  "_id": "mongoObjectId",
  "sessionId": "session123",
  "items": [],
  "subtotal": 0,
  "total": 0
}
```

---

## Data Models

### ExudosOrder

```typescript
{
  _id: ObjectId
  internalId: string           // UUID for this order
  
  // Customer
  email: string                // Customer email
  userId?: string              // If logged in
  
  // Product details
  productId: number            // Exudos product ID
  variantId: number            // Exudos variant ID
  productName: string          // Display name
  variantName?: string         // Variant name
  category: string             // Product category
  
  // Pricing
  quantity: number             // Quantity ordered
  unitPrice: number            // MSK selling price (after markup)
  totalPrice: number           // Total charged to customer
  supplierCost: number         // What we paid supplier
  
  // Status
  status: ExudosOrderStatus    // pending | paid | processing | completed | failed | refunded
  
  // Payment tracking
  nowPaymentsPaymentId?: string
  nowPaymentsRealPaymentId?: string
  
  // Internal tracking (NEVER exposed to customers)
  exudosInvoiceId?: number
  idempotencyKey: string       // For safe retries
  
  // Delivery
  deliveredContent?: string[]  // Account details, keys, etc.
  deliveryNote?: string
  
  // Error tracking (internal only)
  errorMessage?: string
  retryCount: number
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
  paidAt?: Date
  deliveredAt?: Date
}
```

### Cart

```typescript
{
  _id: ObjectId
  
  // Ownership
  sessionId?: string           // For anonymous users
  userId?: string              // For logged-in users
  
  // Items
  items: CartItem[]
  
  // Totals
  subtotal: number
  total: number
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
  expiresAt: Date             // Auto-delete after 7 days
}
```

### CartItem

```typescript
{
  type: 'msk-tool' | 'exudos-product'
  
  // For MSK tools
  mskProductId?: string        // 'token-g' | 'raider'
  mskPlan?: string            // 'monthly' | 'lifetime' | 'source'
  
  // For Exudos products
  exudosProductId?: number
  exudosVariantId?: number
  productName?: string
  category?: string
  
  // Common
  quantity: number
  unitPrice: number
  totalPrice: number
}
```

---

## Error Handling

### Standard Error Response

```json
{
  "error": "User-friendly error message"
}
```

### HTTP Status Codes

- `400` - Bad Request (invalid input, validation failed)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (access denied, ownership verification failed)
- `404` - Not Found (resource doesn't exist)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error (unexpected error)
- `503` - Service Unavailable (upstream service down)

### White-Label Error Messages

**CRITICAL:** All errors exposed to customers are white-labeled. No Exudos branding or internal details.

**Upstream API Errors → Customer Messages:**
- `400` → "Invalid product selection. Please try again."
- `401` → "Service temporarily unavailable. Our team has been notified."
- `402` → "This product is currently unavailable. Please contact support."
- `404` → "This product is no longer available."
- `409` → "Order is being processed. Please wait a moment and check your order history."
- `429` → "Too many requests. Please wait a moment and try again."
- `502/503` → "Service temporarily unavailable. Please try again in a few moments."

**Internal Logging:**
- Full error details logged server-side with `[Exudos API]` prefix
- Secrets redacted from logs
- No stack traces sent to customers

---

## Order Flow

### Complete Order Lifecycle

```
1. Customer browses products
   GET /api/exudos/products
   
2. Customer adds to cart
   POST /api/cart/add
   
3. Customer proceeds to checkout
   GET /api/cart
   
4. Create ExudosOrder (status: pending)
   - Generate UUID for internalId
   - Generate idempotency key
   - Calculate pricing with markup
   - Store supplier cost
   
5. Initiate payment (NowPayments)
   POST /api/payments/create
   - Creates NowPayments invoice
   - Links to ExudosOrder
   
6. Customer completes payment
   (External payment gateway)
   
7. Payment webhook received
   POST /api/payments/webhook
   - Validates payment signature
   - Updates order status to 'paid'
   - Triggers order fulfillment
   
8. Order fulfillment (automatic)
   POST /api/exudos/orders/create
   - Validates pricing server-side
   - Updates status to 'processing'
   - Calls Exudos API with idempotency key
   - Saves delivered content
   - Updates status to 'completed'
   
9. Customer receives order
   GET /api/exudos/orders/:orderId?email=...
   - Views order status and delivered content
```

### Idempotency & Retry Logic

**Idempotency Key:**
- Generated once per order: `crypto.randomUUID()`
- Stored in ExudosOrder model
- Sent in `Idempotency-Key` header

**Retry Behavior:**
- Safe to retry with same key
- 409 response = already processing (wait and check status)
- Network failures = retry with same key
- Server validates pricing on every attempt

**Failure Handling:**
- Order status set to 'failed'
- Error message stored (internal only)
- Retry count incremented
- Customer sees white-labeled error

---

## Security & White-Label Requirements

### White-Label Enforcement

**HIGHEST PRIORITY:** Customers must NEVER see raw supplier errors or know we are resellers.

**Requirements:**
1. NO stack traces sent to customers
2. NO Exudos branding, names, or references in responses
3. NO internal URLs or technical details
4. NO authentication failures exposed
5. ALL errors translated to MSK Hub branded messages
6. Detailed internal logs with secrets redacted

### Server-Side Price Validation

**Prevents price manipulation attacks:**
1. Fetch current product price from supplier
2. Compare stored price vs actual price
3. Allow ≤$0.01 difference (rounding tolerance)
4. Reject order if price changed significantly
5. Log all validation failures

### Authentication & Authorization

**Order Access Control:**
- Authenticated users: Verify `req.session.userId === order.userId`
- Anonymous users: Verify `req.query.email === order.email`
- 403 Forbidden if ownership cannot be verified

**Cart Ownership:**
- Session-based for anonymous users
- User-based for logged-in users
- Automatic migration on login (future feature)

### Rate Limiting

**API Rate Limits:**
- Products: 60 req/min per IP
- Orders: 10 req/min per IP
- Cart: 60 req/min per IP

**Upstream Rate Limits:**
- Exudos products: 240 req/min
- Exudos orders: 30 req/min
- Enforced with 250ms minimum interval between requests

### Secrets & Configuration

**Environment Variables:**
```bash
EXUDOS_API_KEY=required           # Supplier API key
EXUDOS_MARKUP_PERCENT=40          # Markup percentage (default 40%)
MONGODB_URI=required              # Database connection
SESSION_SECRET=required           # Session encryption
```

**Security Best Practices:**
- Never commit secrets to git
- Redact secrets from logs
- Validate all inputs
- Rate limit all endpoints
- Use HTTPS only in production

---

## Frontend Integration Guide

### 1. Fetching Products

```typescript
// Fetch all products
const response = await fetch('https://mskhub.store/api/exudos/products', {
  credentials: 'include',
});

const data = await response.json();

// Access products by category
const streamingProducts = data.categories['Streaming'];
```

### 2. Adding to Cart

```typescript
// Add Exudos product to cart
const response = await fetch('https://mskhub.store/api/cart/add', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'exudos-product',
    exudosProductId: 123,
    exudosVariantId: 456,
    productName: 'Netflix Premium',
    category: 'Streaming',
    quantity: 1,
    unitPrice: 14.00,
  }),
});

const updatedCart = await response.json();
```

### 3. Checkout Flow

```typescript
// 1. Get cart contents
const cartResponse = await fetch('https://mskhub.store/api/cart', {
  credentials: 'include',
});
const cart = await cartResponse.json();

// 2. Create payment (implementation depends on payment system)
const paymentResponse = await fetch('https://mskhub.store/api/payments/create', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    items: cart.items,
    email: 'customer@example.com',
  }),
});

const payment = await paymentResponse.json();

// 3. Redirect to payment gateway
window.location.href = payment.paymentUrl;
```

### 4. Checking Order Status

```typescript
// Authenticated user
const response = await fetch(`https://mskhub.store/api/exudos/orders/${orderId}`, {
  credentials: 'include',
});

// Anonymous user
const response = await fetch(
  `https://mskhub.store/api/exudos/orders/${orderId}?email=${email}`,
  { credentials: 'include' }
);

const order = await response.json();

if (order.status === 'completed') {
  console.log('Delivered content:', order.deliveredContent);
}
```

### 5. Error Handling

```typescript
try {
  const response = await fetch('https://mskhub.store/api/exudos/products');
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }
  
  const data = await response.json();
  return data;
  
} catch (error) {
  console.error('API Error:', error.message);
  // Show user-friendly error message
  alert('Unable to load products. Please try again.');
}
```

### 6. TypeScript Types

```typescript
interface ExudosProduct {
  id: number;
  name: string;
  category: string;
  variants: ExudosVariant[];
}

interface ExudosVariant {
  id: number;
  price: number;
  originalPrice: number | null;
  stock: number | null;
  inStock: boolean;
}

interface Cart {
  _id: string;
  sessionId?: string;
  userId?: string;
  items: CartItem[];
  subtotal: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

interface CartItem {
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

interface Order {
  orderId: string;
  productName: string;
  category: string;
  quantity: number;
  totalPrice: number;
  status: 'pending' | 'paid' | 'processing' | 'completed' | 'failed' | 'refunded';
  createdAt: string;
  deliveredAt?: string;
  deliveredContent?: string[];
}
```

---

## Testing

### Test Coverage

Comprehensive tests are available in `backend/src/__tests__/exudos.test.ts`

**Test Categories:**
1. Pricing calculations
2. Product categorization
3. White-label enforcement
4. Product filtering
5. Order validation
6. Price validation (manipulation prevention)
7. Rate limiting
8. Authentication & authorization
9. Cart calculations

**Running Tests:**
```bash
cd backend
npm test
```

---

## Support & Maintenance

### Monitoring

**Key Metrics to Track:**
- API response times
- Error rates by endpoint
- Order success/failure rates
- Price validation failures
- Rate limit violations

**Logging:**
- All errors logged with `console.error()`
- Prefix: `[Exudos API]`, `[Exudos Products]`, `[Exudos Order]`
- Include request context but redact secrets

### Troubleshooting

**Common Issues:**

1. **Products not loading**
   - Check EXUDOS_API_KEY is set
   - Verify network connectivity to exudos.gg
   - Check rate limits (250ms between requests)

2. **Order creation failures**
   - Verify idempotency key is unique
   - Check product still available
   - Validate pricing hasn't changed
   - Review internal error logs

3. **Price validation failures**
   - Product price changed between cart and checkout
   - Stock depleted
   - Customer needs to refresh cart

### Configuration Changes

**To adjust markup percentage:**
```bash
EXUDOS_MARKUP_PERCENT=50  # Change from 40% to 50%
```

**To clear product cache:**
- Wait 5 minutes (automatic expiry)
- Or restart server

---

## Changelog

**Version 1.0 (November 3, 2026)**
- Initial API contract
- Exudos reseller integration complete
- Cart system with mixed products (MSK + Exudos)
- Server-side price validation
- White-label error handling
- Comprehensive test suite
- Full authentication and authorization

---

## Contact

For API questions or issues:
- Internal: Backend team
- Support: support@mskhub.store
- Documentation: This file

**Related Documentation:**
- NowPayments Integration: `/docs/payments-api-contract.md` (if exists)
- MSK Tools API: `/docs/msk-tools-api-contract.md` (if exists)
