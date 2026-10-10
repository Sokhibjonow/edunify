import { z } from 'zod'
import {
  connectionStatusSchema,
  directorActivationStatusSchema,
} from '@/schemas/connectionSchemas'

export const roleSchema = z.enum([
  'edunify_admin',
  'director',
  'manager',
  'administrator',
  'teacher',
  'student',
  'parent',
])

/**
 * Shared shape for an authenticated user. Role-specific fields beyond the
 * common set are stripped here — the store only needs identity, role, and
 * (for org-scoped roles) the tenancy ids. Same schema validates mock + real.
 */
export const authUserSchema = z.object({
  uniqueId: z.string(),
  name: z.string(),
  surname: z.string(),
  email: z.string(),
  phone: z.string(),
  role: roleSchema,
  organizationId: z.string().optional(),
  branchId: z.string().optional(),
  connectionStatus: connectionStatusSchema.optional(),
  directorActivationStatus: directorActivationStatusSchema.optional(),
  requestedBranchId: z.string().nullable().optional(),
})

export const authSessionSchema = z.object({
  token: z.string(),
  user: authUserSchema,
})

export const loginInputSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
})

export const signupInputSchema = z.object({
  name: z.string().trim().min(1),
  surname: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  email: z.string().trim().min(1),
  password: z.string().min(1),
})

export const directorSignupInputSchema = signupInputSchema.extend({
  organizationName: z.string().trim().min(1),
})
