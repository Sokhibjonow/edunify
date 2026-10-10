import type { z } from 'zod'
import type {
  branchClassSchema,
  createBranchClassInputSchema,
  updateBranchClassInputSchema,
} from '@/schemas/branchClassSchemas'

export type BranchClass = z.infer<typeof branchClassSchema>
export type CreateBranchClassInput = z.infer<typeof createBranchClassInputSchema>
export type UpdateBranchClassInput = z.infer<typeof updateBranchClassInputSchema>
