import { z } from 'zod'
import { authUserSchema } from '@/schemas/authSchemas'
import { connectCodeSchema } from '@/schemas/connectCodeSchemas'

export const branchSchema = z.object({
  id: connectCodeSchema,
  organizationId: z.string(),
  name: z.string(),
  createdAt: z.string(),
})

export const createBranchInputSchema = z.object({
  name: z.string().trim().min(1),
})

export const updateBranchInputSchema = createBranchInputSchema

export const assignBranchManagerInputSchema = z.object({
  name: z.string().trim().min(1),
  managerId: z.string().trim().min(1),
})

export const assignBranchAdministratorInputSchema = z.object({
  administratorId: z.string().trim().min(1),
})

export const assignBranchTeacherInputSchema = z.object({
  teacherId: z.string().trim().min(1),
})

export const branchManagerSchema = authUserSchema.pick({
  uniqueId: true,
  name: true,
  surname: true,
})

export const branchAdministratorSchema = authUserSchema.pick({
  uniqueId: true,
  name: true,
  surname: true,
})

export const branchTeacherSchema = authUserSchema.pick({
  uniqueId: true,
  name: true,
  surname: true,
})

export const pageSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
  })
