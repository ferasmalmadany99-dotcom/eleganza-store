---
name: Admin sidebar transform
description: Responsive admin sidebars must account for RTL/LTR transform utility ordering.
---

Use an explicit desktop transform override for responsive sidebars when directional transform utilities are also present.

**Why:** Tailwind's generated utility ordering can let `ltr:-translate-x-full` or `rtl:translate-x-full` override the desktop open state, leaving the sidebar space reserved while the menu itself is off-screen.

**How to apply:** Keep the directional transform for the closed mobile drawer, but give the desktop open state an important responsive override such as `lg:!translate-x-0`; verify both the demo and live admin layouts at desktop and mobile widths.