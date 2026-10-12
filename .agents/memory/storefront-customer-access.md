---
name: Storefront customer access
description: Account requirements for customer actions in the Eleganza public storefront.
---

Visitors may browse the store without an account. Adding products to the bag or favorites, and opening those commerce lists, requires the customer to sign in or create an account. After authentication, return to the storefront and resume the action they requested. Customer authentication must redirect to the storefront, not the staff admin route.

**Why:** The user explicitly chose guest browsing while requiring an account for product-related actions; customer identity must remain separate from staff access.

**How to apply:** Keep the public storefront route ungated. Gate cart and favorites actions with customer-specific sign-in/sign-up routes, preserve the pending action across authentication, and do not grant staff permissions through customer registration.
