import { z } from 'zod'
import { connectCodeSchema } from '@/schemas/connectCodeSchemas'

export const connectionStatusSchema = z.enum(['connected', 'unconnected'])

export const directorActivationStatusSchema = z.enum(['activated', 'not_activated'])

export const connectionStatusResponseSchema = z.object({
  connectionStatus: connectionStatusSchema,
  requestedBranchId: z.string().nullable(),
  organizationId: z.string().optional(),
  branchId: z.string().optional(),
  directorActivationStatus: directorActivationStatusSchema.optional(),
})

export const connectionRequestInputSchema = z.object({
  branchId: z
    .string()
    .trim()
    .transform((value) => value.toUpperCase())
    .pipe(connectCodeSchema),
})
