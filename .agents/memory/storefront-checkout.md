---
name: Storefront checkout
description: Durable rules for the customer checkout flow and order creation.
---

Customer checkout submissions must send product identifiers and quantities only; the server resolves current prices and stock inside a transaction. Customer orders start as `pending` until the team confirms them, and the current supported payment method is cash on delivery.

**Why:** Cart data is client-controlled and can be stale or modified, while inventory and accounting must remain authoritative. Online payment needs a verified provider callback before changing order state.

**How to apply:** Keep public storefront order creation separate from authenticated staff order management. Add online payment only with a real provider session and server-side webhook verification.