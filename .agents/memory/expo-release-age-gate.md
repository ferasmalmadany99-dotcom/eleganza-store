---
name: Expo package release-age gate
description: Handling pnpm's minimum-age policy when Expo recommends a just-published SDK patch.
---

Expo's package fixer can fail with `ERR_PNPM_NO_MATURE_MATCHING_VERSION` when its recommended patch release is newer than the workspace's minimum-release-age window.

**Why:** the workspace intentionally delays availability of newly published packages as a supply-chain safeguard.

**How to apply:** keep the current locked versions and report the age-gate limitation; retry the normal Expo package check after the release has matured instead of bypassing the policy.
