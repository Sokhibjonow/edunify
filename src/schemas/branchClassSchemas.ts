import { z } from 'zod'
import { classSchema } from '@/schemas/teacherClassSchemas'

const month = z.string().regex(/^\d{4}-\d{2}$/)
const price = z.number().int().min(0)

/** A class as staff see it: the teacher's name and the fee now / next scheduled change. */
export const branchClassSchema = classSchema.extend({
  teacher: z.object({ uniqueId: z.string(), name: z.string(), surname: z.string() }).nullable(),
  currentPrice: z.number(),
  nextPrice: z.object({ price: z.number(), effectiveFrom: month }).nullable(),
})

export const createBranchClassInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  classPrice: price,
  teacherId: z.string().nullable(),
})

export const updateBranchClassInputSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  teacherId: z.string().nullable().optional(),
  price: z.object({ amount: price, effectiveFrom: month }).optional(),
})
