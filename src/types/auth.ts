import type { z } from 'zod'
import type {
  roleSchema,
  authUserSchema,
  authSessionSchema,
  loginInputSchema,
  signupInputSchema,
  directorSignupInputSchema,
} from '@/schemas/authSchemas'

export type Role = z.infer<typeof roleSchema>
/** Roles that can self-register (edunify_admin is provisioned, not self-served). */
export type SignupRole = Exclude<Role, 'edunify_admin'>
export type AuthUser = z.infer<typeof authUserSchema>
export type AuthSession = z.infer<typeof authSessionSchema>
export type LoginInput = z.infer<typeof loginInputSchema>
export type SignupInput = z.infer<typeof signupInputSchema>
export type DirectorSignupInput = z.infer<typeof directorSignupInputSchema>
