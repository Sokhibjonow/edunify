import type { z } from 'zod'
import type {
  branchManagerSchema,
  branchAdministratorSchema,
  branchTeacherSchema,
  branchSchema,
  createBranchInputSchema,
  updateBranchInputSchema,
  assignBranchManagerInputSchema,
  assignBranchAdministratorInputSchema,
  assignBranchTeacherInputSchema,
} from '@/schemas/branchSchemas'

export type Branch = z.infer<typeof branchSchema>
export type BranchManager = z.infer<typeof branchManagerSchema>
export type BranchAdministrator = z.infer<typeof branchAdministratorSchema>
export type BranchTeacher = z.infer<typeof branchTeacherSchema>
export type CreateBranchInput = z.infer<typeof createBranchInputSchema>
export type UpdateBranchInput = z.infer<typeof updateBranchInputSchema>
export type AssignBranchManagerInput = z.infer<typeof assignBranchManagerInputSchema>
export type AssignBranchAdministratorInput = z.infer<typeof assignBranchAdministratorInputSchema>
export type AssignBranchTeacherInput = z.infer<typeof assignBranchTeacherInputSchema>
