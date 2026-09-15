---
name: Generated hook options
description: A TypeScript compatibility constraint in the generated React Query client.
---

The generated React Query hooks can infer their own query keys when called without a second options object. With the current TanStack Query type definitions, passing a partial `query` options object can incorrectly require `queryKey` at compile time.

**Why:** The generated client and installed TanStack Query types expose `UseQueryOptions` with a required key in this setup, so adding otherwise harmless options such as `refetchOnMount` caused frontend typecheck failures.

**How to apply:** Prefer the shared `QueryClient` defaults for common query behavior. If a page must override query behavior, pass the generated `get…QueryKey()` result explicitly as `queryKey`.