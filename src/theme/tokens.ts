/**
 * Design tokens for AsadoSplit. One quiet paper-and-charcoal palette plus one memorable element:
 * the pizarra (the chalkboard price board at a carnicería). Pairs are AA-checked in theme.test.ts.
 */
export const tokens = {
  bone: '#F6F1E7', // page and paper background
  boneSunken: '#ECE3D3', // inline notices
  field: '#FFFFFF', // text input fill
  charcoal: '#231C17', // body text
  charcoalSoft: '#5A4E44', // secondary text, input borders
  ember: '#A63A12', // primary actions and focus ring on light surfaces
  onEmber: '#FFFFFF',
  chimichurri: '#2E6B3A', // "Recibe" amounts
  error: '#A3261B', // inline validation messages
  divider: '#D8CDBB', // decorative hairlines only, never the sole carrier of meaning
  pizarra: '#2B2622', // chalkboard surface (summary, snackbar)
  chalk: '#F3EFE6', // text and focus ring on the pizarra
  chalkMuted: '#C9C0B3', // labels on the pizarra
} as const

export const fonts = {
  display: "'Bitter', Georgia, 'Times New Roman', serif",
  body: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
} as const

export const MIN_TOUCH_TARGET = 48
export const FOCUS_RING_WIDTH = 3
