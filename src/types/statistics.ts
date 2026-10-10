export type CountMetric = {
  count: number
  delta: number | null
}

export type AttendanceCounts = {
  present: number
  total: number
}

export type ExpectedRevenueMetric = {
  amount: number
  changePct: number | null
}

export type PaymentCounts = {
  paid: number
  total: number
}

export type StatisticsSnapshot = {
  students: CountMetric
  classes: CountMetric
  teachers: CountMetric
  averageAttendance: number
  attendanceToday: number
  averageAttendanceCounts: AttendanceCounts
  attendanceTodayCounts: AttendanceCounts
  paymentCounts: PaymentCounts
  revenue: number
  expectedRevenue: ExpectedRevenueMetric
}

export type StatisticsPeriod = {
  from: string
  to: string
}
