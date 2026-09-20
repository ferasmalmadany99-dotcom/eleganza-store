---
name: Clerk sign-in code flow
description: The Clerk React package exposes two sign-in APIs with different capabilities for email-code flows.
---

For resending an email sign-in code from an authenticated admin view, use the legacy `useSignIn` hook and call `create({ identifier })` followed by `prepareFirstFactor({ strategy: "email_code", emailAddressId })`. Resolve `emailAddressId` from `supportedFirstFactors`.

**Why:** The default `@clerk/react` hook currently exposes the future signal resource, which does not provide `prepareFirstFactor`; using it for this flow fails type checking.

**How to apply:** Keep the legacy import scoped to custom email-code flows; do not replace the app-wide Clerk provider or prebuilt sign-in component.