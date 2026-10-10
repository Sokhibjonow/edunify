import { z } from 'zod'
import { studentSummarySchema } from '@/schemas/teacherClassSchemas'
import { connectCodeSchema } from '@/schemas/connectCodeSchemas'

/** A student of the branch as staff see them: classes, recent attendance, what they owe. */
export const branchStudentSchema = studentSummarySchema.extend({
  classes: z.array(z.object({ id: z.string(), name: z.string() })),
  enrolledAt: z.string(),
  attendance: z.object({
    present: z.number(),
    late: z.number(),
    absent: z.number(),
    excused: z.number(),
    total: z.number(),
    /** Share of `present` over the last 30 days; null when no register was taken. */
    pct: z.number().nullable(),
  }),
  outstanding: z.number(),
  overdue: z.number(),
  unpaid: z.array(z.object({
    classId: z.string(),
    className: z.string(),
    period: z.string(),
    balance: z.number(),
    dueDate: z.string(),
    status: z.enum(['due', 'partial', 'overdue']),
  })),
})

export const branchStudentLookupSchema = z.object({
  uniqueId: z.string(),
  name: z.string(),
  surname: z.string(),
  /** Classes of this branch the student is already in. */
  classIds: z.array(z.string()),
})

export const enrollBranchStudentInputSchema = z.object({
  uniqueId: connectCodeSchema,
  classId: z.string().min(1),
})
