/** Largest accepted contribution: 100 million pesos, in centavos. */
export const MAX_CONTRIBUTION = 10_000_000_000

/** Every amount is a whole number of pesos: a multiple of this many centavos. */
export const CENTAVOS_PER_PESO = 100

export type MoneyParseError = 'format' | 'negative' | 'decimals' | 'max'

export type MoneyParseResult = { ok: true; value: number } | { ok: false; error: MoneyParseError }

// Whole pesos, optionally with `.` thousands groups: 42000 · 180.000
const WHOLE_PESOS = /^(?:\d+|\d{1,3}(?:\.\d{3})+)$/
// Non-zero centavos (checked after ZERO_CENTAVOS): 1500,50 · 1.500,05 · a dot + 1–2 digits, 1500.75
const WITH_CENTAVOS = /^(?:(?:\d+|\d{1,3}(?:\.\d{3})+),\d+|\d+\.\d{1,2})$/
// Whole pesos followed by zero centavos (,0 · ,00 · .0 · .00): accepted, the suffix is dropped.
// "1.000" never matches: three zeros after a dot are a thousands group.
const ZERO_CENTAVOS = /^(\d+|\d{1,3}(?:\.\d{3})+)[,.]0{1,2}$/
// More pesos digits than this always exceeds MAX_CONTRIBUTION.
const MAX_PESOS_DIGITS = 9

/**
 * Parses a user-typed whole-peso amount (es-AR notation) into integer centavos.
 * Non-zero centavos are rejected ("decimals"); a zero suffix like ",00" is accepted.
 * Uses string arithmetic only, never floating point.
 */
export function parseMoney(input: string): MoneyParseResult {
  const raw = input.replace(/\s/g, '').replace(/^\$/, '')
  const compact = ZERO_CENTAVOS.exec(raw)?.[1] ?? raw
  if (compact === '') return { ok: true, value: 0 }
  if (compact.startsWith('-')) return { ok: false, error: 'negative' }
  if (WITH_CENTAVOS.test(compact)) return { ok: false, error: 'decimals' }
  if (!WHOLE_PESOS.test(compact)) return { ok: false, error: 'format' }

  const pesos = compact.replaceAll('.', '').replace(/^0+(?=\d)/, '')
  if (pesos.length > MAX_PESOS_DIGITS) return { ok: false, error: 'max' }

  const value = Number(pesos) * CENTAVOS_PER_PESO
  if (value > MAX_CONTRIBUTION) return { ok: false, error: 'max' }
  return { ok: true, value }
}

const ARS = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

/**
 * Formats whole-peso centavos as es-AR pesos without decimals, e.g. 2911200 → "$ 29.112"
 * (NBSP after "$"). Passes Intl an exact integer string so display never goes through a float.
 */
export function formatMoney(centavos: number): string {
  const sign = centavos < 0 ? '-' : ''
  const pesos = Math.trunc(Math.abs(centavos) / CENTAVOS_PER_PESO)
  return ARS.format(`${sign}${pesos}` as `${number}`)
}
