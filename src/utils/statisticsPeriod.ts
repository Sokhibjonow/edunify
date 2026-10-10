import type { CountMetric, ExpectedRevenueMetric } from '@/types/statistics'

export function addOneMonth(ym: string): string {
  const [year, month] = ym.split('-').map(Number)
  const date = new Date(year, month - 1, 1)
  date.setMonth(date.getMonth() + 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

/** Months from `from` up to (but not including) `to`. Null when single-month selection. */
export function listComparisonMonths(from: string, to: string): string[] | null {
  if (from === to) return null
  const months: string[] = []
  let current = from
  while (current !== to) {
    months.push(current)
    current = addOneMonth(current)
  }
  return months
}

export function buildCountMetric(
  countForMonth: (month: string) => number,
  from: string,
  to: string,
): CountMetric {
  const count = countForMonth(to)
  const comparisonMonths = listComparisonMonths(from, to)
  if (!comparisonMonths) return { count, delta: null }
  const comparisonAvg = Math.round(
    comparisonMonths.reduce((sum, month) => sum + countForMonth(month), 0) / comparisonMonths.length,
  )
  return { count, delta: count - comparisonAvg }
}

export function buildExpectedRevenueMetric(
  amountForMonth: (month: string) => number,
  from: string,
  to: string,
): ExpectedRevenueMetric {
  const amount = amountForMonth(to)
  const comparisonMonths = listComparisonMonths(from, to)
  if (!comparisonMonths) return { amount, changePct: null }
  const comparisonAvg =
    comparisonMonths.reduce((sum, month) => sum + amountForMonth(month), 0) / comparisonMonths.length
  if (comparisonAvg === 0) return { amount, changePct: null }
  const changePct = Math.round(((amount - comparisonAvg) / comparisonAvg) * 100)
  if (changePct === 0) return { amount, changePct: null }
  return { amount, changePct }
}

export function revenueFillPct(revenue: number, expected: number): number {
  if (expected <= 0) return 0
  return Math.min(100, Math.round((revenue / expected) * 100))
}

export function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

/** Valid selectable months, newest first, spanning `count` months back up to the current month. */
export function listSelectableMonths(count = 12): string[] {
  const now = new Date()
  now.setDate(1)
  const months: string[] = []
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return months
}

export function formatMonthLabel(ym: string, locale: string): string {
  const [year, month] = ym.split('-').map(Number)
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
    new Date(year, month - 1, 1),
  )
}
