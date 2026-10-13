/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#352d27',
    tint: '#a1533f',

    // Core surfaces
    background: '#f8f3eb',
    foreground: '#352d27',

    // Cards / elevated surfaces
    card: '#f1e7d9',
    cardForeground: '#352d27',

    // Primary action color (buttons, links, active states)
    primary: '#a1533f',
    primaryForeground: '#fffaf4',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#eee3d5',
    secondaryForeground: '#352d27',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#eee3d5',
    mutedForeground: '#81756a',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#ead6c3',
    accentForeground: '#352d27',

    // Destructive actions (delete, error states)
    destructive: '#b23d35',
    destructiveForeground: '#ffffff',

    // Borders and input outlines
    border: '#d8c9b8',
    input: '#d8c9b8',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 4,
};

export default colors;
