/**
 * Golden Icon Suite — SVG fixtures for conformance testing.
 * These icons cover simple, medium, and complex shapes.
 */

/** Simple: arrow right */
export const ARROW_RIGHT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path d="M5 12 L19 12 M12 5 L19 12 L12 19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

/** Simple: check mark */
export const CHECK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path d="M20 6 L9 17 L4 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

/** Simple: close (X) */
export const CLOSE_X = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path d="M18 6 L6 18 M6 6 L18 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
</svg>`;

/** Medium: credit card */
export const CREDIT_CARD = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <rect x="2" y="5" width="20" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>
  <line x1="2" y1="10" x2="22" y2="10" stroke="currentColor" stroke-width="2"/>
</svg>`;

/** Medium: user/person */
export const USER_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="2"/>
  <path d="M4 20 C4 16 8 14 12 14 C16 14 20 16 20 20" fill="none" stroke="currentColor" stroke-width="2"/>
</svg>`;

/** Medium: shopping cart */
export const SHOPPING_CART = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path d="M1 1 L5 1 L7 13 L17 13 L19 5 L6 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="9" cy="19" r="2" fill="none" stroke="currentColor" stroke-width="2"/>
  <circle cx="17" cy="19" r="2" fill="none" stroke="currentColor" stroke-width="2"/>
</svg>`;

/** Complex: home */
export const HOME = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path d="M3 12 L5 10 L12 3 L19 10 L21 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M5 10 L5 20 L10 20 L10 14 L14 14 L14 20 L19 20 L19 10" fill="none" stroke="currentColor" stroke-width="2"/>
</svg>`;

/** Complex: settings gear */
export const SETTINGS_GEAR = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/>
  <path d="M12 2 L12 4 M12 20 L12 22 M4.93 4.93 L6.34 6.34 M17.66 17.66 L19.07 19.07 M2 12 L4 12 M20 12 L22 12 M4.93 19.07 L6.34 17.66 M17.66 6.34 L19.07 4.93" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
</svg>`;

/** All golden icons as a named collection */
export const GOLDEN_ICONS = {
  'arrow-right': ARROW_RIGHT,
  'check': CHECK,
  'close-x': CLOSE_X,
  'credit-card': CREDIT_CARD,
  'user': USER_ICON,
  'shopping-cart': SHOPPING_CART,
  'home': HOME,
  'settings-gear': SETTINGS_GEAR,
} as const;

export type GoldenIconName = keyof typeof GOLDEN_ICONS;
