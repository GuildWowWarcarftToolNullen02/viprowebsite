# Backend API Requirements for Worker 2

**From:** Worker 3 (Checkout & Dashboard)  
**Date:** 2026-11-03  
**Status:** BLOCKED - Waiting for implementation

---

## Executive Summary

Frontend checkout and dashboard UI are complete. **4 critical backend endpoints** are missing to complete integration.

---

## ✅ Already Implemented (Working)

- `GET /api/cart` - Cart fetching
- `POST /api/cart/add` - Add to cart
- `PUT /api/cart/update` - Update quantity
- `DELETE /api/cart/remove/:itemIndex` - Remove item
- `POST /api/payments/create` - MSK tool payment (legacy)
- `GET /api/payments/status/:orderId` - Payment status
- `POST /api/exudos/orders/create` - Single order creation
- `GET /api/exudos/orders/:orderId` - Single order detail

---

## ❌ Missing Endpoints (CRITICAL)

### 1. Multi-Product Payment Creation

**`POST /api/payments/create-cart`**

Create payment for entire cart (MSK tools + Exudos products).

**Request:**
```json
{
  "cartItems": [
    {
      "type": "msk-tool" | "exudos-product",
      "mskProductId"?: "token-g",
      "mskPlan"?: "lifetime",
      "exudosProductId"?: 123,
      "exudosVariantId"?: 456,
      "productName": "MSK Token-G",
      "quantity": 1,
      "unitPrice": 20.00,
      "totalPrice": 20.00
    }
  ],
  "email": "customer@example.com",
  "note": "optional note"
}
```

**Response:**
```json
{
  "invoiceUrl": "https://nowpayments.io/...",
  "paymentId": "uuid",
  "amount": 40.00,
  "orderId": "uuid"
}
```

**Requirements:**
1. Validate all cart items against backend prices
2. Create pending Order records for MSK tools
3. Create pending ExudosOrder records for store products
4. Create single NowPayments invoice for total
5. Use nonce validation (X-Request-Timestamp, X-Request-Nonce)
6. Return invoice URL for redirect

**Security:**
- Never trust frontend prices - validate against backend
- Check product/variant availability and stock
- Rate limit to 5 requests/min per IP

---

### 2. Order History (User's Orders)

**`GET /api/orders/history`**

Fetch all orders for authenticated user.

**Query Params:**
- `status?: pending|paid|processing|delivered|failed|refunded`
- `limit?: number` (default: 50, max: 100)
- `offset?: number` (default: 0)

**Response:**
```json
{
  "orders": [
    {
      "orderId": "uuid",
      "orderDate": "2026-11-03T15:30:00Z",
      "status": "delivered",
      "items": [
        {
          "type": "msk-tool",
          "productId": "token-g",
          "productName": "MSK Token-G",
          "quantity": 1,
          "unitPrice": 20.00,
          "totalPrice": 20.00,
          "deliveryInfo": {
            "licenseKey": "MSK-XXXXX-XXXXX-XXXXX",
            "deliveredAt": "2026-11-03T15:31:00Z"
          }
        }
      ],
      "subtotal": 20.00,
      "total": 20.00,
      "currency": "USD",
      "paymentMethod": "Cryptocurrency",
      "paymentId": "uuid"
    }
  ],
  "total": 15,
  "hasMore": true
}
```

**Requirements:**
1. **Authenticate user** (require login session)
2. Query both `Order` and `ExudosOrder` collections
3. Filter by `userId` from session
4. Merge and sort by date (newest first)
5. Map status consistently:
   - Order with licenseKey → 'delivered'
   - ExudosOrder 'completed' → 'delivered'
   - Unify other statuses
6. Include delivery info only for completed orders
7. Support pagination
8. Rate limit to 30 requests/min

**Status Mapping:**
- `pending` → Payment not confirmed
- `paid` → Payment confirmed, processing order
- `processing` → Creating order with supplier
- `delivered` → Order complete, items delivered
- `failed` → Order creation failed
- `refunded` → Payment refunded

---

### 3. Single Order Detail

**`GET /api/orders/:orderId`**

Get full order details with delivery information.

**Response:** Same structure as single order in history endpoint

**Requirements:**
1. **Authenticate user**
2. **Verify ownership:** Check userId matches session
3. Return 404 if order not found or not owned by user
4. Check both Order and ExudosOrder collections
5. Include full delivery details if completed

**Security:**
- Users can only view their own orders
- Mask sensitive info in logs
- Rate limit to 30 requests/min

---

### 4. Payment Webhook Enhancement

**`POST /api/payments/ipn`** (already exists, needs enhancement)

**Current:** Only handles single MSK tool orders  
**Required:** Handle multi-product cart orders

**Enhancement:**
When payment confirmed:
1. Find all pending orders linked to `paymentId`
2. Update all Order/ExudosOrder to status='paid'
3. Fulfill each order:
   - MSK tools: Call KeyAuth fulfillment (already implemented)
   - Exudos products: Call `/api/exudos/orders/create` for each
4. Update status to 'completed' or 'failed' based on results
5. Send confirmation email with all license keys/delivery info

**Idempotency:**
- Use paymentId as idempotency key
- If webhook fires multiple times, don't duplicate orders

---

## Implementation Priority

1. **Order History** (HIGH) - Simplest, no payment logic
2. **Order Detail** (HIGH) - Similar to history
3. **Cart Payment Creation** (HIGH) - Complex, critical path
4. **Webhook Enhancement** (MEDIUM) - Ties everything together

---

## Questions for Worker 2

1. **NowPayments multi-product:** Can one invoice handle mixed MSK + Exudos products?
2. **Order grouping:** Should orders share parent `paymentId` or be independent?
3. **Status mapping:** Confirm Order 'paid' + licenseKey → display as 'delivered'?
4. **Delivery format:** Should ExudosOrder.deliveredContent be parsed JSON or raw strings?

---

## Timeline

Worker 3 frontend is **100% complete** and blocked waiting for these APIs.

**Estimated integration time after APIs ready:** 4-6 hours

---

## Contact

Worker 3 is monitoring the board and ready to integrate immediately when endpoints are deployed.

File bugs or questions to the board with tag `@worker3`.
