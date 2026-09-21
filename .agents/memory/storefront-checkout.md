---
name: Storefront checkout
description: Durable rules for the customer checkout flow and order creation.
---

Customer checkout submissions must send product identifiers and quantities only; the server resolves current prices and stock inside a transaction. Customer orders start as `pending` until the team confirms them, and the current supported payment method is cash on delivery.

**Why:** Cart data is client-controlled and can be stale or modified, while inventory and accounting must remain authoritative. Online payment needs a verified provider callback before changing order state.

**How to apply:** Keep public storefront order creation separate from authenticated staff order management. Add online payment only with a real provider session and server-side webhook verification.

Delivery location is collected as a Google Maps URL plus a separate free-text address description. The URL is stored with the order and exposed to staff as a direct map link; it does not require a Google Maps API key.

**Why:** Customers need both a precise pin and human directions such as building details or landmarks, while a link-based flow avoids putting a secret key in the public storefront.

**How to apply:** Keep the map URL required in the public order contract, support both a shared Maps link and a browser geolocation-generated link, and preserve the description alongside it.