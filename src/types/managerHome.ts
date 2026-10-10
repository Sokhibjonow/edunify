import type { z } from 'zod'
import type {
  branchOverviewSchema,
  duePaymentStudentSchema,
  pendingAttendanceTeacherSchema,
} from '@/schemas/managerHomeSchemas'

export type PendingAttendanceTeacher = z.infer<typeof pendingAttendanceTeacherSchema>
export type DuePaymentStudent = z.infer<typeof duePaymentStudentSchema>
export type BranchOverview = z.infer<typeof branchOverviewSchema>
