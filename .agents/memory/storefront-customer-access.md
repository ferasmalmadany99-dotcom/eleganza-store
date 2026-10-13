---
name: Storefront customer access
description: Account requirements for customer actions in the Eleganza public storefront.
---

On entry, visitors choose to continue as a guest or create an account. Guests may browse, but adding products to the bag or favorites, opening those commerce lists, and placing orders requires a verified customer account. Customer registration collects full name, phone, email, password, and an email verification code. Save the profile in the admin customer directory even before the first order, and return to the storefront after authentication.

Existing verified Clerk accounts may predate the customer profile table; a valid checkout can backfill their profile from the delivery name and phone. Never backfill for unverified users or staff accounts.

**Why:** The user requires guest browsing and a separate verified customer account path; older signed-in accounts without a stored profile must not fail checkout.

**How to apply:** Keep product browsing public. Preserve requested commerce actions through sign-in, save profiles independently from orders, associate purchase history by normalized phone, backfill only verified non-staff accounts, and deny customer accounts access to staff APIs.
