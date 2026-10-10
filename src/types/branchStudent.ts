import type { z } from 'zod'
import type {
  branchStudentSchema,
  branchStudentLookupSchema,
  enrollBranchStudentInputSchema,
} from '@/schemas/branchStudentSchemas'

export type BranchStudent = z.infer<typeof branchStudentSchema>
export type BranchStudentLookup = z.infer<typeof branchStudentLookupSchema>
export type EnrollBranchStudentInput = z.infer<typeof enrollBranchStudentInputSchema>
