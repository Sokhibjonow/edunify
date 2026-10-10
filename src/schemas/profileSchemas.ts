import { z } from 'zod'

export const profileSchema = z.object({
  uniqueId: z.string(),
  name: z.string(),
  surname: z.string(),
  email: z.string(),
  phone: z.string(),
  organizationName: z.string().nullable(),
})

export const profilePatchInputSchema = z.object({
  name: z.string().trim().min(1),
  surname: z.string().trim().min(1),
  email: z.email(),
  phone: z
    .string()
    .trim()
    .min(1)
    .regex(/^\+?[0-9][0-9\s\-()]{6,}$/),
})

export const changePasswordInputSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(1),
})

export const changePasswordResultSchema = z.object({
  success: z.literal(true),
})
