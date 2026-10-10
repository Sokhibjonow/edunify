import { env } from '@/config/env'
import { api, ApiError, type Envelope } from '@/services/api'
import { api as mockApi } from '@/services/mocks/fakeBackend'
import { useAuthStore } from '@/stores/authStore'
import { authSessionSchema, authUserSchema } from '@/schemas/authSchemas'
import type { AuthSession, AuthUser, LoginInput, SignupInput, DirectorSignupInput, SignupRole } from '@/types/auth'

function unwrap<T>(envelope: Envelope<T>): T {
  if (!envelope.ok) throw new ApiError(envelope.error, envelope.status)
  return envelope.data
}

export async function login(input: LoginInput): Promise<AuthSession> {
  if (env.useMocks) {
    const data = unwrap(await mockApi.login(input))
    return authSessionSchema.parse(data)
  }
  const res = await api.post<Envelope<unknown>>('/auth/login', input)
  return authSessionSchema.parse(unwrap(res.data))
}

export async function me(): Promise<AuthUser> {
  if (env.useMocks) {
    const token = useAuthStore.getState().token ?? ''
    const data = unwrap(await mockApi.me(token))
    return authUserSchema.parse(data)
  }
  const res = await api.get<Envelope<unknown>>('/auth/me')
  return authUserSchema.parse(unwrap(res.data))
}

/**
 * Self-service signup for every role except edunify_admin. Creates the account
 * and returns a session — signup logs the user straight in, the same shape as
 * login. The role determines the kind of account created.
 */
export async function signup(
  input: SignupInput | DirectorSignupInput,
  role: SignupRole,
): Promise<AuthSession> {
  if (env.useMocks) {
    const data = unwrap(await mockApi.signup({ role, ...input }))
    return authSessionSchema.parse(data)
  }
  const res = await api.post<Envelope<unknown>>('/auth/signup', { role, ...input })
  return authSessionSchema.parse(unwrap(res.data))
}
