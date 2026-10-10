/** Whole-sum amount with locale digit grouping, e.g. 1 500 000. Currency label is added by the caller. */
export function formatAmount(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amount)
}

/** YYYY-MM → "October 2026" in the given locale. */
export function formatMonth(month: string, locale: string): string {
  const [y, m] = month.split('-').map(Number)
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(y, m - 1, 1))
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
