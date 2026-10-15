const dateFormat = new Intl.DateTimeFormat('es-AR', { dateStyle: 'long' })

/** Image header date in long es-AR form, e.g. "15 de octubre de 2026". */
export function formatImageDate(today: Date): string {
  return dateFormat.format(today)
}
