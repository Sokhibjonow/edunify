import { z } from 'zod'

const monthSchema = z.string().regex(/^\d{4}-\d{2}$/)

export const statisticsPeriodSchema = z
  .object({
    from: monthSchema,
    to: monthSchema,
  })
  .refine((data) => data.from <= data.to, { message: 'from must be before or equal to to' })

export const countMetricSchema = z.object({
  count: z.number(),
  delta: z.number().nullable(),
})

export const expectedRevenueMetricSchema = z.object({
  amount: z.number(),
  changePct: z.number().nullable(),
})

export const attendanceCountsSchema = z.object({
  present: z.number(),
  total: z.number(),
})

export const paymentCountsSchema = z.object({
  paid: z.number(),
  total: z.number(),
})

export const statisticsSnapshotSchema = z.object({
  students: countMetricSchema,
  classes: countMetricSchema,
  teachers: countMetricSchema,
  averageAttendance: z.number(),
  attendanceToday: z.number(),
  averageAttendanceCounts: attendanceCountsSchema,
  attendanceTodayCounts: attendanceCountsSchema,
  paymentCounts: paymentCountsSchema,
  revenue: z.number(),
  expectedRevenue: expectedRevenueMetricSchema,
})
