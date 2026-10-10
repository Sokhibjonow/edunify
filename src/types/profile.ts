import type { z } from 'zod'
import type {
  profileSchema,
  profilePatchInputSchema,
  changePasswordInputSchema,
  changePasswordResultSchema,
} from '@/schemas/profileSchemas'

export type Profile = z.infer<typeof profileSchema>
export type ProfilePatchInput = z.infer<typeof profilePatchInputSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>
export type ChangePasswordResult = z.infer<typeof changePasswordResultSchema>
