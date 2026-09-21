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

All delivery fields are mandatory at both client and server boundaries; whitespace-only values and invalid location URLs must be rejected before an order is created.

**Why:** A partially specified delivery address can make an otherwise valid order impossible to fulfil, and client-side required attributes alone can be bypassed.

**How to apply:** Keep UI validation for immediate feedback, but repeat trimmed-value and URL validation in the public order route.

After a successful customer order, the receipt is offered from the success screen through a printable PDF flow. The receipt includes the order number, customer delivery details, items, total, and cash-on-delivery method.

**Why:** The receipt must download from the success screen without opening a print dialog, while preserving the storefront's Arabic and English content.

**How to apply:** Keep receipt content escaped before rendering it into the temporary PDF canvas, and retain the success screen until the customer closes checkout.

Arabic text in the browser-generated receipt needs an Arabic-capable font and explicit bidi isolation for mixed Arabic, order numbers, phone numbers, URLs, and currency.

**Why:** Canvas PDF rendering can make Arabic labels or mixed RTL/LTR values appear visually incorrect when it falls back to a generic font or inherits the wrong direction.

**How to apply:** Use the storefront's Noto Arabic fonts for Arabic receipts, disable decorative letter spacing on Arabic labels, and mark numeric/URL values as LTR-isolated.

The checkout UI must provide an explicit save action after a customer returns from Google Maps; entering a link alone is not treated as a confirmed location.

**Why:** Google Maps opens outside the storefront, so the customer needs a clear handoff back to the checkout before continuing.

**How to apply:** Keep the save button disabled until a link exists, mark the location saved only after URL validation, and block the review step until that state is true.
