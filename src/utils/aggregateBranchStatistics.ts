import type {
  AttendanceCounts,
  CountMetric,
  ExpectedRevenueMetric,
  PaymentCounts,
  StatisticsSnapshot,
} from '@/types/statistics'

export function emptyStatisticsSnapshot(): StatisticsSnapshot {
  const zeroCounts: AttendanceCounts = { present: 0, total: 0 }
  return {
    students: { count: 0, delta: null },
    classes: { count: 0, delta: null },
    teachers: { count: 0, delta: null },
    averageAttendance: 0,
    attendanceToday: 0,
    averageAttendanceCounts: zeroCounts,
    attendanceTodayCounts: zeroCounts,
    paymentCounts: { paid: 0, total: 0 },
    revenue: 0,
    expectedRevenue: { amount: 0, changePct: null },
  }
}

export function attendancePctFromCounts(counts: AttendanceCounts): number {
  if (counts.total === 0) return 0
  return Math.round((counts.present / counts.total) * 100)
}

function aggregateCountMetric(metrics: CountMetric[]): CountMetric {
  const count = metrics.reduce((sum, m) => sum + m.count, 0)
  if (metrics.every((m) => m.delta === null)) {
    return { count, delta: null }
  }
  const delta = metrics.reduce((sum, m) => sum + (m.delta ?? 0), 0)
  return { count, delta }
}

function aggregateExpectedRevenue(metrics: ExpectedRevenueMetric[]): ExpectedRevenueMetric {
  const amount = metrics.reduce((sum, m) => sum + m.amount, 0)
  if (metrics.every((m) => m.changePct === null)) {
    return { amount, changePct: null }
  }
  const comparisonTotal = metrics.reduce((sum, m) => {
    if (m.changePct === null) return sum + m.amount
    return sum + m.amount / (1 + m.changePct / 100)
  }, 0)
  if (comparisonTotal === 0) return { amount, changePct: null }
  const changePct = Math.round(((amount - comparisonTotal) / comparisonTotal) * 100)
  if (changePct === 0) return { amount, changePct: null }
  return { amount, changePct }
}

function aggregateAttendanceCounts(counts: AttendanceCounts[]): AttendanceCounts {
  return {
    present: counts.reduce((sum, c) => sum + c.present, 0),
    total: counts.reduce((sum, c) => sum + c.total, 0),
  }
}

function aggregatePaymentCounts(counts: PaymentCounts[]): PaymentCounts {
  return {
    paid: counts.reduce((sum, c) => sum + c.paid, 0),
    total: counts.reduce((sum, c) => sum + c.total, 0),
  }
}

export function aggregateBranchStatistics(branches: StatisticsSnapshot[]): StatisticsSnapshot {
  if (branches.length === 0) return emptyStatisticsSnapshot()
  if (branches.length === 1) return branches[0]

  const averageAttendanceCounts = aggregateAttendanceCounts(
    branches.map((b) => b.averageAttendanceCounts),
  )
  const attendanceTodayCounts = aggregateAttendanceCounts(
    branches.map((b) => b.attendanceTodayCounts),
  )

  return {
    students: aggregateCountMetric(branches.map((b) => b.students)),
    classes: aggregateCountMetric(branches.map((b) => b.classes)),
    teachers: aggregateCountMetric(branches.map((b) => b.teachers)),
    averageAttendance: attendancePctFromCounts(averageAttendanceCounts),
    attendanceToday: attendancePctFromCounts(attendanceTodayCounts),
    averageAttendanceCounts,
    attendanceTodayCounts,
    paymentCounts: aggregatePaymentCounts(branches.map((b) => b.paymentCounts)),
    revenue: branches.reduce((sum, b) => sum + b.revenue, 0),
    expectedRevenue: aggregateExpectedRevenue(branches.map((b) => b.expectedRevenue)),
  }
}
