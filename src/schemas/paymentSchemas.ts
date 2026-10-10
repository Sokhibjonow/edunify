import { z } from 'zod'

const month = z.string().regex(/^\d{4}-\d{2}$/)

export const billingStatusSchema = z.enum(['paid', 'partial', 'due', 'overdue'])

export const paymentEntrySchema = z.object({
  id: z.string(),
  amount: z.number(),
  paidAt: z.string(),
  note: z.string(),
  recordedBy: z.string().nullable(),
})

/** What one student owes for one class in the month, and what they have paid against it. */
export const billingLineSchema = z.object({
  classId: z.string(),
  className: z.string(),
  studentId: z.string(),
  studentName: z.string(),
  charge: z.number(),
  paid: z.number(),
  balance: z.number(),
  dueDate: z.string(),
  status: billingStatusSchema,
  lastPaidAt: z.string().nullable(),
  payments: z.array(paymentEntrySchema),
})

export const branchPaymentsSchema = z.object({
  month,
  dueDate: z.string(),
  currency: z.string(),
  summary: z.object({
    expected: z.number(),
    collected: z.number(),
    outstanding: z.number(),
    paidCount: z.number(),
    overdueCount: z.number(),
    totalCount: z.number(),
  }),
  items: z.array(billingLineSchema),
})

export const paymentSchema = z.object({
  id: z.string(),
  classId: z.string(),
  studentId: z.string(),
  amount: z.number(),
  currency: z.string(),
  period: month,
  paidAt: z.string(),
  note: z.string(),
  recordedBy: z.string().nullable(),
  recordedAt: z.string(),
})

export const recordPaymentInputSchema = z.object({
  classId: z.string().min(1),
  studentId: z.string().min(1),
  period: month,
  amount: z.number().int().positive(),
  paidAt: z.string().optional(),
  note: z.string(),
})
