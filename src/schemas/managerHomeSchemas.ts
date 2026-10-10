import { z } from 'zod'

/** A teacher in the branch who still has at least one class missing today's attendance. */
export const pendingAttendanceTeacherSchema = z.object({
  teacherId: z.string(),
  name: z.string(),
  surname: z.string(),
  classCategory: z.string(),
  pendingClassCount: z.number(),
})

/** A student in the branch with at least one due or overdue payment. */
export const duePaymentStudentSchema = z.object({
  studentId: z.string(),
  name: z.string(),
  surname: z.string(),
  status: z.enum(['due', 'overdue']),
  /** ISO date the payment was due; `null` when the source record has no due date. */
  dueDate: z.string().nullable(),
})

/** Operational snapshot for a manager's branch home dashboard. */
export const branchOverviewSchema = z.object({
  attendanceTodayPct: z.number(),
  pendingTeachers: z.array(pendingAttendanceTeacherSchema),
  duePayments: z.array(duePaymentStudentSchema),
})
