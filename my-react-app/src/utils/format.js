/**
 * Format a price for display in the UI (adds £ prefix).
 * Returns '—' when value is null, undefined, or empty.
 */
export function formatPrice(price) {
  if (price == null || price === '') return '—'
  return `£${price}`
}
