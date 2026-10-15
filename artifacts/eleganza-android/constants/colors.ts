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
    text: '#3b3126',
    tint: '#b85c3d',

    // Core surfaces
    background: '#f7f4ed',
    foreground: '#3b3126',

    // Cards / elevated surfaces
    card: '#faf8f5',
    cardForeground: '#3b3126',

    // Primary action color (buttons, links, active states)
    primary: '#b85c3d',
    primaryForeground: '#f7f4ed',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#e3d8ca',
    secondaryForeground: '#3b3126',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#eae5dc',
    mutedForeground: '#796e63',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#4c6f76',
    accentForeground: '#f7f4ed',

    // Destructive actions (delete, error states)
    destructive: '#b13935',
    destructiveForeground: '#f7f4ed',

    // Borders and input outlines
    border: '#dbd5cc',
    input: '#dbd5cc',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 3,
};

export default colors;
